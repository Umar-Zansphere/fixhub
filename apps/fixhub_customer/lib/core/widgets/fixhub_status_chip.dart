import 'package:flutter/material.dart';
import '../config/theme/app_colors.dart';
import '../config/theme/app_spacing.dart';

/// Booking status indicator chip.
class FixHubStatusChip extends StatelessWidget {
  const FixHubStatusChip({
    super.key,
    required this.label,
    required this.status,
  });

  final String label;
  final BookingStatusType status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: _textColor,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }

  Color get _backgroundColor {
    switch (status) {
      case BookingStatusType.pending:
        return const Color(0xFFFEF3C7);
      case BookingStatusType.confirmed:
      case BookingStatusType.assigned:
        return const Color(0xFFDBEAFE);
      case BookingStatusType.inProgress:
      case BookingStatusType.enRoute:
      case BookingStatusType.arrived:
        return const Color(0xFFE0F2FE);
      case BookingStatusType.completed:
        return const Color(0xFFDCFCE7);
      case BookingStatusType.cancelled:
      case BookingStatusType.failed:
        return const Color(0xFFFEE2E2);
    }
  }

  Color get _textColor {
    switch (status) {
      case BookingStatusType.pending:
        return AppColors.warning;
      case BookingStatusType.confirmed:
      case BookingStatusType.assigned:
        return AppColors.info;
      case BookingStatusType.inProgress:
      case BookingStatusType.enRoute:
      case BookingStatusType.arrived:
        return const Color(0xFF0284C7);
      case BookingStatusType.completed:
        return AppColors.success;
      case BookingStatusType.cancelled:
      case BookingStatusType.failed:
        return AppColors.error;
    }
  }
}

enum BookingStatusType {
  pending,
  confirmed,
  assigned,
  enRoute,
  arrived,
  inProgress,
  completed,
  cancelled,
  failed,
}
