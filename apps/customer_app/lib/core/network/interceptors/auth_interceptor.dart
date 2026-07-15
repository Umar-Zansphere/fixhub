import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../storage/local_storage.dart';
import '../api_endpoints.dart';
import '../dio_client.dart';

/// Interceptor that attaches JWT access tokens and handles
/// automatic token refresh on 401 responses.
class AuthInterceptor extends QueuedInterceptor {
  final Ref _ref;
  bool _isRefreshing = false;
  final List<_RetryRequest> _pendingRequests = [];

  AuthInterceptor(this._ref);

  /// Public endpoints that don't require authentication.
  static const _publicPaths = [
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/refresh',
  ];

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for public endpoints
    if (_publicPaths.any((path) => options.path.contains(path))) {
      return handler.next(options);
    }

    final localStorage = _ref.read(localStorageProvider);
    final accessToken = await localStorage.getAccessToken();

    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
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

    // Attempt token refresh
    if (!_isRefreshing) {
      _isRefreshing = true;

      try {
        final localStorage = _ref.read(localStorageProvider);
        final refreshToken = await localStorage.getRefreshToken();

        if (refreshToken == null) {
          await _forceLogout();
          return handler.next(err);
        }

        // Use a fresh Dio instance to avoid interceptor loops
        final freshDio = Dio(BaseOptions(
          baseUrl: err.requestOptions.baseUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ));

        final response = await freshDio.post(
          ApiEndpoints.refreshToken,
          data: {'refreshToken': refreshToken},
        );

        final data = response.data;
        final responseData = data is Map && data.containsKey('data')
            ? data['data']
            : data;

        if (responseData != null &&
            responseData['accessToken'] != null &&
            responseData['refreshToken'] != null) {
          await localStorage.saveTokens(
            accessToken: responseData['accessToken'],
            refreshToken: responseData['refreshToken'],
          );

          // Retry the original request with new token
          err.requestOptions.headers['Authorization'] =
              'Bearer ${responseData['accessToken']}';

          // Retry all pending requests
          for (final pending in _pendingRequests) {
            pending.options.headers['Authorization'] =
                'Bearer ${responseData['accessToken']}';
            pending.completer.complete(
              _ref.read(dioProvider).fetch(pending.options),
            );
          }
          _pendingRequests.clear();
          _isRefreshing = false;

          // Retry original request
          final retryResponse =
              await _ref.read(dioProvider).fetch(err.requestOptions);
          return handler.resolve(retryResponse);
        } else {
          await _forceLogout();
          return handler.next(err);
        }
      } on DioException {
        _pendingRequests.clear();
        _isRefreshing = false;
        await _forceLogout();
        return handler.next(err);
      } catch (_) {
        _pendingRequests.clear();
        _isRefreshing = false;
        await _forceLogout();
        return handler.next(err);
      }
    } else {
      // Another refresh is in progress — queue this request
      final completer = Completer<Response>();
      _pendingRequests.add(_RetryRequest(
        options: err.requestOptions,
        completer: completer,
      ));

      try {
        final response = await completer.future;
        return handler.resolve(response);
      } catch (_) {
        return handler.next(err);
      }
    }
  }

  Future<void> _forceLogout() async {
    _isRefreshing = false;
    final localStorage = _ref.read(localStorageProvider);
    await localStorage.clearAll();
    // Navigation to login is handled by the router's auth redirect
  }
}

class _RetryRequest {
  final RequestOptions options;
  final Completer<Response> completer;

  _RetryRequest({required this.options, required this.completer});
}
