import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/home_remote_datasource.dart';
import '../../data/models/category_model.dart';
import '../../data/models/sub_service_model.dart';
import '../../data/repositories/home_repository_impl.dart';
import '../../domain/repositories/home_repository.dart';
import '../../../../core/network/dio_client.dart';
import '../../../location/presentation/providers/location_provider.dart';

// ── Repository Provider ───────────────────────────────────────

final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return HomeRepositoryImpl(HomeRemoteDataSource(dio));
});

// ── Categories Provider ───────────────────────────────────────

final categoriesProvider =
    FutureProvider<List<CategoryModel>>((ref) async {
  final repo = ref.watch(homeRepositoryProvider);
  return repo.getCategories();
});

// ── Sub-Services Provider (by category) ───────────────────────

final subServicesProvider =
    FutureProvider.family<List<SubServiceModel>, String>(
        (ref, categoryId) async {
  final repo = ref.watch(homeRepositoryProvider);
  final locationState = ref.watch(locationProvider);
  return repo.getSubServices(categoryId, pincode: locationState.currentPincode);
});

// ── Popular Services (all active services for the home screen) ─

final popularServicesProvider =
    FutureProvider<List<SubServiceModel>>((ref) async {
  final categories = await ref.watch(categoriesProvider.future);
  final activeCategories = categories.where((c) => c.isActive).toList();

  if (activeCategories.isEmpty) return [];

  final repo = ref.read(homeRepositoryProvider);
  final locationState = ref.watch(locationProvider);
  final allServices = <SubServiceModel>[];

  for (final category in activeCategories) {
    try {
      final services = await repo.getSubServices(
        category.id,
        pincode: locationState.currentPincode,
      );
      allServices.addAll(services);
    } catch (_) {
      // Skip categories with errors
    }
  }

  return allServices;
});

// ── Service Detail Provider ───────────────────────────────────

final serviceDetailProvider =
    FutureProvider.family<SubServiceModel, String>((ref, id) async {
  final repo = ref.watch(homeRepositoryProvider);
  return repo.getService(id);
});
