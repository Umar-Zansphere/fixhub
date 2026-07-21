import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../domain/job_offer_models.dart';

final offerRepositoryProvider = Provider<OfferRepository>((ref) {
  return OfferRepository(ref.read(dioProvider));
});

class OfferRepository {
  final Dio _dio;

  OfferRepository(this._dio);

  /// GET /technicians/offers — pending offers for authenticated technician
  Future<List<JobOffer>> listOffers() async {
    final response = await _dio.get(ApiEndpoints.technicianOffers);
    final data = _unwrapList(response.data);
    return data.map((e) => JobOffer.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /technicians/offers/count
  Future<int> countPendingOffers() async {
    final response = await _dio.get(ApiEndpoints.technicianOffersCount);
    final data = _unwrapMap(response.data);
    return data['count'] as int? ?? 0;
  }

  /// PATCH /technicians/offers/:id/accept
  Future<void> acceptOffer(String offerId) async {
    await _dio.patch(ApiEndpoints.technicianOfferAccept(offerId));
  }

  /// PATCH /technicians/offers/:id/reject
  Future<void> rejectOffer(String offerId, {String? reason}) async {
    await _dio.patch(
      ApiEndpoints.technicianOfferReject(offerId),
      data: {if (reason != null) 'reason': reason},
    );
  }

  List<dynamic> _unwrapList(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      final inner = data['data'];
      if (inner is List) return inner;
    }
    if (data is List) return data;
    return [];
  }

  Map<String, dynamic> _unwrapMap(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }
}
