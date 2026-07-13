import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class AuthRemoteDataSource {
  final Dio _dio;

  AuthRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> sendOtp(String phone) async {
    final response = await _dio.post(
      ApiEndpoints.sendOtp,
      data: {'phone': phone},
    );
    return response.data;
  }

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

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _dio.post(
      ApiEndpoints.refreshToken,
      data: {'refreshToken': refreshToken},
    );
    return response.data;
  }

  Future<void> logout() async {
    await _dio.post(ApiEndpoints.logout);
  }
}
