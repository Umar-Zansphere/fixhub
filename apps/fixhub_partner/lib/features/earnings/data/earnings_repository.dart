import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';

final earningsRepositoryProvider = Provider<EarningsRepository>((ref) {
  return EarningsRepository(ref.read(dioProvider));
});

class EarningsSummary {
  final double totalEarnings;
  final int completedJobs;
  final double averagePerJob;

  const EarningsSummary({
    required this.totalEarnings,
    required this.completedJobs,
    required this.averagePerJob,
  });

  factory EarningsSummary.fromJson(Map<String, dynamic> json) =>
      EarningsSummary(
        totalEarnings: double.tryParse(json['totalEarnings'].toString()) ?? 0,
        completedJobs: json['completedJobs'] as int? ?? 0,
        averagePerJob: double.tryParse(json['averagePerJob'].toString()) ?? 0,
      );
}

class EarningsTransaction {
  final String id;
  final String bookingNumber;
  final double totalAmount;
  final DateTime? scheduledDate;
  final DateTime? completedAt;
  final String serviceName;
  final String? categoryName;
  final String? customerName;

  const EarningsTransaction({
    required this.id,
    required this.bookingNumber,
    required this.totalAmount,
    this.scheduledDate,
    this.completedAt,
    required this.serviceName,
    this.categoryName,
    this.customerName,
  });

  factory EarningsTransaction.fromJson(Map<String, dynamic> json) {
    final subService = json['subService'] as Map<String, dynamic>?;
    final category = subService?['category'] as Map<String, dynamic>?;
    final customer = json['customer'] as Map<String, dynamic>?;
    final user = customer?['user'] as Map<String, dynamic>?;

    return EarningsTransaction(
      id: json['id'] as String,
      bookingNumber: json['bookingNumber'] as String,
      totalAmount: double.tryParse(json['totalAmount'].toString()) ?? 0,
      scheduledDate: json['scheduledDate'] != null
          ? DateTime.tryParse(json['scheduledDate'] as String)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'] as String)
          : null,
      serviceName: subService?['name'] as String? ?? 'Service',
      categoryName: category?['name'] as String?,
      customerName: user?['name'] as String?,
    );
  }
}

class EarningsRepository {
  final Dio _dio;

  EarningsRepository(this._dio);

  Future<EarningsSummary> getSummary({String? dateFrom, String? dateTo}) async {
    final response = await _dio.get(
      ApiEndpoints.technicianEarnings,
      queryParameters: {
        if (dateFrom != null) 'dateFrom': dateFrom,
        if (dateTo != null) 'dateTo': dateTo,
      },
    );
    return EarningsSummary.fromJson(_unwrapMap(response.data));
  }

  Future<List<EarningsTransaction>> getHistory({
    String? dateFrom,
    String? dateTo,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get(
      ApiEndpoints.technicianEarningsHistory,
      queryParameters: {
        if (dateFrom != null) 'dateFrom': dateFrom,
        if (dateTo != null) 'dateTo': dateTo,
        'page': page,
        'limit': limit,
      },
    );
    final data = _unwrapMap(response.data);
    final items = data['items'] as List<dynamic>? ?? [];
    return items
        .map((i) => EarningsTransaction.fromJson(i as Map<String, dynamic>))
        .toList();
  }

  Map<String, dynamic> _unwrapMap(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }
}
