import '../datasources/home_remote_datasource.dart';
import '../models/category_model.dart';
import '../models/sub_service_model.dart';
import '../../domain/repositories/home_repository.dart';

class HomeRepositoryImpl implements HomeRepository {
  final HomeRemoteDataSource _remoteDataSource;

  HomeRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<CategoryModel>> getCategories() async {
    final data = await _remoteDataSource.getCategories();
    return data
        .map((e) => CategoryModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  @override
  Future<List<SubServiceModel>> getSubServices(String categoryId, {String? pincode}) async {
    final data = await _remoteDataSource.getSubServices(categoryId, pincode: pincode);
    return data
        .map((e) => SubServiceModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  @override
  Future<SubServiceModel> getService(String id) async {
    final data = await _remoteDataSource.getService(id);
    return SubServiceModel.fromJson(data);
  }
}
