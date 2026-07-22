import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_images.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/config/theme/app_spacing.dart';
import 'global_search_delegate.dart';

/// Featured promotional banner — horizontal scrolling cards with real images.
class FeaturedBanner extends ConsumerWidget {
  const FeaturedBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SizedBox(
      height: 180,
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
            imagePath: AppImages.bannerFanRepair,
            accentColor: AppColors.buttonPrimary,
            onTap: () => showSearch(
              context: context,
              delegate: GlobalSearchDelegate(ref),
              query: 'Fan',
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          _BannerCard(
            title: 'Electrical Services',
            subtitle: 'Trusted Professionals',
            description: 'Licensed electricians in Kolathur',
            imagePath: AppImages.bannerElectrical,
            accentColor: const Color(0xFF1A365D),
            onTap: () => showSearch(
              context: context,
              delegate: GlobalSearchDelegate(ref),
              query: 'Electrical',
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          _BannerCard(
            title: 'AC Service',
            subtitle: 'Beat the heat',
            description: 'AC cleaning, servicing & gas refill',
            imagePath: AppImages.bannerAcService,
            accentColor: const Color(0xFF1A3A4A),
            onTap: () => showSearch(
              context: context,
              delegate: GlobalSearchDelegate(ref),
              query: 'AC',
            ),
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
    required this.imagePath,
    required this.accentColor,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final String description;
  final String imagePath;
  final Color accentColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: AppRadius.cardRadius,
        child: SizedBox(
          width: 280,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background image
              Image.asset(
                imagePath,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(color: accentColor),
              ),
              // Dark gradient overlay
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topRight,
                    end: Alignment.bottomLeft,
                    colors: [
                      accentColor.withValues(alpha: 0.2),
                      accentColor.withValues(alpha: 0.88),
                    ],
                  ),
                ),
              ),
              // Content
              Padding(
                padding: const EdgeInsets.all(AppSpacing.cardPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        subtitle,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Text(
                          'Book now',
                          style:
                              Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          size: 14,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
