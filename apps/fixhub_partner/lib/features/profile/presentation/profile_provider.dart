import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/profile_repository.dart';
import '../../../core/services/location_service.dart';
import '../../../core/services/location_tracker.dart';

final profileProvider = AsyncNotifierProvider<ProfileNotifier, TechnicianProfile?>(ProfileNotifier.new);

class ProfileNotifier extends AsyncNotifier<TechnicianProfile?> {
  late final ProfileRepository _repository;

  @override
  FutureOr<TechnicianProfile?> build() async {
    _repository = ref.watch(profileRepositoryProvider);
    return _repository.getProfile();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.getProfile());
  }

  Future<void> toggleAvailability(bool isAvailable) async {
    final current = state.value;

    // Grab GPS position before toggling (best-effort; null is OK — backend accepts without it)
    double? lat, lng;
    final locService = ref.read(locationServiceProvider);
    final position = await locService.getCurrentPosition();
    if (position != null) {
      lat = position.latitude;
      lng = position.longitude;
    }

    // Optimistic update
    if (current != null) {
      state = AsyncValue.data(TechnicianProfile(
        id: current.id,
        isAvailable: isAvailable,
        verificationStatus: current.verificationStatus,
        rating: current.rating,
        totalJobs: current.totalJobs,
        profilePictureUrl: current.profilePictureUrl,
        name: current.name,
        phone: current.phone,
        email: current.email,
        serviceAreas: current.serviceAreas,
        specializations: current.specializations,
        documents: current.documents,
      ));
    }

    try {
      final updated = await _repository.updateAvailability(isAvailable, lat: lat, lng: lng);
      state = AsyncValue.data(updated);

      // Start / stop background location tracking
      final tracker = ref.read(locationTrackerProvider);
      if (isAvailable) {
        tracker.start();
      } else {
        tracker.stop();
      }
    } catch (e, st) {
      if (current != null) state = AsyncValue.data(current);
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> updateProfile({String? name, String? email, String? profilePictureUrl}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.updateProfile(
      name: name,
      email: email,
      profilePictureUrl: profilePictureUrl,
    ));
  }
}

// ── Availability toggle (simple bool, used on dashboard) ─────────
final availabilityProvider = Provider<bool>((ref) {
  return ref.watch(profileProvider).value?.isAvailable ?? false;
});
