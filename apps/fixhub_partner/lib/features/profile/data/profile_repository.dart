import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.read(dioProvider));
});

class TechnicianProfile {
  final String id;
  final bool isAvailable;
  final String verificationStatus;
  final double rating;
  final int totalJobs;
  final String? profilePictureUrl;
  final String? name;
  final String? phone;
  final String? email;
  final List<dynamic> serviceAreas;
  final List<dynamic> specializations;
  final List<dynamic> documents;

  const TechnicianProfile({
    required this.id,
    required this.isAvailable,
    required this.verificationStatus,
    required this.rating,
    required this.totalJobs,
    this.profilePictureUrl,
    this.name,
    this.phone,
    this.email,
    this.serviceAreas = const [],
    this.specializations = const [],
    this.documents = const [],
  });

  factory TechnicianProfile.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return TechnicianProfile(
      id: json['id'] as String,
      isAvailable: json['isAvailable'] as bool? ?? false,
      verificationStatus: json['verificationStatus'] as String? ?? 'PENDING',
      rating: double.tryParse(json['rating'].toString()) ?? 0.0,
      totalJobs: json['totalJobs'] as int? ?? 0,
      profilePictureUrl: json['profilePictureUrl'] as String?,
      name: user?['name'] as String?,
      phone: user?['phone'] as String?,
      email: user?['email'] as String?,
      serviceAreas: json['serviceAreas'] as List<dynamic>? ?? [],
      specializations: json['specializations'] as List<dynamic>? ?? [],
      documents: json['documents'] as List<dynamic>? ?? [],
    );
  }

  String get displayName => name ?? phone ?? 'Technician';
  bool get isVerified => verificationStatus == 'VERIFIED';
}

class ProfileRepository {
  final Dio _dio;

  ProfileRepository(this._dio);

  Future<TechnicianProfile> getProfile() async {
    final response = await _dio.get(ApiEndpoints.technicianProfile);
    return TechnicianProfile.fromJson(_unwrapMap(response.data));
  }

  Future<TechnicianProfile> updateAvailability(
    bool isAvailable, {
    double? lat,
    double? lng,
  }) async {
    final response = await _dio.patch(
      ApiEndpoints.technicianAvailability,
      data: {
        'isAvailable': isAvailable,
        if (lat != null) 'latitude': lat,
        if (lng != null) 'longitude': lng,
      },
    );
    return TechnicianProfile.fromJson(_unwrapMap(response.data));
  }

  Future<TechnicianProfile> updateProfile({
    String? name,
    String? email,
    String? profilePictureUrl,
  }) async {
    final response = await _dio.put(
      ApiEndpoints.technicianProfile,
      data: {
        if (name != null) 'name': name,
        if (email != null) 'email': email,
        if (profilePictureUrl != null) 'profilePictureUrl': profilePictureUrl,
      },
    );
    return TechnicianProfile.fromJson(_unwrapMap(response.data));
  }

  Future<void> updateLocation(double latitude, double longitude) async {
    await _dio.patch(
      ApiEndpoints.technicianLocation,
      data: {'latitude': latitude, 'longitude': longitude},
    );
  }

  Map<String, dynamic> _unwrapMap(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }
}
