import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/theme/app_colors.dart';
import '../../../core/config/theme/app_spacing.dart';
import '../../../core/config/theme/app_radius.dart';
import '../../../core/widgets/fp_app_bar.dart';
import '../../../core/widgets/fp_card.dart';

class DocumentsScreen extends ConsumerWidget {
  const DocumentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FpSurfaceAppBar(title: 'My Documents'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.screenPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Identity & Verification',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            _DocumentCard(
              title: 'Aadhaar Card',
              status: 'Verified',
              isVerified: true,
              uploadDate: '12 Jan 2025',
              icon: Icons.badge_outlined,
            ),
            const SizedBox(height: AppSpacing.base),

            _DocumentCard(
              title: 'PAN Card',
              status: 'Verified',
              isVerified: true,
              uploadDate: '12 Jan 2025',
              icon: Icons.credit_card_outlined,
            ),
            const SizedBox(height: AppSpacing.base),

            _DocumentCard(
              title: 'Police Verification',
              status: 'Pending',
              isVerified: false,
              uploadDate: '14 Jan 2025',
              icon: Icons.security_rounded,
            ),
          ],
        ),
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final String title;
  final String status;
  final bool isVerified;
  final String uploadDate;
  final IconData icon;

  const _DocumentCard({
    required this.title,
    required this.status,
    required this.isVerified,
    required this.uploadDate,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return FpCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, color: AppColors.textSecondary),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  'Uploaded: $uploadDate',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isVerified
                  ? AppColors.successLight
                  : AppColors.warningLight,
              borderRadius: AppRadius.pill,
              border: Border.all(
                color: (isVerified ? AppColors.success : AppColors.warning)
                    .withValues(alpha: 0.3),
              ),
            ),
            child: Text(
              status,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isVerified ? AppColors.success : AppColors.warning,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
