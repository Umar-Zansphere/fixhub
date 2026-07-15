import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../data/repositories/location_repository_impl.dart';
import '../../domain/repositories/location_repository.dart';

final locationRepositoryProvider = Provider<LocationRepository>((ref) {
  return LocationRepositoryImpl();
});

final locationPermissionProvider = StateNotifierProvider<LocationPermissionNotifier, bool>((ref) {
  return LocationPermissionNotifier(ref.watch(locationRepositoryProvider));
});

class LocationPermissionNotifier extends StateNotifier<bool> {
  final LocationRepository _repository;

  LocationPermissionNotifier(this._repository) : super(false) {
    _init();
  }

  Future<void> _init() async {
    state = await _repository.checkPermission();
  }

  Future<bool> requestPermission() async {
    final granted = await _repository.requestPermission();
    state = granted;
    return granted;
  }
}
