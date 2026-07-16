import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

/// User model matching the backend `/auth/verify-otp` and `/auth/me` response.
@JsonSerializable()
class UserModel {
  const UserModel({
    required this.id,
    required this.phone,
    this.name,
    this.email,
    required this.role,
    this.isActive,
    this.createdAt,
    this.profile,
  });

  final String id;
  final String phone;
  final String? name;
  final String? email;
  final String role;
  final bool? isActive;
  final String? createdAt;
  final CustomerProfile? profile;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  String get displayName => name ?? 'Customer';

  UserModel copyWith({
    String? id,
    String? phone,
    String? name,
    String? email,
    String? role,
    bool? isActive,
    String? createdAt,
    CustomerProfile? profile,
  }) {
    return UserModel(
      id: id ?? this.id,
      phone: phone ?? this.phone,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      profile: profile ?? this.profile,
    );
  }
}

@JsonSerializable()
class CustomerProfile {
  const CustomerProfile({
    required this.id,
    this.profilePictureUrl,
  });

  final String id;
  final String? profilePictureUrl;

  factory CustomerProfile.fromJson(Map<String, dynamic> json) =>
      _$CustomerProfileFromJson(json);

  Map<String, dynamic> toJson() => _$CustomerProfileToJson(this);
}
