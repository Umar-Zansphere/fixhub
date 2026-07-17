import '../../../booking/data/models/address_model.dart';
import '../../domain/repositories/address_repository.dart';
import '../datasources/address_remote_datasource.dart';

class AddressRepositoryImpl implements AddressRepository {
  final AddressRemoteDataSource _remoteDataSource;

  AddressRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<AddressModel>> getAddresses() async {
    final data = await _remoteDataSource.getAddresses();
    return (data as List).map((json) => AddressModel.fromJson(Map<String, dynamic>.from(json))).toList();
  }

  @override
  Future<AddressModel> addAddress(AddressModel address) async {
    // Explicitly map fields to keys the backend expects
    final payload = {
      'label': address.label,
      'line1': address.line1,
      'line2': address.line2,
      'landmark': address.landmark,
      'city': address.city,
      'state': address.state,
      'pincode': address.pincode,
      'isDefault': address.isDefault,
    };
    final data = await _remoteDataSource.addAddress(payload);
    return AddressModel.fromJson(Map<String, dynamic>.from(data));
  }

  @override
  Future<AddressModel> updateAddress(String id, AddressModel address) async {
    final data = await _remoteDataSource.updateAddress(id, address.toJson());
    return AddressModel.fromJson(Map<String, dynamic>.from(data));
  }

  @override
  Future<void> deleteAddress(String id) async {
    await _remoteDataSource.deleteAddress(id);
  }
}
