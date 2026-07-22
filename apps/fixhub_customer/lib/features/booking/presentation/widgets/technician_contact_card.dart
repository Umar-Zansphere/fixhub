import 'package:flutter/material.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_card.dart';

class TechnicianContactCard extends StatelessWidget {
  const TechnicianContactCard({
    super.key,
    required this.technicianData,
  });

  final Map<String, dynamic>? technicianData;

  @override
  Widget build(BuildContext context) {
    if (technicianData == null) return const SizedBox.shrink();

    final user = technicianData!['user'] as Map<String, dynamic>?;
    final name = user?['name'] ?? 'Technician';
    // final phone = user?['phone'] ?? '';
    final rating = technicianData!['rating']?.toString() ?? 'New';
    final totalJobs = technicianData!['totalJobs']?.toString() ?? '0';

    return FixHubCard(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.surface,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.border),
            ),
            child: const Icon(Icons.person, color: AppColors.textSecondary, size: 32),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, color: AppColors.warning, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      '$rating ($totalJobs jobs)',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Expert • Background Verified',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: IconButton(
              icon: const Icon(Icons.call_rounded, color: AppColors.textPrimary),
              onPressed: () {
                // TODO: Launch dialer
              },
            ),
          ),
        ],
      ),
    );
  }
}
