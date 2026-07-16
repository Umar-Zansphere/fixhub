import 'package:flutter/material.dart';

/// FixHub Design System — Color Tokens
///
/// Warm neutral palette. Minimal, elegant, professional.
/// Matches the finalized design system specification.
class AppColors {
  AppColors._();

  // ── Primary Background ──────────────────────────────────────
  static const Color background = Color(0xFFFAF8F5);
  static const Color surface = Color(0xFFF2EEE8);
  static const Color elevatedSurface = Color(0xFFFFFFFF);

  // ── Text ────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF2B2111);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textDisabled = Color(0xFF9CA3AF);
  static const Color textLight = Color(0xFFFFFFFF);

  // ── Buttons ─────────────────────────────────────────────────
  static const Color buttonPrimary = Color(0xFF1F1F1F);
  static const Color buttonPrimaryText = Color(0xFFFFFFFF);
  static const Color buttonSecondary = Colors.transparent;
  static const Color buttonSecondaryBorder = Color(0xFFDDD7CE);

  // ── Borders & Dividers ──────────────────────────────────────
  static const Color border = Color(0xFFE7E2DA);
  static const Color divider = Color(0xFFECE7E0);

  // ── Status ──────────────────────────────────────────────────
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFD97706);
  static const Color error = Color(0xFFDC2626);
  static const Color info = Color(0xFF2563EB);

  // ── Shimmer ─────────────────────────────────────────────────
  static const Color shimmerBase = Color(0xFFECE7E0);
  static const Color shimmerHighlight = Color(0xFFF5F2ED);

  // ── Misc ────────────────────────────────────────────────────
  static const Color overlay = Color(0x80000000);
  static const Color scrim = Color(0x33000000);
}
