import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/storage/local_storage.dart';
import '../../../../core/error/failures.dart';

// ── Auth Status ───────────────────────────────────────────────

enum AuthStatus {
  initial,
  loading,
  otpSent,
  verifying,
  authenticated,
  unauthenticated,
  error,
}

// ── Auth State ────────────────────────────────────────────────

class AuthState {
  final AuthStatus status;
  final String? errorMessage;
  final UserModel? user;
  final String? phone;

  const AuthState({
    this.status = AuthStatus.initial,
    this.errorMessage,
    this.user,
    this.phone,
  });

  AuthState copyWith({
    AuthStatus? status,
    String? errorMessage,
    UserModel? user,
    String? phone,
  }) {
    return AuthState(
      status: status ?? this.status,
      errorMessage: errorMessage,
      user: user ?? this.user,
      phone: phone ?? this.phone,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading =>
      status == AuthStatus.loading || status == AuthStatus.verifying;
}

// ── Providers ─────────────────────────────────────────────────

/// Auth repository provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final localStorage = ref.watch(localStorageProvider);
  return AuthRepositoryImpl(AuthRemoteDataSource(dio), localStorage);
});

/// Auth state notifier provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});

// ── Auth Notifier ─────────────────────────────────────────────

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState());

  /// Check if user is already logged in (on app start).
  Future<void> checkAuthStatus() async {
    try {
      final isLoggedIn = await _repository.isLoggedIn();
      if (isLoggedIn) {
        // Try to get cached user first
        final cachedUser = await _repository.getCachedUser();
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: cachedUser,
        );

        // Refresh profile in background
        try {
          final user = await _repository.getProfile();
          state = state.copyWith(user: user);
        } catch (_) {
          // Keep cached user if profile refresh fails
        }
      } else {
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
    } catch (_) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  /// Send OTP to phone number.
  Future<void> sendOtp(String phone) async {
    state = state.copyWith(
      status: AuthStatus.loading,
      phone: phone,
    );
    try {
      await _repository.sendOtp(phone);
      state = state.copyWith(status: AuthStatus.otpSent);
    } on Failure catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.message,
      );
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Failed to send OTP. Please try again.',
      );
    }
  }

  /// Verify OTP and authenticate.
  Future<void> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    state = state.copyWith(status: AuthStatus.verifying);
    try {
      final response = await _repository.verifyOtp(phone: phone, otp: otp);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
      );
    } on Failure catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.message,
      );
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Verification failed. Please try again.',
      );
    }
  }

  /// Resend OTP (resets to otpSent state).
  Future<void> resendOtp() async {
    final phone = state.phone;
    if (phone == null) return;
    await sendOtp(phone);
  }

  /// Fetch profile from API.
  Future<void> refreshProfile() async {
    try {
      final user = await _repository.getProfile();
      state = state.copyWith(user: user);
    } catch (_) {
      // Silently fail — keep existing user data
    }
  }

  /// Logout and clear session.
  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Clear error state.
  void clearError() {
    state = state.copyWith(
      status: state.phone != null ? AuthStatus.otpSent : AuthStatus.unauthenticated,
      errorMessage: null,
    );
  }
}
