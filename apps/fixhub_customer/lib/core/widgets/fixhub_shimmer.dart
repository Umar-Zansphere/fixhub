import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../config/theme/app_colors.dart';
import '../config/theme/app_radius.dart';
import '../config/theme/app_spacing.dart';

/// Skeleton loading placeholders using shimmer effect.
class FixHubShimmer extends StatelessWidget {
  const FixHubShimmer({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmerBase,
      highlightColor: AppColors.shimmerHighlight,
      child: child,
    );
  }

  /// A single shimmer line placeholder.
  static Widget line({
    double width = double.infinity,
    double height = 16,
    double borderRadius = 8,
  }) {
    return FixHubShimmer(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.shimmerBase,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }

  /// A shimmer circle placeholder (e.g. avatar).
  static Widget circle({double size = 48}) {
    return FixHubShimmer(
      child: Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(
          color: AppColors.shimmerBase,
          shape: BoxShape.circle,
        ),
      ),
    );
  }

  /// A shimmer card placeholder.
  static Widget card({
    double height = 120,
    double borderRadius = AppRadius.card,
  }) {
    return FixHubShimmer(
      child: Container(
        width: double.infinity,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.shimmerBase,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }

  /// Common shimmer list for loading states.
  static Widget listPlaceholder({int itemCount = 3}) {
    return Column(
      children: List.generate(
        itemCount,
        (index) => Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: Row(
            children: [
              circle(size: 48),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    line(width: 160, height: 14),
                    const SizedBox(height: AppSpacing.xs),
                    line(width: 100, height: 12),
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
