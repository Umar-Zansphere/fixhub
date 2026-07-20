import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/profile_repository.dart';

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
      final updated = await _repository.updateAvailability(isAvailable);
      state = AsyncValue.data(updated);
    } catch (e, st) {
      // Revert on error
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
