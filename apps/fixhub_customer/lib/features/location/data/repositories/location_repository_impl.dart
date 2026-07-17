import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../../domain/repositories/location_repository.dart';
import '../datasources/location_remote_datasource.dart';
import '../models/service_area_validation_model.dart';

class LocationRepositoryImpl implements LocationRepository {
  final LocationRemoteDataSource _remoteDataSource;

  LocationRepositoryImpl(this._remoteDataSource);

  @override
  Future<bool> checkPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return false;
    }
    return true;
  }

  @override
  Future<bool> requestPermission() async {
    LocationPermission permission = await Geolocator.requestPermission();
    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }

  @override
  Future<Position> getCurrentLocation() async {
    // Re-check permission here, but only after the caller has already
    // requested it. This avoids the race where checkPermission() still
    // reads "denied" right after the OS dialog is dismissed.
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      // One last attempt — the dialog may have just closed.
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw Exception('Location permission denied');
    }
    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  @override
  Future<String?> getPincodeFromPosition(Position position) async {
    try {
      final placemarks = await Geocoding().placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      if (placemarks.isNotEmpty) {
        final pincode = placemarks.first.postalCode;
        if (pincode != null && pincode.isNotEmpty) {
          return pincode;
        }
      }
    } catch (e) {
      print('[LocationRepository] Reverse geocoding failed: $e');
    }
    return null;
  }

  @override
  Future<ServiceAreaValidationModel> validateServiceArea(String pincode) async {
    final response = await _remoteDataSource.validateServiceArea(pincode);

    print('Response: $response');

    final data = response['data'] ?? response;

    print('Data: $data');

    return ServiceAreaValidationModel.fromJson(
      Map<String, dynamic>.from(data),
    );
  }
}
