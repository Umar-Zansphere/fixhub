/// Auth state models for the technician app
class AuthUser {
  final String id;
  final String phone;
  final String? name;
  final String? email;
  final String role;
  final String? profilePictureUrl;
  final bool? isAvailable;
  final String? verificationStatus;
  final double? rating;
  final int? totalJobs;

  const AuthUser({
    required this.id,
    required this.phone,
    this.name,
    this.email,
    required this.role,
    this.profilePictureUrl,
    this.isAvailable,
    this.verificationStatus,
    this.rating,
    this.totalJobs,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final profile = json['profile'] as Map<String, dynamic>?;
    return AuthUser(
      id: json['id'] as String,
      phone: json['phone'] as String,
      name: json['name'] as String?,
      email: json['email'] as String?,
      role: json['role'] as String,
      profilePictureUrl: profile?['profilePictureUrl'] as String?,
      isAvailable: profile?['isAvailable'] as bool?,
      verificationStatus: profile?['verificationStatus'] as String?,
      rating: profile?['rating'] != null
          ? double.tryParse(profile!['rating'].toString())
          : null,
      totalJobs: profile?['totalJobs'] as int?,
    );
  }

  String get displayName => name ?? phone;

  bool get isVerified => verificationStatus == 'VERIFIED';
}

sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final AuthUser user;
  const AuthAuthenticated(this.user);
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
}
