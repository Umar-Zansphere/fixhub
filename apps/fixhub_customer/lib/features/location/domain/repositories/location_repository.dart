import 'package:geolocator/geolocator.dart';
import '../../data/models/service_area_validation_model.dart';

abstract class LocationRepository {
  Future<bool> checkPermission();
  Future<bool> requestPermission();
  Future<Position> getCurrentLocation();
  Future<String?> getPincodeFromPosition(Position position);
  Future<ServiceAreaValidationModel> validateServiceArea(String pincode);
}
