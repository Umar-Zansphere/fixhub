import '../../../booking/data/models/address_model.dart';

abstract class AddressRepository {
  Future<List<AddressModel>> getAddresses();
  Future<AddressModel> addAddress(AddressModel address);
  Future<AddressModel> updateAddress(String id, AddressModel address);
  Future<void> deleteAddress(String id);
}
