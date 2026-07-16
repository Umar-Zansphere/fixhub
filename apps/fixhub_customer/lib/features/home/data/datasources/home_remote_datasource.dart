import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class HomeRemoteDataSource {
  final Dio _dio;

  HomeRemoteDataSource(this._dio);

  /// GET /categories
  Future<List<dynamic>> getCategories() async {
    final response = await _dio.get(ApiEndpoints.categories);
    final data = response.data;
    // Unwrap API response envelope
    if (data is Map && data.containsKey('data')) {
      final result = data['data'];
      return result is List ? result : [];
    }
    return data is List ? data : [];
  }

  /// GET /categories/:categoryId/sub-services
  Future<List<dynamic>> getSubServices(String categoryId) async {
    final response = await _dio.get(
      ApiEndpoints.categoryServices(categoryId),
    );
    final data = response.data;
    if (data is Map && data.containsKey('data')) {
      final result = data['data'];
      return result is List ? result : [];
    }
    return data is List ? data : [];
  }
}
