import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../storage/local_storage.dart';
import '../../../features/auth/presentation/providers/auth_provider.dart';
import '../api_endpoints.dart';
import '../dio_client.dart';

/// Interceptor that attaches JWT access tokens and handles
/// automatic token refresh on 401 responses.
///
/// Key design decisions:
/// - Uses QueuedInterceptor so requests are serialized (no parallel races).
/// - onRequest properly awaits the async token read before calling handler.next.
/// - On 401, only ONE refresh call is made; concurrent 401s are queued and
///   retried after the refresh completes.
/// - Retry injects the new token directly into headers instead of relying
///   on onRequest to re-read from storage (avoids async read race).
class AuthInterceptor extends QueuedInterceptor {
  final Ref _ref;
  bool _isRefreshing = false;
  final List<Completer<String>> _tokenCompleters = [];

  AuthInterceptor(this._ref);

  static const _retryKey = '_authRetry';

  /// Public endpoints that don't require authentication.
  static const _publicPaths = [
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/refresh',
  ];

  bool _isPublic(String path) =>
      _publicPaths.any((p) => path.contains(p));

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for public endpoints
    if (_isPublic(options.path)) {
      return handler.next(options);
    }

    // Skip token injection if this is a retry (token already set)
    if (options.extra[_retryKey] == true) {
      return handler.next(options);
    }

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
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    // Don't try to refresh for auth endpoints themselves
    final path = err.requestOptions.path;
    if (path.contains('/auth/refresh') || path.contains('/auth/logout')) {
      return handler.next(err);
    }

    try {
      final newAccessToken = await _getRefreshedToken(err);
      if (newAccessToken == null) {
        return handler.next(err);
      }

      // Retry original request with the fresh token injected directly
      final retryOptions = err.requestOptions;
      retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';
      retryOptions.extra[_retryKey] = true;  // Mark as retry to skip onRequest token read

      final response = await _ref.read(dioProvider).fetch(retryOptions);
      return handler.resolve(response);
    } catch (e) {
      return handler.next(err);
    }
  }

  /// Returns a fresh access token. If a refresh is already in progress,
  /// this waits for that refresh to complete and returns the same token.
  Future<String?> _getRefreshedToken(DioException originalError) async {
    if (_isRefreshing) {
      // Another refresh is in flight — wait for it
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
        debugPrint('[AuthInterceptor] No refresh token available, forcing logout');
        await _forceLogout();
        _failAllWaiters('No refresh token');
        return null;
      }

      // Use a FRESH Dio instance to avoid interceptor loops
      final freshDio = Dio(BaseOptions(
        baseUrl: originalError.requestOptions.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ));

      debugPrint('[AuthInterceptor] Refreshing token...');

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

      if (newAccessToken != null &&
          newAccessToken.isNotEmpty &&
          newRefreshToken != null &&
          newRefreshToken.isNotEmpty) {
        // Save BOTH tokens before doing anything else
        await localStorage.saveTokens(
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        );

        debugPrint('[AuthInterceptor] Token refreshed successfully');

        // Resolve all waiting completers with the new token
        _resolveAllWaiters(newAccessToken);

        return newAccessToken;
      } else {
        debugPrint('[AuthInterceptor] Refresh response missing tokens');
        await _forceLogout();
        _failAllWaiters('Missing tokens in refresh response');
        return null;
      }
    } on DioException catch (e) {
      debugPrint('[AuthInterceptor] Refresh failed: ${e.response?.statusCode} ${e.message}');
      await _forceLogout();
      _failAllWaiters('Refresh request failed');
      return null;
    } catch (e) {
      debugPrint('[AuthInterceptor] Unexpected refresh error: $e');
      await _forceLogout();
      _failAllWaiters('Unexpected error');
      return null;
    } finally {
      _isRefreshing = false;
    }
  }

  void _resolveAllWaiters(String token) {
    for (final completer in _tokenCompleters) {
      if (!completer.isCompleted) {
        completer.complete(token);
      }
    }
    _tokenCompleters.clear();
  }

  void _failAllWaiters(String reason) {
    for (final completer in _tokenCompleters) {
      if (!completer.isCompleted) {
        completer.completeError(Exception(reason));
      }
    }
    _tokenCompleters.clear();
  }

  Future<void> _forceLogout() async {
    _isRefreshing = false;
    try {
      final localStorage = _ref.read(localStorageProvider);
      await localStorage.clearAll();
      _ref.read(authProvider.notifier).logout();
    } catch (e) {
      debugPrint('[AuthInterceptor] Force logout error: $e');
    }
  }
}
