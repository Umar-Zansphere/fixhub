import '../datasources/auth_remote_datasource.dart';
import '../models/auth_response_model.dart';
import '../models/user_model.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../core/storage/local_storage.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final LocalStorage _localStorage;

  AuthRepositoryImpl(this._remoteDataSource, this._localStorage);

  @override
  Future<String?> sendOtp(String phone) async {
    final response = await _remoteDataSource.sendOtp(phone);
    final data = response['data'] ?? response;
    return data['devOtp'] as String?;
  }

  @override
  Future<AuthResponseModel> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    final response = await _remoteDataSource.verifyOtp(
      phone: phone,
      otp: otp,
      role: 'CUSTOMER',
    );

    // Unwrap the API response envelope
    final data = response['data'] ?? response;

    final authResponse = AuthResponseModel.fromJson(
      Map<String, dynamic>.from(data),
    );

    // Persist tokens
    await _localStorage.saveTokens(
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    );

    // Persist user data
    await _localStorage.saveUserData(authResponse.user.toJson());

    return authResponse;
  }

  @override
  Future<UserModel> getProfile() async {
    final response = await _remoteDataSource.getMe();

    // Unwrap API response envelope
    final data = response['data'] ?? response;
    final user = UserModel.fromJson(Map<String, dynamic>.from(data));

    // Update cached user data
    await _localStorage.saveUserData(user.toJson());

    return user;
  }

  @override
  Future<void> logout() async {
    try {
      await _remoteDataSource.logout();
    } catch (_) {
      // Even if the API call fails, still clear local data
    }
    await _localStorage.clearAll();
  }

  @override
  Future<bool> isLoggedIn() async {
    return _localStorage.isLoggedIn();
  }

  @override
  Future<UserModel?> getCachedUser() async {
    final data = await _localStorage.getUserData();
    if (data == null) return null;
    try {
      return UserModel.fromJson(data);
    } catch (_) {
      return null;
    }
  }
}
