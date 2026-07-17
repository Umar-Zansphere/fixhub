import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class LocationRemoteDataSource {
  final Dio _dio;

  LocationRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> validateServiceArea(String pincode) async {
    final response = await _dio.post(
      ApiEndpoints.validateServiceArea,
      data: {'pincode': pincode},
    );
    return response.data;
  }
}
