import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';
import '../../features/profile/data/profile_repository.dart';

/// Tracks technician location in the background while they are online.
/// Push interval: every 60 seconds OR when they move > 50 m (whichever first).
/// Automatically stops when the provider is disposed (app goes offline / bg-killed).
final locationTrackerProvider = Provider<LocationTracker>((ref) {
  final tracker = LocationTracker(
    locationService: ref.read(locationServiceProvider),
    profileRepository: ref.read(profileRepositoryProvider),
  );
  ref.onDispose(tracker.stop);
  return tracker;
});

class LocationTracker {
  LocationTracker({
    required LocationService locationService,
    required ProfileRepository profileRepository,
  })  : _locationService = locationService,
        _profileRepository = profileRepository;

  final LocationService _locationService;
  final ProfileRepository _profileRepository;

  StreamSubscription<Position>? _positionSub;
  Timer? _throttleTimer;
  DateTime? _lastPushed;

  static const _minInterval = Duration(seconds: 60);

  bool get isTracking => _positionSub != null;

  /// Start pushing location updates to the server.
  Future<void> start() async {
    if (isTracking) return;

    final granted = await _locationService.requestPermission();
    if (!granted) return;

    _positionSub = _locationService.trackPosition(distanceFilterMeters: 50).listen(
      (position) => _onPosition(position),
      onError: (_) {}, // Silently handle GPS errors — don't crash the app
    );
  }

  void stop() {
    _positionSub?.cancel();
    _positionSub = null;
    _throttleTimer?.cancel();
    _throttleTimer = null;
  }

  Future<void> _onPosition(Position position) async {
    final now = DateTime.now();
    if (_lastPushed != null && now.difference(_lastPushed!) < _minInterval) {
      return; // Throttle — max once per 60 s even if movement > 50 m
    }
    _lastPushed = now;
    try {
      await _profileRepository.updateLocation(position.latitude, position.longitude);
    } catch (_) {
      // Non-fatal — location will be pushed on next movement event
    }
  }
}
