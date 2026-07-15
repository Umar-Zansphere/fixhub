import 'package:flutter/material.dart';
import '../config/theme/app_colors.dart';
import '../config/theme/app_radius.dart';
import '../config/theme/app_spacing.dart';

/// Large rounded search bar with leading icon and soft background.
class FixHubSearchBar extends StatelessWidget {
  const FixHubSearchBar({
    super.key,
    this.hint = 'Search services...',
    this.onTap,
    this.controller,
    this.onChanged,
    this.readOnly = true,
    this.autofocus = false,
  });

  final String hint;
  final VoidCallback? onTap;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final bool readOnly;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: readOnly ? onTap : null,
      child: Container(
        height: AppSpacing.buttonHeight,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.searchBar),
        ),
        child: TextField(
          controller: controller,
          onChanged: onChanged,
          readOnly: readOnly,
          autofocus: autofocus,
          onTap: readOnly ? null : onTap,
          enabled: !readOnly || onTap == null,
          style: Theme.of(context).textTheme.bodyLarge,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textDisabled,
                ),
            prefixIcon: const Icon(
              Icons.search_rounded,
              color: AppColors.textDisabled,
              size: 22,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.searchBar),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.searchBar),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.searchBar),
              borderSide: BorderSide.none,
            ),
            filled: true,
            fillColor: AppColors.surface,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.md,
            ),
          ),
        ),
      ),
    );
  }
}
