import '../../data/models/booking_model.dart';

abstract class BookingRepository {
  Future<List<BookingModel>> getBookings();
  Future<BookingModel> getBooking(String id);
  Future<BookingModel> createDraft(Map<String, dynamic> payload);
  Future<BookingModel> createBooking(Map<String, dynamic> payload);
  Future<BookingModel> confirmBooking(String id, Map<String, dynamic> payload);
  Future<BookingModel> cancelBooking(String id, String reason);
  Future<Map<String, dynamic>> createPaymentOrder(String bookingId);
  Future<Map<String, dynamic>> verifyPayment(Map<String, dynamic> payload);
}
