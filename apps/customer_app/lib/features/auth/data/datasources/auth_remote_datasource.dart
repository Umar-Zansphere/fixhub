import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

/// Remote data source for authentication API calls.
class AuthRemoteDataSource {
  final Dio _dio;

  AuthRemoteDataSource(this._dio);

  /// POST /auth/send-otp
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    final response = await _dio.post(
      ApiEndpoints.sendOtp,
      data: {'phone': phone},
    );
    return response.data;
  }

  /// POST /auth/verify-otp
  Future<Map<String, dynamic>> verifyOtp({
    required String phone,
    required String otp,
    required String role,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.verifyOtp,
      data: {'phone': phone, 'otp': otp, 'role': role},
    );
    return response.data;
  }

  /// POST /auth/refresh
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _dio.post(
      ApiEndpoints.refreshToken,
      data: {'refreshToken': refreshToken},
    );
    return response.data;
  }

  /// GET /auth/me
  Future<Map<String, dynamic>> getMe() async {
    final response = await _dio.get(ApiEndpoints.me);
    return response.data;
  }

  /// POST /auth/logout
  Future<void> logout() async {
    await _dio.post(ApiEndpoints.logout);
  }
}
