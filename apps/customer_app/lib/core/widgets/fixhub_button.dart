import 'package:flutter/material.dart';
import '../config/theme/app_colors.dart';
import '../config/theme/app_radius.dart';
import '../config/theme/app_spacing.dart';

/// Primary, Secondary, and Ghost buttons following the FixHub design system.
///
/// Usage:
/// ```dart
/// FixHubButton(label: 'Book Now', onPressed: () {})
/// FixHubButton.secondary(label: 'Cancel', onPressed: () {})
/// FixHubButton.ghost(label: 'Skip', onPressed: () {})
/// ```
class FixHubButton extends StatelessWidget {
  const FixHubButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.fullWidth = true,
  })  : _variant = _ButtonVariant.primary;

  const FixHubButton.secondary({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.fullWidth = true,
  }) : _variant = _ButtonVariant.secondary;

  const FixHubButton.ghost({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.fullWidth = true,
  }) : _variant = _ButtonVariant.ghost;

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final bool fullWidth;
  final _ButtonVariant _variant;

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || isLoading;

    switch (_variant) {
      case _ButtonVariant.primary:
        return SizedBox(
          width: fullWidth ? double.infinity : null,
          height: AppSpacing.buttonHeight,
          child: ElevatedButton(
            onPressed: isDisabled ? null : onPressed,
            child: _buildChild(AppColors.buttonPrimaryText),
          ),
        );
      case _ButtonVariant.secondary:
        return SizedBox(
          width: fullWidth ? double.infinity : null,
          height: AppSpacing.buttonHeight,
          child: OutlinedButton(
            onPressed: isDisabled ? null : onPressed,
            child: _buildChild(AppColors.textPrimary),
          ),
        );
      case _ButtonVariant.ghost:
        return SizedBox(
          width: fullWidth ? double.infinity : null,
          height: AppSpacing.buttonHeight,
          child: TextButton(
            onPressed: isDisabled ? null : onPressed,
            child: _buildChild(AppColors.textPrimary),
          ),
        );
    }
  }

  Widget _buildChild(Color color) {
    if (isLoading) {
      return SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          color: color,
        ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: AppSpacing.iconSize),
          const SizedBox(width: AppSpacing.xs),
          Text(label),
        ],
      );
    }

    return Text(label);
  }
}

/// Icon-only circular button.
class FixHubIconButton extends StatelessWidget {
  const FixHubIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.size = 48,
    this.backgroundColor,
    this.iconColor,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final double size;
  final Color? backgroundColor;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Material(
        color: backgroundColor ?? AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(size / 2),
        ),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(size / 2),
          child: Center(
            child: Icon(
              icon,
              color: iconColor ?? AppColors.textPrimary,
              size: AppSpacing.iconSize,
            ),
          ),
        ),
      ),
    );
  }
}

enum _ButtonVariant { primary, secondary, ghost }
