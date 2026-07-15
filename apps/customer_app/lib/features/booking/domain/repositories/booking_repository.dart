import '../../data/models/booking_model.dart';

abstract class BookingRepository {
  Future<List<BookingModel>> getBookings();
  Future<BookingModel> getBooking(String id);
  Future<BookingModel> createBooking(Map<String, dynamic> payload);
}
