import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../providers/home_provider.dart';

class GlobalSearchDelegate extends SearchDelegate<String?> {
  final WidgetRef ref;

  GlobalSearchDelegate(this.ref);

  @override
  String get searchFieldLabel => 'Search services...';

  @override
  ThemeData appBarTheme(BuildContext context) {
    final theme = Theme.of(context);
    return theme.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.textPrimary),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: InputBorder.none,
        hintStyle: TextStyle(color: AppColors.textSecondary),
      ),
    );
  }

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () {
            query = '';
            showSuggestions(context);
          },
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults();
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    return _buildSearchResults();
  }

  Widget _buildSearchResults() {
    if (query.trim().isEmpty) {
      return const Center(
        child: Text(
          'Type to search for services',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }

    final servicesAsync = ref.watch(popularServicesProvider);

    return servicesAsync.when(
      data: (services) {
        final filteredServices = services.where((s) {
          final name = (s.name).toLowerCase();
          return name.contains(query.toLowerCase());
        }).toList();

        if (filteredServices.isEmpty) {
          return const Center(
            child: Text(
              'No services found',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          );
        }

        return ListView.builder(
          itemCount: filteredServices.length,
          itemBuilder: (context, index) {
            final service = filteredServices[index];
            return ListTile(
              title: Text(service.name),
              subtitle: Text(service.category?.name ?? ''),
              trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
              onTap: () {
                close(context, null);
                context.push('/service-detail/${service.id}');
              },
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const Center(child: Text('Error loading services')),
    );
  }
}
