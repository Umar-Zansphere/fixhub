import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../config/theme/app_colors.dart';
import '../config/theme/app_radius.dart';

/// Shimmer skeleton loader for list items
class FpSkeleton extends StatelessWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const FpSkeleton({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.border,
      highlightColor: AppColors.surface,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: borderRadius ?? BorderRadius.circular(AppRadius.sm),
        ),
      ),
    );
  }
}

/// Skeleton for a job/booking card
class FpJobCardSkeleton extends StatelessWidget {
  const FpJobCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const FpSkeleton(width: 80, height: 20),
              const Spacer(),
              FpSkeleton(
                width: 60,
                height: 20,
                borderRadius: BorderRadius.circular(20),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const FpSkeleton(height: 16),
          const SizedBox(height: 8),
          const FpSkeleton(width: 200, height: 14),
          const SizedBox(height: 16),
          Row(
            children: [
              const FpSkeleton(width: 100, height: 14),
              const Spacer(),
              const FpSkeleton(width: 60, height: 14),
            ],
          ),
        ],
      ),
    );
  }
}

/// Skeleton for earnings list item
class FpEarningsItemSkeleton extends StatelessWidget {
  const FpEarningsItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          FpSkeleton(
            width: 40,
            height: 40,
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FpSkeleton(height: 14),
                SizedBox(height: 6),
                FpSkeleton(width: 120, height: 12),
              ],
            ),
          ),
          const SizedBox(width: 12),
          const FpSkeleton(width: 60, height: 16),
        ],
      ),
    );
  }
}

/// Full page loading
class FpPageLoader extends StatelessWidget {
  const FpPageLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(
        color: AppColors.primary,
        strokeWidth: 2.5,
      ),
    );
  }
}
