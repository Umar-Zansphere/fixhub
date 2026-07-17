import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
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

final bookingActionProvider = StateNotifierProvider<BookingActionNotifier, AsyncValue<void>>((ref) {
  return BookingActionNotifier(ref.watch(bookingRepositoryProvider), ref);
});

class BookingActionNotifier extends StateNotifier<AsyncValue<void>> {
  final BookingRepository _repository;
  final Ref _ref;

  BookingActionNotifier(this._repository, this._ref) : super(const AsyncValue.data(null));

  Future<void> cancelBooking(String id, String reason) async {
    try {
      state = const AsyncValue.loading();
      await _repository.cancelBooking(id, reason);
      state = const AsyncValue.data(null);
      _ref.invalidate(bookingsProvider);
      _ref.invalidate(bookingDetailProvider(id));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  // TODO add rateBooking when endpoint is available
}
