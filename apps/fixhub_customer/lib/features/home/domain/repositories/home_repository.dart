import '../../data/models/category_model.dart';
import '../../data/models/sub_service_model.dart';

/// Home repository contract.
abstract class HomeRepository {
  Future<List<CategoryModel>> getCategories();
  Future<List<SubServiceModel>> getSubServices(String categoryId);
  Future<SubServiceModel> getService(String id);
}
