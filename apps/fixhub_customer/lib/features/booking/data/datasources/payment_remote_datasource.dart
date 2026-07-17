import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class PaymentRemoteDataSource {
  final Dio _dio;

  PaymentRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> createOrder(String bookingId) async {
    final response = await _dio.post(ApiEndpoints.createOrder(bookingId));
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> verifyPayment(Map<String, dynamic> payload) async {
    final response = await _dio.post(ApiEndpoints.verifyPayment, data: payload);
    return _extractData(response.data);
  }

  Map<String, dynamic> _extractData(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }
}
