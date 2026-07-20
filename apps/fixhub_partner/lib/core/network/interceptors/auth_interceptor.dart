import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../storage/local_storage.dart';
import '../api_endpoints.dart';
import '../dio_client.dart';

/// Production auth interceptor with automatic JWT refresh.
/// Uses QueuedInterceptor to serialize requests and prevent parallel refresh races.
class AuthInterceptor extends QueuedInterceptor {
  final Ref _ref;
  bool _isRefreshing = false;
  final List<Completer<String>> _tokenCompleters = [];

  AuthInterceptor(this._ref);

  static const _retryKey = '_authRetry';

  static const _publicPaths = [
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/refresh',
  ];

  bool _isPublic(String path) => _publicPaths.any((p) => path.contains(p));

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (_isPublic(options.path)) return handler.next(options);
    if (options.extra[_retryKey] == true) return handler.next(options);

    try {
      final localStorage = _ref.read(localStorageProvider);
      final accessToken = await localStorage.getAccessToken();
      if (accessToken != null && accessToken.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $accessToken';
      }
    } catch (e) {
      debugPrint('[AuthInterceptor] Failed to read token: $e');
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401) return handler.next(err);

    final path = err.requestOptions.path;
    if (path.contains('/auth/refresh') || path.contains('/auth/logout')) {
      return handler.next(err);
    }

    try {
      final newToken = await _getRefreshedToken(err);
      if (newToken == null) return handler.next(err);

      final retryOptions = err.requestOptions;
      retryOptions.headers['Authorization'] = 'Bearer $newToken';
      retryOptions.extra[_retryKey] = true;

      final response = await _ref.read(dioProvider).fetch(retryOptions);
      return handler.resolve(response);
    } catch (e) {
      return handler.next(err);
    }
  }

  Future<String?> _getRefreshedToken(DioException originalError) async {
    if (_isRefreshing) {
      final completer = Completer<String>();
      _tokenCompleters.add(completer);
      try {
        return await completer.future;
      } catch (_) {
        return null;
      }
    }

    _isRefreshing = true;

    try {
      final localStorage = _ref.read(localStorageProvider);
      final refreshToken = await localStorage.getRefreshToken();

      if (refreshToken == null || refreshToken.isEmpty) {
        await _forceLogout();
        _failAllWaiters('No refresh token');
        return null;
      }

      final freshDio = Dio(
        BaseOptions(
          baseUrl: originalError.requestOptions.baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        ),
      );

      final response = await freshDio.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      final data = response.data;
      final responseData = data is Map && data.containsKey('data')
          ? data['data']
          : data;

      final newAccessToken = responseData?['accessToken'] as String?;
      final newRefreshToken = responseData?['refreshToken'] as String?;

      if (newAccessToken != null && newRefreshToken != null) {
        await localStorage.saveTokens(
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        );
        _resolveAllWaiters(newAccessToken);
        return newAccessToken;
      } else {
        await _forceLogout();
        _failAllWaiters('Missing tokens');
        return null;
      }
    } catch (e) {
      await _forceLogout();
      _failAllWaiters('Refresh failed');
      return null;
    } finally {
      _isRefreshing = false;
    }
  }

  void _resolveAllWaiters(String token) {
    for (final c in _tokenCompleters) {
      if (!c.isCompleted) c.complete(token);
    }
    _tokenCompleters.clear();
  }

  void _failAllWaiters(String reason) {
    for (final c in _tokenCompleters) {
      if (!c.isCompleted) c.completeError(Exception(reason));
    }
    _tokenCompleters.clear();
  }

  Future<void> _forceLogout() async {
    _isRefreshing = false;
    try {
      final localStorage = _ref.read(localStorageProvider);
      await localStorage.clearAll();
    } catch (e) {
      debugPrint('[AuthInterceptor] Force logout error: $e');
    }
  }
}
