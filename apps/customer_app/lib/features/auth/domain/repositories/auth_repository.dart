/// Abstract auth repository — domain layer contract
abstract class AuthRepository {
  Future<void> sendOtp(String phone);
  Future<Map<String, dynamic>> verifyOtp({required String phone, required String otp});
  Future<void> logout();
  Future<bool> isLoggedIn();
}
