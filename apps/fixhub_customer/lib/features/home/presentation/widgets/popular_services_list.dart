import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_section_header.dart';
import '../../data/models/sub_service_model.dart';

/// Horizontal scroll list of popular services with improved visual cards.
class PopularServicesList extends StatelessWidget {
  const PopularServicesList({super.key, required this.services});

  final List<SubServiceModel> services;

  @override
  Widget build(BuildContext context) {
    if (services.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        FixHubSectionHeader(
          title: 'Popular Services',
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPadding,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        SizedBox(
          height: 170,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.screenPadding,
            ),
            itemCount: services.length,
            separatorBuilder: (_, __) =>
                const SizedBox(width: AppSpacing.sm),
            itemBuilder: (context, index) {
              final service = services[index];
              return _ServiceCard(service: service);
            },
          ),
        ),
      ],
    );
  }
}

class _ServiceCard extends StatefulWidget {
  const _ServiceCard({required this.service});

  final SubServiceModel service;

  @override
  State<_ServiceCard> createState() => _ServiceCardState();
}

class _ServiceCardState extends State<_ServiceCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.95,
      upperBound: 1.0,
      value: 1.0,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final service = widget.service;
    final iconConfig = _serviceIconConfig(service.category?.name, service.slug);

    return GestureDetector(
      onTap: () => context.push('/service-detail/${service.id}'),
      onTapDown: (_) => _controller.reverse(),
      onTapUp: (_) => _controller.forward(),
      onTapCancel: () => _controller.forward(),
      child: ScaleTransition(
        scale: _controller,
        child: Container(
          width: 160,
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.elevatedSurface,
            borderRadius: AppRadius.cardRadius,
            border: Border.all(color: AppColors.border, width: 0.5),
            boxShadow: [
              BoxShadow(
                color: AppColors.textPrimary.withValues(alpha: 0.03),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon container
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: iconConfig.$3,
                  borderRadius: AppRadius.smallRadius,
                ),
                child: Center(
                  child: Icon(
                    iconConfig.$1,
                    size: 22,
                    color: iconConfig.$2,
                  ),
                ),
              ),
              const Spacer(),
              // Service name
              Text(
                service.name,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              // Price + duration row
              Row(
                children: [
                  Text(
                    service.formattedPrice,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    '· ${service.formattedDuration}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Returns (icon, iconColor, bgColor) for the service.
  (IconData, Color, Color) _serviceIconConfig(
      String? categoryName, String slug) {
    final cat = categoryName?.toLowerCase() ?? slug.toLowerCase();
    if (cat.contains('electrical') || cat.contains('electric')) {
      return (Icons.bolt_rounded, const Color(0xFFF59E0B), const Color(0xFFFFF8E1));
    } else if (cat.contains('ac') || cat.contains('air')) {
      return (Icons.ac_unit_rounded, const Color(0xFF2196F3), const Color(0xFFE3F2FD));
    } else if (cat.contains('plumb') || cat.contains('water')) {
      return (Icons.plumbing_rounded, const Color(0xFF4CAF50), const Color(0xFFE8F5E9));
    } else if (cat.contains('clean')) {
      return (Icons.cleaning_services_rounded, const Color(0xFF9C27B0), const Color(0xFFF3E5F5));
    } else if (cat.contains('paint')) {
      return (Icons.format_paint_rounded, const Color(0xFFE91E63), const Color(0xFFFCE4EC));
    } else if (cat.contains('carp') || cat.contains('wood')) {
      return (Icons.handyman_rounded, const Color(0xFFE53935), const Color(0xFFFFEBEE));
    } else if (cat.contains('appliance') || cat.contains('fan')) {
      return (Icons.home_repair_service_rounded, const Color(0xFF3F51B5), const Color(0xFFE8EAF6));
    }
    return (Icons.build_rounded, AppColors.textSecondary, AppColors.surface);
  }
}
