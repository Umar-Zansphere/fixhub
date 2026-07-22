import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// FixHub Design System — Typography Tokens
///
/// Uses Inter font via google_fonts for a modern, clean look.
/// Hierarchy follows the design system specification.
class AppTypography {
  AppTypography._();

  static String get fontFamily => GoogleFonts.inter().fontFamily!;

  static TextTheme get textTheme => GoogleFonts.interTextTheme(
        const TextTheme(
          // Display — 32 Bold (hero headings)
          displayLarge: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            letterSpacing: -0.5,
            height: 1.25,
          ),
          // Headline Large — 28 Bold (screen titles)
          headlineLarge: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            height: 1.29,
          ),
          // Headline Medium — 20 SemiBold (section titles)
          headlineMedium: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            height: 1.4,
          ),
          // Title Large — 18 SemiBold (card titles)
          titleLarge: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            height: 1.33,
          ),
          // Title Medium — 16 Medium (body emphasis)
          titleMedium: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            height: 1.5,
          ),
          // Title Small — 14 SemiBold
          titleSmall: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            height: 1.43,
          ),
          // Body Large — 16 Regular (primary body)
          bodyLarge: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.normal,
            height: 1.5,
          ),
          // Body Medium — 14 Regular (secondary body)
          bodyMedium: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.normal,
            height: 1.43,
          ),
          // Body Small — 12 Regular (captions)
          bodySmall: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.normal,
            height: 1.33,
          ),
          // Label Large — 16 SemiBold (button text)
          labelLarge: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            height: 1.5,
          ),
          // Label Medium — 14 Medium
          labelMedium: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            height: 1.43,
          ),
          // Label Small — 12 Medium
          labelSmall: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            height: 1.33,
          ),
        ),
      );
}
