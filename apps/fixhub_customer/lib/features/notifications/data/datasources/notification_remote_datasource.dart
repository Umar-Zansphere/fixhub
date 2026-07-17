import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class NotificationRemoteDataSource {
  final Dio _dio;

  NotificationRemoteDataSource(this._dio);

  Future<List<dynamic>> getNotifications() async {
    final response = await _dio.get(ApiEndpoints.notifications);
    return _extractList(response.data);
  }

  Future<Map<String, dynamic>> markAsRead(String id) async {
    final response = await _dio.patch(ApiEndpoints.notificationRead(id));
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> markAllAsRead() async {
    final response = await _dio.patch(ApiEndpoints.notificationReadAll);
    return _extractData(response.data);
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

  Map<String, dynamic> _extractData(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }
}
