import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class HomeRemoteDataSource {
  final Dio _dio;

  HomeRemoteDataSource(this._dio);

  /// GET /categories
  Future<List<dynamic>> getCategories() async {
    final response = await _dio.get(ApiEndpoints.categories);
    return _extractList(response.data);
  }

  /// GET /services
  Future<List<dynamic>> getSubServices(String categoryId, {String? pincode}) async {
    final response = await _dio.get(
      ApiEndpoints.services,
      queryParameters: {
        'categoryId': categoryId,
        if (pincode != null) 'pincode': pincode,
      },
    );
    return _extractList(response.data);
  }

  /// GET /services/:id
  Future<Map<String, dynamic>> getService(String id) async {
    final response = await _dio.get(ApiEndpoints.subServiceDetail(id));
    final data = response.data;
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }

  List<dynamic> _extractList(dynamic data) {
    if (data is Map && data.containsKey('data')) {
      final innerData = data['data'];
      if (innerData is Map && innerData.containsKey('items')) {
        return innerData['items'] as List<dynamic>;
      } else if (innerData is List) {
        return innerData;
      }
    } else if (data is Map && data.containsKey('items')) {
      return data['items'] as List<dynamic>;
    } else if (data is List) {
      return data;
    }
    return [];
  }
}
