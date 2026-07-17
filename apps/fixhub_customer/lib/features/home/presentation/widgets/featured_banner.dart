import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/config/theme/app_spacing.dart';
import 'global_search_delegate.dart';

/// Featured promotional banner — horizontal scrolling cards.
class FeaturedBanner extends ConsumerWidget {
  const FeaturedBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SizedBox(
      height: 160,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.screenPadding,
        ),
        children: [
          _BannerCard(
            title: 'Fan Repair',
            subtitle: 'Starting at ₹299',
            description: 'Expert ceiling fan repair at your doorstep',
            backgroundColor: AppColors.buttonPrimary,
            textColor: AppColors.textLight,
            icon: Icons.air_rounded,
            onTap: () {
              showSearch(
                context: context,
                delegate: GlobalSearchDelegate(ref),
                query: 'Fan',
              );
            },
          ),
          const SizedBox(width: AppSpacing.md),
          _BannerCard(
            title: 'Electrical Services',
            subtitle: 'Trusted Professionals',
            description: 'Licensed electricians in Kolathur',
            backgroundColor: AppColors.surface,
            textColor: AppColors.textPrimary,
            icon: Icons.electrical_services_rounded,
            onTap: () {
              showSearch(
                context: context,
                delegate: GlobalSearchDelegate(ref),
                query: 'Electrical',
              );
            },
          ),
        ],
      ),
    );
  }
}

class _BannerCard extends StatelessWidget {
  const _BannerCard({
    required this.title,
    required this.subtitle,
    required this.description,
    required this.backgroundColor,
    required this.textColor,
    required this.icon,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final String description;
  final Color backgroundColor;
  final Color textColor;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
      width: 280,
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: AppRadius.cardRadius,
        border: backgroundColor == AppColors.surface
            ? Border.all(color: AppColors.border, width: 0.5)
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: textColor.withValues(alpha: 0.7),
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
              Icon(icon, color: textColor.withValues(alpha: 0.6), size: 28),
            ],
          ),
          const Spacer(),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: textColor,
                ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            description,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: textColor.withValues(alpha: 0.7),
                ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
      ),
    );
  }
}
