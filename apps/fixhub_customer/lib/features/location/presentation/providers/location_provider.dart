import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../data/repositories/location_repository_impl.dart';
import '../../domain/repositories/location_repository.dart';
import '../../data/datasources/location_remote_datasource.dart';
import '../../data/models/service_area_validation_model.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/storage/local_storage.dart';

final locationRepositoryProvider = Provider<LocationRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return LocationRepositoryImpl(LocationRemoteDataSource(dio));
});

enum LocationStatus { initial, checking, valid, invalid, error }

class LocationState {
  final LocationStatus status;
  final String? currentPincode;
  final String? currentCity;
  final ServiceAreaValidationModel? serviceAreaResult;
  final String? errorMessage;
  final bool hasPermission;
  final bool isRestoring;

  const LocationState({
    this.status = LocationStatus.initial,
    this.currentPincode,
    this.currentCity,
    this.serviceAreaResult,
    this.errorMessage,
    this.hasPermission = false,
    this.isRestoring = true,
  });

  LocationState copyWith({
    LocationStatus? status,
    String? currentPincode,
    String? currentCity,
    ServiceAreaValidationModel? serviceAreaResult,
    String? errorMessage,
    bool? hasPermission,
    bool? isRestoring,
  }) {
    return LocationState(
      status: status ?? this.status,
      currentPincode: currentPincode ?? this.currentPincode,
      currentCity: currentCity ?? this.currentCity,
      serviceAreaResult: serviceAreaResult ?? this.serviceAreaResult,
      errorMessage: errorMessage ?? this.errorMessage,
      hasPermission: hasPermission ?? this.hasPermission,
      isRestoring: isRestoring ?? this.isRestoring,
    );
  }
}

final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>((ref) {
  return LocationNotifier(
    ref.watch(locationRepositoryProvider),
    ref.watch(localStorageProvider),
  );
});

class LocationNotifier extends StateNotifier<LocationState> {
  final LocationRepository _repository;
  final LocalStorage _localStorage;

  LocationNotifier(this._repository, this._localStorage) : super(const LocationState()) {
    _init();
  }

  Future<void> _init() async {
    final hasPermission = await _repository.checkPermission();

    // Restore previously validated location
    final savedStatus = await _localStorage.getSavedLocationStatus();
    final savedPincode = await _localStorage.getSavedPincode();

    if (savedStatus == 'valid' && savedPincode != null) {
      state = state.copyWith(
        hasPermission: hasPermission,
        status: LocationStatus.valid,
        currentPincode: savedPincode,
        isRestoring: false,
      );
    } else if (savedStatus == 'invalid' && savedPincode != null) {
      state = state.copyWith(
        hasPermission: hasPermission,
        status: LocationStatus.invalid,
        currentPincode: savedPincode,
        isRestoring: false,
      );
    } else {
      state = state.copyWith(hasPermission: hasPermission, isRestoring: false);
    }
  }

  Future<bool> requestPermission() async {
    final granted = await _repository.requestPermission();
    state = state.copyWith(hasPermission: granted);
    return granted;
  }

  Future<void> detectFromGPS() async {
    state = state.copyWith(status: LocationStatus.checking);
    try {
      final hasPermission = await requestPermission();
      if (!hasPermission) {
        state = state.copyWith(
          status: LocationStatus.error,
          errorMessage: 'Location permission denied.',
        );
        return;
      }

      final position = await _repository.getCurrentLocation();

      final pincode = await _repository.getPincodeFromPosition(position);

      if (pincode == null) {
        state = state.copyWith(
          status: LocationStatus.error,
          errorMessage: 'Could not determine pincode from location.',
        );
        return;
      }

      await validateArea(pincode);
    } catch (e, stack) {
      print('[LocationNotifier] detectFromGPS error: $e\n$stack');
      state = state.copyWith(
        status: LocationStatus.error,
        errorMessage: 'Failed to detect location.',
      );
    }
  }

  Future<void> validateArea(String pincode) async {
    state = state.copyWith(status: LocationStatus.checking);
    try {
      final result = await _repository.validateServiceArea(pincode);

      if (result.isServiceable) {
        state = state.copyWith(
          status: LocationStatus.valid,
          currentPincode: pincode,
          serviceAreaResult: result,
        );
        // Persist so we skip the screen next launch
        await _localStorage.saveLocation(pincode: pincode, status: 'valid');
      } else {
        state = state.copyWith(
          status: LocationStatus.invalid,
          currentPincode: pincode,
          serviceAreaResult: result,
        );
        await _localStorage.saveLocation(pincode: pincode, status: 'invalid');
      }
    } catch (e, stack) {
      print('[LocationNotifier] validateArea error: $e\n$stack');
      state = state.copyWith(
        status: LocationStatus.error,
        errorMessage: 'Failed to validate service area.',
      );
    }
  }

  void reset() {
    _localStorage.clearLocation();
    state = const LocationState();
    _init();
  }
}
