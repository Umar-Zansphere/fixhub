import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/storage/local_storage.dart';
import '../data/auth_repository.dart';
import '../domain/auth_state.dart';

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends Notifier<AuthState> {
  late final AuthRepository _repository;
  late final LocalStorage _storage;

  @override
  AuthState build() {
    _repository = ref.watch(authRepositoryProvider);
    _storage = ref.watch(localStorageProvider);
    return const AuthInitial();
  }

  /// Called on app startup — check if already logged in
  Future<void> checkAuthStatus() async {
    state = const AuthLoading();
    try {
      final isLoggedIn = await _storage.isLoggedIn();
      if (!isLoggedIn) {
        state = const AuthUnauthenticated();
        return;
      }
      final user = await _repository.getMe();
      state = AuthAuthenticated(user);
    } catch (_) {
      await _storage.clearAll();
      state = const AuthUnauthenticated();
    }
  }

  /// Send OTP to phone number
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    return _repository.sendOtp(phone);
  }

  /// Verify OTP and log in
  Future<void> verifyOtp(String phone, String otp) async {
    state = const AuthLoading();
    try {
      final user = await _repository.verifyOtp(phone, otp);
      state = AuthAuthenticated(user);
    } catch (e) {
      state = AuthError(e.toString());
      rethrow;
    }
  }

  /// Logout
  Future<void> logout() async {
    await _repository.logout();
    state = const AuthUnauthenticated();
  }
}
