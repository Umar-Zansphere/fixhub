import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../../../core/network/dio_client.dart';
import '../../../booking/data/models/address_model.dart';
import '../../data/datasources/address_remote_datasource.dart';
import '../../data/repositories/address_repository_impl.dart';
import '../../domain/repositories/address_repository.dart';

final addressRepositoryProvider = Provider<AddressRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return AddressRepositoryImpl(AddressRemoteDataSource(dio));
});

final addressesProvider = StateNotifierProvider<AddressNotifier, AsyncValue<List<AddressModel>>>((ref) {
  return AddressNotifier(ref.watch(addressRepositoryProvider));
});

class AddressNotifier extends StateNotifier<AsyncValue<List<AddressModel>>> {
  final AddressRepository _repository;

  AddressNotifier(this._repository) : super(const AsyncValue.loading()) {
    fetchAddresses();
  }

  Future<void> fetchAddresses() async {
    try {
      state = const AsyncValue.loading();
      final addresses = await _repository.getAddresses();
      state = AsyncValue.data(addresses);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addAddress(AddressModel address) async {
    try {
      final newAddress = await _repository.addAddress(address);
      if (state.hasValue) {
        state = AsyncValue.data([...state.value!, newAddress]);
      } else {
        state = AsyncValue.data([newAddress]);
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteAddress(String id) async {
    try {
      await _repository.deleteAddress(id);
      if (state.hasValue) {
        state = AsyncValue.data(state.value!.where((a) => a.id != id).toList());
      }
    } catch (e) {
      rethrow;
    }
  }
}
