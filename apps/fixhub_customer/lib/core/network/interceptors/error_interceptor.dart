import 'package:dio/dio.dart';
import '../../error/failures.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        throw const NetworkFailure(message: 'Connection timed out');
      case DioExceptionType.connectionError:
        throw const NetworkFailure(message: 'No internet connection');
      case DioExceptionType.badResponse:
        _handleBadResponse(err);
        break;
      default:
        throw const ServerFailure(message: 'Something went wrong');
    }
    handler.next(err);
  }

  void _handleBadResponse(DioException err) {
    final data = err.response?.data;
    final message = data is Map ? (data['message'] ?? 'Server error') : 'Server error';
    final errorCode = data is Map ? data['errorCode'] : null;

    switch (err.response?.statusCode) {
      case 400:
        throw ValidationFailure(message: message, errorCode: errorCode);
      case 401:
        throw AuthFailure(message: message, errorCode: errorCode);
      case 403:
        throw AuthFailure(message: 'Access denied', errorCode: errorCode);
      case 404:
        throw NotFoundFailure(message: message, errorCode: errorCode);
      case 429:
        throw const ServerFailure(message: 'Too many requests. Please wait.');
      default:
        throw ServerFailure(message: message, errorCode: errorCode);
    }
  }
}
