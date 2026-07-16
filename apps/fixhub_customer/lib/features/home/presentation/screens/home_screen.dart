import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_shimmer.dart';
import '../../../../core/widgets/fixhub_error_state.dart';
import '../providers/home_provider.dart';
import '../widgets/greeting_header.dart';
import '../widgets/home_search_bar_widget.dart';
import '../widgets/featured_banner.dart';
import '../widgets/category_grid.dart';
import '../widgets/popular_services_list.dart';

/// Home screen — main landing screen with greeting, search, banner,
/// categories, and popular services.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(popularServicesProvider);
          },
          color: AppColors.buttonPrimary,
          child: CustomScrollView(
            slivers: [
              // Greeting
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                    AppSpacing.screenPadding,
                    AppSpacing.lg,
                    AppSpacing.screenPadding,
                    0,
                  ),
                  child: GreetingHeader(),
                ),
              ),

              // Search Bar
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                    AppSpacing.screenPadding,
                    AppSpacing.lg,
                    AppSpacing.screenPadding,
                    0,
                  ),
                  child: HomeSearchBarWidget(),
                ),
              ),

              // Featured Banner
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.only(top: AppSpacing.xl),
                  child: FeaturedBanner(),
                ),
              ),

              // Categories
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sectionGap),
                  child: _buildCategories(ref),
                ),
              ),

              // Popular Services
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(
                    top: AppSpacing.sectionGap,
                    bottom: AppSpacing.xxl,
                  ),
                  child: _buildPopularServices(ref),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategories(WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return categoriesAsync.when(
      data: (categories) => CategoryGrid(categories: categories),
      loading: () => Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.screenPadding,
        ),
        child: FixHubShimmer.card(height: 160),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildPopularServices(WidgetRef ref) {
    final servicesAsync = ref.watch(popularServicesProvider);

    return servicesAsync.when(
      data: (services) => PopularServicesList(services: services),
      loading: () => Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.screenPadding,
        ),
        child: FixHubShimmer.card(height: 140),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}
