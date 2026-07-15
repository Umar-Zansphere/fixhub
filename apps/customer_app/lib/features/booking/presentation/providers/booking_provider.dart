import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/booking_remote_datasource.dart';
import '../../data/models/booking_model.dart';
import '../../data/repositories/booking_repository_impl.dart';
import '../../domain/repositories/booking_repository.dart';
import '../../../../core/network/dio_client.dart';

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return BookingRepositoryImpl(BookingRemoteDataSource(dio));
});

final bookingsProvider = FutureProvider<List<BookingModel>>((ref) async {
  final repo = ref.watch(bookingRepositoryProvider);
  return repo.getBookings();
});

final bookingDetailProvider = FutureProvider.family<BookingModel, String>((ref, id) async {
  final repo = ref.watch(bookingRepositoryProvider);
  return repo.getBooking(id);
});
