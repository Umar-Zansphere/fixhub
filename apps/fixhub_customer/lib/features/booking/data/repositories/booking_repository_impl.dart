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
    return BookingModel.fromJson(Map<String, dynamic>.from(data));
  }

  @override
  Future<BookingModel> createBooking(Map<String, dynamic> payload) async {
    final data = await _remoteDataSource.createBooking(payload);
    return BookingModel.fromJson(Map<String, dynamic>.from(data));
  }
}
