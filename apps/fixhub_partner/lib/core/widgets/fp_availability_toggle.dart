import 'package:flutter/material.dart';
import '../config/theme/app_colors.dart';
import '../config/theme/app_radius.dart';
import '../config/theme/app_spacing.dart';

/// Large online/offline availability toggle for dashboard.
/// Designed for one-handed use — very large touch target.
class FpAvailabilityToggle extends StatelessWidget {
  final bool isAvailable;
  final bool isLoading;
  final ValueChanged<bool>? onChanged;

  const FpAvailabilityToggle({
    super.key,
    required this.isAvailable,
    this.isLoading = false,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final color = isAvailable ? AppColors.success : AppColors.textSecondary;
    final bgColor = isAvailable
        ? AppColors.successLight
        : AppColors.surfaceVariant;

    return GestureDetector(
      onTap: isLoading ? null : () => onChanged?.call(!isAvailable),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.base,
          vertical: AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            // Status indicator dot
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                boxShadow: isAvailable
                    ? [
                        BoxShadow(
                          color: AppColors.success.withValues(alpha: 0.4),
                          blurRadius: 6,
                          spreadRadius: 2,
                        ),
                      ]
                    : null,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),

            // Status label
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isAvailable ? 'You\'re Online' : 'You\'re Offline',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                  ),
                  Text(
                    isAvailable
                        ? 'Receiving new job requests'
                        : 'Tap to start receiving jobs',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),

            // Toggle switch
            if (isLoading)
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              Switch(
                value: isAvailable,
                onChanged: onChanged,
                activeColor: AppColors.success,
                trackColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return AppColors.success.withValues(alpha: 0.2);
                  }
                  return AppColors.border;
                }),
                thumbColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected))
                    return AppColors.success;
                  return AppColors.textSecondary;
                }),
              ),
          ],
        ),
      ),
    );
  }
}
