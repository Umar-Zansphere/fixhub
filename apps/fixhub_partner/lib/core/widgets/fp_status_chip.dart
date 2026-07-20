import 'package:flutter/material.dart';
import '../config/theme/app_colors.dart';
import '../config/theme/app_radius.dart';
import '../config/theme/app_spacing.dart';

enum JobStatus {
  draft,
  pendingPayment,
  confirmed,
  assigned,
  accepted,
  enRoute,
  arrived,
  inProgress,
  completed,
  cancelled,
  failed,
}

class FpStatusChip extends StatelessWidget {
  final JobStatus status;
  final double fontSize;
  final bool compact;

  const FpStatusChip({
    super.key,
    required this.status,
    this.fontSize = 12,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final config = _getConfig(status);
    final vPad = compact ? AppSpacing.xs : 6.0;
    final hPad = compact ? AppSpacing.sm : AppSpacing.md;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
      decoration: BoxDecoration(
        color: config.bgColor,
        borderRadius: AppRadius.pill,
        border: Border.all(color: config.color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: config.color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Text(
            config.label,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
              color: config.color,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  _ChipConfig _getConfig(JobStatus status) {
    return switch (status) {
      JobStatus.draft => _ChipConfig(
        'Draft',
        AppColors.textSecondary,
        AppColors.surfaceVariant,
      ),
      JobStatus.pendingPayment => _ChipConfig(
        'Pending Payment',
        AppColors.warning,
        AppColors.warningLight,
      ),
      JobStatus.confirmed => _ChipConfig(
        'Confirmed',
        AppColors.info,
        AppColors.infoLight,
      ),
      JobStatus.assigned => _ChipConfig(
        'Assigned',
        AppColors.chipAssigned,
        AppColors.chipAssignedBg,
      ),
      JobStatus.accepted => _ChipConfig(
        'Accepted',
        AppColors.chipAccepted,
        AppColors.chipAcceptedBg,
      ),
      JobStatus.enRoute => _ChipConfig(
        'En Route',
        AppColors.chipEnRoute,
        AppColors.chipEnRouteBg,
      ),
      JobStatus.arrived => _ChipConfig(
        'Arrived',
        AppColors.chipEnRoute,
        AppColors.chipEnRouteBg,
      ),
      JobStatus.inProgress => _ChipConfig(
        'In Progress',
        AppColors.chipInProgress,
        AppColors.chipInProgressBg,
      ),
      JobStatus.completed => _ChipConfig(
        'Completed',
        AppColors.chipCompleted,
        AppColors.chipCompletedBg,
      ),
      JobStatus.cancelled => _ChipConfig(
        'Cancelled',
        AppColors.chipCancelled,
        AppColors.chipCancelledBg,
      ),
      JobStatus.failed => _ChipConfig(
        'Failed',
        AppColors.chipCancelled,
        AppColors.chipCancelledBg,
      ),
    };
  }

  static JobStatus fromString(String status) {
    return switch (status.toUpperCase()) {
      'DRAFT' => JobStatus.draft,
      'PENDING_PAYMENT' => JobStatus.pendingPayment,
      'CONFIRMED' => JobStatus.confirmed,
      'ASSIGNED' => JobStatus.assigned,
      'ACCEPTED' => JobStatus.accepted,
      'EN_ROUTE' => JobStatus.enRoute,
      'ARRIVED' => JobStatus.arrived,
      'IN_PROGRESS' => JobStatus.inProgress,
      'COMPLETED' => JobStatus.completed,
      'CANCELLED' => JobStatus.cancelled,
      'FAILED' => JobStatus.failed,
      _ => JobStatus.confirmed,
    };
  }
}

class _ChipConfig {
  final String label;
  final Color color;
  final Color bgColor;

  const _ChipConfig(this.label, this.color, this.bgColor);
}
