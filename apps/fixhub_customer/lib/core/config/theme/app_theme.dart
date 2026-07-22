import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';
import 'app_radius.dart';
import 'app_spacing.dart';
import 'app_typography.dart';

/// FixHub Design System — Material 3 Theme
///
/// Soft neutral design. Minimal, elegant, professional.
/// Premium spacing. Rounded components. Subtle borders.
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: AppColors.background,

        // ── Color Scheme ────────────────────────────────────────
        colorScheme: const ColorScheme.light(
          primary: AppColors.buttonPrimary,
          onPrimary: AppColors.buttonPrimaryText,
          secondary: AppColors.textSecondary,
          onSecondary: AppColors.textLight,
          surface: AppColors.elevatedSurface,
          onSurface: AppColors.textPrimary,
          error: AppColors.error,
          onError: AppColors.textLight,
          outline: AppColors.border,
          surfaceContainerHighest: AppColors.surface,
        ),

        // ── App Bar ─────────────────────────────────────────────
        appBarTheme: AppBarTheme(
          centerTitle: false,
          elevation: 0,
          scrolledUnderElevation: 0,
          backgroundColor: AppColors.background,
          foregroundColor: AppColors.textPrimary,
          surfaceTintColor: Colors.transparent,
          systemOverlayStyle: const SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.dark,
            statusBarBrightness: Brightness.light,
          ),
          titleTextStyle: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),

        // ── Elevated Button (Primary) ───────────────────────────
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.buttonPrimary,
            foregroundColor: AppColors.buttonPrimaryText,
            disabledBackgroundColor: AppColors.textDisabled,
            disabledForegroundColor: AppColors.textLight,
            minimumSize: const Size(double.infinity, AppSpacing.buttonHeight),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xl,
              vertical: AppSpacing.md,
            ),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: AppRadius.buttonRadius,
            ),
            textStyle: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // ── Outlined Button (Secondary) ─────────────────────────
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textPrimary,
            minimumSize: const Size(double.infinity, AppSpacing.buttonHeight),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xl,
              vertical: AppSpacing.md,
            ),
            elevation: 0,
            side: const BorderSide(color: AppColors.buttonSecondaryBorder),
            shape: RoundedRectangleBorder(
              borderRadius: AppRadius.buttonRadius,
            ),
            textStyle: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // ── Text Button (Ghost) ─────────────────────────────────
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.textPrimary,
            textStyle: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // ── Input Decoration ────────────────────────────────────
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.elevatedSurface,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.lg,
          ),
          border: OutlineInputBorder(
            borderRadius: AppRadius.inputRadius,
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: AppRadius.inputRadius,
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: AppRadius.inputRadius,
            borderSide: const BorderSide(
              color: AppColors.buttonPrimary,
              width: 1.5,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: AppRadius.inputRadius,
            borderSide: const BorderSide(color: AppColors.error),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: AppRadius.inputRadius,
            borderSide: const BorderSide(color: AppColors.error, width: 1.5),
          ),
          hintStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.normal,
            color: AppColors.textDisabled,
          ),
          labelStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary,
          ),
          errorStyle: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.error,
          ),
        ),

        // ── Card ────────────────────────────────────────────────
        cardTheme: CardThemeData(
          elevation: 0,
          color: AppColors.elevatedSurface,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.cardRadius,
            side: const BorderSide(color: AppColors.border, width: 0.5),
          ),
          margin: EdgeInsets.zero,
        ),

        // ── Bottom Sheet ────────────────────────────────────────
        bottomSheetTheme: const BottomSheetThemeData(
          backgroundColor: AppColors.elevatedSurface,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(AppRadius.bottomSheet),
              topRight: Radius.circular(AppRadius.bottomSheet),
            ),
          ),
          showDragHandle: true,
          dragHandleColor: AppColors.border,
        ),

        // ── Dialog ──────────────────────────────────────────────
        dialogTheme: DialogThemeData(
          backgroundColor: AppColors.elevatedSurface,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.dialogRadius,
          ),
          titleTextStyle: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),

        // ── Navigation Bar (Bottom) ─────────────────────────────
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: AppColors.elevatedSurface,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          height: AppSpacing.bottomNavHeight,
          indicatorColor: AppColors.surface,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const IconThemeData(
                color: AppColors.textPrimary,
                size: 24,
              );
            }
            return const IconThemeData(
              color: AppColors.textDisabled,
              size: 24,
            );
          }),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              );
            }
            return GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.normal,
              color: AppColors.textDisabled,
            );
          }),
        ),

        // ── Snack Bar ───────────────────────────────────────────
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.textPrimary,
          contentTextStyle: GoogleFonts.inter(
            fontSize: 14,
            color: AppColors.textLight,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.smallRadius,
          ),
          behavior: SnackBarBehavior.floating,
        ),

        // ── Divider ─────────────────────────────────────────────
        dividerTheme: const DividerThemeData(
          color: AppColors.divider,
          thickness: 1,
          space: 0,
        ),

        // ── Chip ────────────────────────────────────────────────
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.chip),
          ),
          side: BorderSide.none,
          labelStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),

        // ── Text Theme ──────────────────────────────────────────
        textTheme: AppTypography.textTheme,

        // ── Splash/Ripple ───────────────────────────────────────
        splashFactory: InkSparkle.splashFactory,
      );

  // Dark theme — future-ready placeholder
  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: AppTypography.fontFamily,
        textTheme: AppTypography.textTheme,
      );
}
