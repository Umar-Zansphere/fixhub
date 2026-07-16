abstract class LocationRepository {
  Future<bool> checkPermission();
  Future<bool> requestPermission();
  Future<void> getCurrentLocation();
}
