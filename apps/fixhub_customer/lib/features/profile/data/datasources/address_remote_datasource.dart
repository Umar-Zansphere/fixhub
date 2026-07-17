import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class AddressRemoteDataSource {
  final Dio _dio;

  AddressRemoteDataSource(this._dio);

  Future<List<dynamic>> getAddresses() async {
    final response = await _dio.get(ApiEndpoints.customerAddresses);
    return response.data['data'] ?? response.data;
  }

  Future<Map<String, dynamic>> addAddress(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiEndpoints.customerAddresses, data: data);
    return response.data['data'] ?? response.data;
  }

  Future<Map<String, dynamic>> updateAddress(String id, Map<String, dynamic> data) async {
    final response = await _dio.put(ApiEndpoints.customerAddress(id), data: data);
    return response.data['data'] ?? response.data;
  }

  Future<void> deleteAddress(String id) async {
    await _dio.delete(ApiEndpoints.customerAddress(id));
  }
}
