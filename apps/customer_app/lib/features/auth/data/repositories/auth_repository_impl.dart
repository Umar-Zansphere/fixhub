import '../datasources/auth_remote_datasource.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../core/storage/local_storage.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final LocalStorage _localStorage;

  AuthRepositoryImpl(this._remoteDataSource, this._localStorage);

  @override
  Future<void> sendOtp(String phone) async {
    await _remoteDataSource.sendOtp(phone);
  }

  @override
  Future<Map<String, dynamic>> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    final response = await _remoteDataSource.verifyOtp(
      phone: phone,
      otp: otp,
      role: 'CUSTOMER',
    );

    final data = response['data'];
    if (data != null) {
      await _localStorage.saveTokens(
        accessToken: data['accessToken'],
        refreshToken: data['refreshToken'],
      );
      if (data['user'] != null) {
        await _localStorage.saveUserData(Map<String, dynamic>.from(data['user']));
      }
    }

    return data ?? {};
  }

  @override
  Future<void> logout() async {
    await _remoteDataSource.logout();
    await _localStorage.clearAll();
  }

  @override
  Future<bool> isLoggedIn() async {
    return _localStorage.isLoggedIn();
  }
}
