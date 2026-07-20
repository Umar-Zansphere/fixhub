import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/storage/local_storage.dart';
import '../domain/auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(dioProvider), ref.read(localStorageProvider));
});

class AuthRepository {
  final Dio _dio;
  final LocalStorage _storage;

  AuthRepository(this._dio, this._storage);

  /// POST /auth/send-otp
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    final response = await _dio.post(
      ApiEndpoints.sendOtp,
      data: {'phone': phone},
    );
    return _unwrap(response.data);
  }

  /// POST /auth/verify-otp — always TECHNICIAN role for partner app
  Future<AuthUser> verifyOtp(String phone, String otp) async {
    final response = await _dio.post(
      ApiEndpoints.verifyOtp,
      data: {'phone': phone, 'otp': otp, 'role': 'TECHNICIAN'},
    );

    final data = _unwrap(response.data);
    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String;
    final userData = data['user'] as Map<String, dynamic>;

    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
    await _storage.saveUserData(userData);

    return AuthUser.fromJson(userData);
  }

  /// GET /auth/me
  Future<AuthUser> getMe() async {
    final response = await _dio.get(ApiEndpoints.me);
    final data = _unwrap(response.data);
    return AuthUser.fromJson(data);
  }

  /// POST /auth/logout
  Future<void> logout() async {
    try {
      await _dio.post(ApiEndpoints.logout);
    } catch (_) {
      // Always clear local storage even if logout API fails
    } finally {
      await _storage.clearAll();
    }
  }

  /// POST /auth/device — register FCM token
  Future<void> registerDevice(String deviceToken, String platform) async {
    try {
      await _dio.post(
        ApiEndpoints.registerDevice,
        data: {'deviceToken': deviceToken, 'platform': platform},
      );
    } catch (_) {
      // Non-critical — don't throw
    }
  }

  Map<String, dynamic> _unwrap(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }
}
