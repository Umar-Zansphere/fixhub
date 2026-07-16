import 'package:flutter/material.dart';

/// FixHub Design System — Border Radius Tokens
class AppRadius {
  AppRadius._();

  // ── Base Tokens ─────────────────────────────────────────────
  static const double small = 12;
  static const double medium = 16;
  static const double large = 20;
  static const double xl = 24;

  // ── Component-Specific ──────────────────────────────────────
  static const double button = 16;
  static const double card = 20;
  static const double bottomSheet = 28;
  static const double dialog = 24;
  static const double input = 12;
  static const double chip = 20;
  static const double searchBar = 16;
  static const double avatar = 100;

  // ── BorderRadius Helpers ────────────────────────────────────
  static BorderRadius get smallRadius => BorderRadius.circular(small);
  static BorderRadius get mediumRadius => BorderRadius.circular(medium);
  static BorderRadius get largeRadius => BorderRadius.circular(large);
  static BorderRadius get xlRadius => BorderRadius.circular(xl);
  static BorderRadius get buttonRadius => BorderRadius.circular(button);
  static BorderRadius get cardRadius => BorderRadius.circular(card);
  static BorderRadius get inputRadius => BorderRadius.circular(input);
  static BorderRadius get dialogRadius => BorderRadius.circular(dialog);

  static BorderRadius get bottomSheetRadius => const BorderRadius.only(
        topLeft: Radius.circular(bottomSheet),
        topRight: Radius.circular(bottomSheet),
      );
}
