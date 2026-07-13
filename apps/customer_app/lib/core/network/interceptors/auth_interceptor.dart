import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../storage/local_storage.dart';

class AuthInterceptor extends Interceptor {
  final Ref _ref;

  AuthInterceptor(this._ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Skip auth for public endpoints
    final publicPaths = ['/auth/otp/send', '/auth/otp/verify'];
    if (publicPaths.any((path) => options.path.contains(path))) {
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
    if (err.response?.statusCode == 401) {
      // TODO: Attempt token refresh
      // If refresh fails, redirect to login
    }
    handler.next(err);
  }
}
