import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_images.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/router/route_names.dart';
import '../../../home/data/models/sub_service_model.dart';
import '../../../home/presentation/providers/home_provider.dart';
import '../../../booking/presentation/providers/booking_flow_provider.dart';

/// Service detail screen — shows full info, issue tags, and "Book Now" CTA.
class ServiceDetailScreen extends ConsumerStatefulWidget {
  const ServiceDetailScreen({
    super.key,
    required this.serviceId,
  });

  final String serviceId;

  @override
  ConsumerState<ServiceDetailScreen> createState() => _ServiceDetailScreenState();
}

class _ServiceDetailScreenState extends ConsumerState<ServiceDetailScreen> {
  final Set<String> _selectedTags = {};

  final List<String> _commonIssues = [
    'Not turning on',
    'Making noise',
    'Water leakage',
    'Cooling issue',
    'Heating issue',
    'Regular servicing',
  ];

  @override
  Widget build(BuildContext context) {
    final serviceAsync = ref.watch(serviceDetailProvider(widget.serviceId));

    return serviceAsync.when(
      data: (service) => _buildContent(context, service),
      loading: () => Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
          child: CircularProgressIndicator(
            color: AppColors.buttonPrimary,
            strokeWidth: 2,
          ),
        ),
      ),
      error: (err, _) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.error_outline_rounded,
                    size: 36, color: AppColors.error),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Service not found',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Please check your connection and try again.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xl),
              OutlinedButton(
                onPressed: () =>
                    ref.invalidate(serviceDetailProvider(widget.serviceId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, SubServiceModel service) {
    final categorySlug = service.category?.name.toLowerCase() ?? '';
    final heroImage = _heroImageForCategory(categorySlug);
    final categoryColor = _categoryColor(categorySlug);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── Hero SliverAppBar ───────────────────────────────
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            backgroundColor: AppColors.background,
            surfaceTintColor: Colors.transparent,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: GestureDetector(
                onTap: () => context.pop(),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.arrow_back_rounded,
                    color: AppColors.textPrimary,
                    size: 20,
                  ),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Hero image
                  Image.asset(
                    heroImage,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: categoryColor.withValues(alpha: 0.15),
                      child: Center(
                        child: Icon(
                          Icons.home_repair_service_rounded,
                          size: 80,
                          color: categoryColor.withValues(alpha: 0.4),
                        ),
                      ),
                    ),
                  ),
                  // Bottom fade
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppColors.background.withValues(alpha: 0.9),
                        ],
                        stops: const [0.55, 1.0],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Content ─────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and price row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          service.name,
                          style: Theme.of(context).textTheme.headlineLarge,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.xs,
                        ),
                        decoration: BoxDecoration(
                          color: categoryColor.withValues(alpha: 0.1),
                          borderRadius: AppRadius.mediumRadius,
                          border: Border.all(
                            color: categoryColor.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          service.formattedPrice,
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                  ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xs),

                  // Duration + category chips
                  Row(
                    children: [
                      const Icon(
                        Icons.schedule_rounded,
                        size: 15,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Est. ${service.formattedDuration}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      if (service.category != null) ...[
                        const SizedBox(width: AppSpacing.sm),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.sm, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: AppColors.border, width: 0.5),
                          ),
                          child: Text(
                            service.category!.name,
                            style:
                                Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w600,
                                    ),
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Trust indicators bar
                  Container(
                    padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.md, horizontal: AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: AppRadius.cardRadius,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _TrustItem(
                          icon: Icons.verified_user_rounded,
                          label: 'Verified\nPros',
                          iconColor: Color(0xFF4CAF50),
                        ),
                        _TrustDivider(),
                        _TrustItem(
                          icon: Icons.shield_rounded,
                          label: 'Insured\nWork',
                          iconColor: Color(0xFF2196F3),
                        ),
                        _TrustDivider(),
                        _TrustItem(
                          icon: Icons.schedule_rounded,
                          label: 'On-Time\nService',
                          iconColor: Color(0xFFF59E0B),
                        ),
                        _TrustDivider(),
                        _TrustItem(
                          icon: Icons.replay_rounded,
                          label: '30-Day\nWarranty',
                          iconColor: Color(0xFF9C27B0),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),
                  const Divider(),
                  const SizedBox(height: AppSpacing.xl),

                  // About
                  Text(
                    'About this service',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    service.description ?? 'No description available.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.6,
                        ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // What's included
                  Text(
                    "What's included",
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  const _IncludedItem(
                      text: 'Professional inspection & diagnosis'),
                  const _IncludedItem(text: 'Repair with quality parts'),
                  const _IncludedItem(text: '30-day service warranty'),
                  const _IncludedItem(text: 'Trained & verified technician'),
                  const _IncludedItem(text: 'Clean up after service'),

                  const SizedBox(height: AppSpacing.xl),

                  // Issue tags
                  Text(
                    'What issue are you facing?',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Select all that apply (optional)',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: _commonIssues.map((tag) {
                      final isSelected = _selectedTags.contains(tag);
                      return GestureDetector(
                        onTap: () => setState(() => isSelected
                            ? _selectedTags.remove(tag)
                            : _selectedTags.add(tag)),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.md, vertical: AppSpacing.xs),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.buttonPrimary
                                : AppColors.elevatedSurface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected
                                  ? AppColors.buttonPrimary
                                  : AppColors.border,
                            ),
                          ),
                          child: Text(
                            tag,
                            style:
                                Theme.of(context).textTheme.labelMedium?.copyWith(
                                      color: isSelected
                                          ? Colors.white
                                          : AppColors.textPrimary,
                                    ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  // Bottom spacing for CTA
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      // Fixed bottom CTA
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          decoration: const BoxDecoration(
            color: AppColors.elevatedSurface,
            border: Border(
              top: BorderSide(color: AppColors.border, width: 0.5),
            ),
          ),
          child: FixHubButton(
            label: 'Book Now — ${service.formattedPrice}',
            onPressed: () {
              ref.read(bookingFlowProvider.notifier).setService(service);
              ref
                  .read(bookingFlowProvider.notifier)
                  .setIssueTags(_selectedTags.toList());
              context.push(RouteNames.selectAddress);
            },
          ),
        ),
      ),
    );
  }

  String _heroImageForCategory(String categoryName) {
    if (categoryName.contains('electric')) return AppImages.serviceHeroElectrical;
    if (categoryName.contains('ac') || categoryName.contains('air')) {
      return AppImages.serviceHeroAc;
    }
    return AppImages.serviceHeroElectrical;
  }

  Color _categoryColor(String categoryName) {
    if (categoryName.contains('electric')) return const Color(0xFFF59E0B);
    if (categoryName.contains('ac') || categoryName.contains('air')) {
      return const Color(0xFF2196F3);
    }
    if (categoryName.contains('plumb')) return const Color(0xFF4CAF50);
    return AppColors.buttonPrimary;
  }
}

class _IncludedItem extends StatelessWidget {
  const _IncludedItem({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(
              color: Color(0xFFE8F5E9),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              size: 14,
              color: AppColors.success,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textPrimary,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  const _TrustItem({
    required this.icon,
    required this.label,
    required this.iconColor,
  });

  final IconData icon;
  final String label;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 22, color: iconColor),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.textSecondary,
                height: 1.3,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _TrustDivider extends StatelessWidget {
  const _TrustDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 0.5,
      height: 40,
      color: AppColors.divider,
    );
  }
}
