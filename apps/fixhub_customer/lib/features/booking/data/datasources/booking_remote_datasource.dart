import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class BookingRemoteDataSource {
  final Dio _dio;

  BookingRemoteDataSource(this._dio);

  Future<List<dynamic>> getBookings() async {
    final response = await _dio.get(ApiEndpoints.bookings);
    final data = response.data;
    if (data is Map && data.containsKey('data')) {
      final result = data['data'];
      return result is List ? result : [];
    }
    return data is List ? data : [];
  }

  Future<Map<String, dynamic>> getBooking(String id) async {
    final response = await _dio.get(ApiEndpoints.bookingDetail(id));
    final data = response.data;
    if (data is Map && data.containsKey('data')) {
      return data['data'];
    }
    return data;
  }

  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> payload) async {
    final response = await _dio.post(ApiEndpoints.bookings, data: payload);
    final data = response.data;
    if (data is Map && data.containsKey('data')) {
      return data['data'];
    }
    return data;
  }
}
