import 'package:flutter/material.dart';
import '../config/theme/app_colors.dart';
import '../config/theme/app_radius.dart';
import '../config/theme/app_spacing.dart';

enum FpButtonVariant { primary, secondary, ghost, danger }

enum FpButtonSize { large, medium, small }

class FpButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final FpButtonVariant variant;
  final FpButtonSize size;
  final bool isLoading;
  final Widget? leading;
  final Widget? trailing;
  final bool fullWidth;

  const FpButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = FpButtonVariant.primary,
    this.size = FpButtonSize.large,
    this.isLoading = false,
    this.leading,
    this.trailing,
    this.fullWidth = true,
  });

  @override
  Widget build(BuildContext context) {
    final height = switch (size) {
      FpButtonSize.large => AppSpacing.buttonHeight,
      FpButtonSize.medium => AppSpacing.buttonHeightSm,
      FpButtonSize.small => 36.0,
    };

    final fontSize = switch (size) {
      FpButtonSize.large => 16.0,
      FpButtonSize.medium => 15.0,
      FpButtonSize.small => 14.0,
    };

    final hPadding = switch (size) {
      FpButtonSize.large => AppSpacing.xl,
      FpButtonSize.medium => AppSpacing.base,
      FpButtonSize.small => AppSpacing.md,
    };

    return switch (variant) {
      FpButtonVariant.primary => _buildElevated(height, fontSize, hPadding),
      FpButtonVariant.secondary => _buildOutlined(height, fontSize, hPadding),
      FpButtonVariant.ghost => _buildGhost(height, fontSize, hPadding),
      FpButtonVariant.danger => _buildDanger(height, fontSize, hPadding),
    };
  }

  Widget _buildElevated(double height, double fontSize, double hPadding) {
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: height,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
          padding: EdgeInsets.symmetric(horizontal: hPadding),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.button),
          elevation: 0,
        ),
        child: _buildContent(fontSize, AppColors.textOnPrimary),
      ),
    );
  }

  Widget _buildOutlined(double height, double fontSize, double hPadding) {
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: height,
      child: OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: BorderSide(
            color: onPressed == null ? AppColors.border : AppColors.primary,
            width: 1.5,
          ),
          padding: EdgeInsets.symmetric(horizontal: hPadding),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.button),
        ),
        child: _buildContent(fontSize, AppColors.primary),
      ),
    );
  }

  Widget _buildGhost(double height, double fontSize, double hPadding) {
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: height,
      child: TextButton(
        onPressed: isLoading ? null : onPressed,
        style: TextButton.styleFrom(
          foregroundColor: AppColors.textSecondary,
          padding: EdgeInsets.symmetric(horizontal: hPadding),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.button),
        ),
        child: _buildContent(fontSize, AppColors.textSecondary),
      ),
    );
  }

  Widget _buildDanger(double height, double fontSize, double hPadding) {
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: height,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.error,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.error.withValues(alpha: 0.5),
          padding: EdgeInsets.symmetric(horizontal: hPadding),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.button),
          elevation: 0,
        ),
        child: _buildContent(fontSize, Colors.white),
      ),
    );
  }

  Widget _buildContent(double fontSize, Color color) {
    if (isLoading) {
      return SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      );
    }

    return Row(
      mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (leading != null) ...[
          leading!,
          const SizedBox(width: AppSpacing.sm),
        ],
        Text(
          label,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: AppSpacing.sm),
          trailing!,
        ],
      ],
    );
  }
}
