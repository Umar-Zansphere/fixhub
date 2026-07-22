import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class BookingRemoteDataSource {
  final Dio _dio;

  BookingRemoteDataSource(this._dio);

  Future<List<dynamic>> getBookings() async {
    final response = await _dio.get(ApiEndpoints.bookings);
    return _extractList(response.data);
  }

  Future<List<dynamic>> getBookingHistory() async {
    final response = await _dio.get(ApiEndpoints.bookingHistory);
    return _extractList(response.data);
  }

  Future<Map<String, dynamic>> getBooking(String id) async {
    final response = await _dio.get(ApiEndpoints.bookingDetail(id));
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> createDraft(Map<String, dynamic> payload) async {
    final response = await _dio.post(ApiEndpoints.bookingDraft, data: payload);
    final data = _extractData(response.data);
    // Draft endpoint returns { booking: {...}, summary: {...}, draftExpiresInSeconds: ... }
    if (data.containsKey('booking')) {
      return Map<String, dynamic>.from(data['booking']);
    }
    return data;
  }

  Future<Map<String, dynamic>> confirmBooking(String id, Map<String, dynamic> payload) async {
    final response = await _dio.post(ApiEndpoints.bookingConfirm(id), data: payload);
    final data = _extractData(response.data);
    // Confirm endpoint returns { booking: {...}, confirmation: {...} }
    if (data.containsKey('booking')) {
      return Map<String, dynamic>.from(data['booking']);
    }
    return data;
  }

  Future<Map<String, dynamic>> getSummary(Map<String, dynamic> payload) async {
    final response = await _dio.post(ApiEndpoints.bookingSummary, data: payload);
    return _extractData(response.data);
  }
  
  Future<Map<String, dynamic>> updateBookingStatus(String id, String status) async {
    final response = await _dio.patch(ApiEndpoints.bookingStatus(id), data: {'status': status});
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> cancelBooking(String id, String reason) async {
    final response = await _dio.patch(
      ApiEndpoints.bookingStatus(id), 
      data: {
        'status': 'CANCELLED',
        'cancelReason': reason,
      }
    );
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> createPaymentOrder(String bookingId) async {
    final response = await _dio.post(ApiEndpoints.createOrder(bookingId));
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> verifyPayment(Map<String, dynamic> payload) async {
    final response = await _dio.post(ApiEndpoints.verifyPayment, data: payload);
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> submitReview(
    String bookingId,
    int rating,
    String? comment,
  ) async {
    final response = await _dio.post(
      ApiEndpoints.bookingReview(bookingId),
      data: {
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      },
    );
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> approveRevision(String bookingId) async {
    final response = await _dio.patch(ApiEndpoints.bookingApproveRevision(bookingId));
    return _extractData(response.data);
  }

  Future<Map<String, dynamic>> rejectRevision(String bookingId) async {
    final response = await _dio.patch(ApiEndpoints.bookingRejectRevision(bookingId));
    return _extractData(response.data);
  }

  Future<List<String>> getAvailableSlots(String subServiceId, String pincode, String date) async {
    final response = await _dio.get(
      ApiEndpoints.availableSlots,
      queryParameters: {
        'subServiceId': subServiceId,
        'pincode': pincode,
        'date': date,
      },
    );
    
    final data = response.data;
    
    if (data is Map && data.containsKey('data') && data['data'] is List) {
      return (data['data'] as List).map((e) => e.toString()).toList();
    }
    
    if (data is List) {
      return data.map((e) => e.toString()).toList();
    }
    
    return [];
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
