import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Primary Palette ─────────────────────────────────────────────
  static const Color background = Color(0xFFF7F6F3);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF2EFE9);

  // ── Accent ──────────────────────────────────────────────────────
  /// Muted Olive Green — primary action / active state
  static const Color primary = Color(0xFF6F7F5F);
  static const Color primaryLight = Color(0xFF8A9B78);
  static const Color primaryDark = Color(0xFF566348);
  static const Color primaryContainer = Color(0xFFE8EDE3);

  /// Warm Sand — secondary accent
  static const Color secondary = Color(0xFFD7CCB8);
  static const Color secondaryLight = Color(0xFFEDE6D8);
  static const Color secondaryDark = Color(0xFFBFB29E);

  // ── Text ────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF1F2933);
  static const Color textSecondary = Color(0xFF667085);
  static const Color textDisabled = Color(0xFF9CA3AF);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // ── Semantic ────────────────────────────────────────────────────
  static const Color success = Color(0xFF4F8A5B);
  static const Color successLight = Color(0xFFE8F3EB);
  static const Color warning = Color(0xFFD4A44F);
  static const Color warningLight = Color(0xFFFBF4E6);
  static const Color error = Color(0xFFC95A5A);
  static const Color errorLight = Color(0xFFF9ECEC);
  static const Color info = Color(0xFF2563EB);
  static const Color infoLight = Color(0xFFEFF4FF);

  // ── Border / Divider ────────────────────────────────────────────
  static const Color border = Color(0xFFE7E5E0);
  static const Color divider = Color(0xFFECE7E0);

  // ── Dark Theme ──────────────────────────────────────────────────
  static const Color backgroundDark = Color(0xFF111210);
  static const Color surfaceDark = Color(0xFF1C1E1A);
  static const Color textPrimaryDark = Color(0xFFF1EFE9);
  static const Color textSecondaryDark = Color(0xFF9CA3AF);
  static const Color borderDark = Color(0xFF2E3029);

  // ── Status Chip Colors ──────────────────────────────────────────
  static const Color chipAssigned = Color(0xFF2563EB);
  static const Color chipAssignedBg = Color(0xFFEFF4FF);
  static const Color chipAccepted = Color(0xFF6F7F5F);
  static const Color chipAcceptedBg = Color(0xFFE8EDE3);
  static const Color chipEnRoute = Color(0xFFD4A44F);
  static const Color chipEnRouteBg = Color(0xFFFBF4E6);
  static const Color chipInProgress = Color(0xFF7C3AED);
  static const Color chipInProgressBg = Color(0xFFF3EFFE);
  static const Color chipCompleted = Color(0xFF4F8A5B);
  static const Color chipCompletedBg = Color(0xFFE8F3EB);
  static const Color chipCancelled = Color(0xFFC95A5A);
  static const Color chipCancelledBg = Color(0xFFF9ECEC);
}
