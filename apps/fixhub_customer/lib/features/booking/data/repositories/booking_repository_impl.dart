import '../datasources/booking_remote_datasource.dart';
import '../models/booking_model.dart';
import '../../domain/repositories/booking_repository.dart';

class BookingRepositoryImpl implements BookingRepository {
  final BookingRemoteDataSource _remoteDataSource;

  BookingRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<BookingModel>> getBookings() async {
    final data = await _remoteDataSource.getBookings();
    return data
        .map((e) => BookingModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  @override
  Future<BookingModel> getBooking(String id) async {
    final data = await _remoteDataSource.getBooking(id);
    return BookingModel.fromJson(data);
  }

  @override
  Future<BookingModel> createDraft(Map<String, dynamic> payload) async {
    final data = await _remoteDataSource.createDraft(payload);
    return BookingModel.fromJson(data);
  }

  @override
  Future<BookingModel> createBooking(Map<String, dynamic> payload) async {
    // This might not be used if we're using createDraft + confirmBooking, but let's implement it.
    throw UnimplementedError('Use createDraft and confirmBooking instead');
  }

  @override
  Future<BookingModel> confirmBooking(String id, Map<String, dynamic> payload) async {
    final data = await _remoteDataSource.confirmBooking(id, payload);
    return BookingModel.fromJson(data);
  }

  @override
  Future<BookingModel> cancelBooking(String id, String reason) async {
    final data = await _remoteDataSource.cancelBooking(id, reason);
    return BookingModel.fromJson(data);
  }

  @override
  Future<Map<String, dynamic>> createPaymentOrder(String bookingId) async {
    return _remoteDataSource.createPaymentOrder(bookingId);
  }

  @override
  Future<Map<String, dynamic>> verifyPayment(Map<String, dynamic> payload) async {
    return _remoteDataSource.verifyPayment(payload);
  }

  @override
  Future<List<String>> getAvailableSlots(String subServiceId, String pincode, String date) async {
    return _remoteDataSource.getAvailableSlots(subServiceId, pincode, date);
  }
}
