import '../../data/models/auth_response_model.dart';
import '../../data/models/user_model.dart';

/// Abstract auth repository — domain layer contract.
abstract class AuthRepository {
  Future<void> sendOtp(String phone);
  Future<AuthResponseModel> verifyOtp({
    required String phone,
    required String otp,
  });
  Future<UserModel> getProfile();
  Future<void> logout();
  Future<bool> isLoggedIn();
  Future<UserModel?> getCachedUser();
}
