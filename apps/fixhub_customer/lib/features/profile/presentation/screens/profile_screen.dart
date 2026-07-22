import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/widgets/fixhub_dialog.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../booking/presentation/providers/booking_provider.dart';

/// Profile screen — gradient header, stats, grouped menu items, logout.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final bookingsAsync = ref.watch(bookingsProvider);
    final user = authState.user;
    final userName = user?.displayName ?? 'Customer';
    final firstLetter = userName.isNotEmpty ? userName[0].toUpperCase() : 'C';

    // Count stats from bookings
    int totalBookings = 0;
    int completedBookings = 0;
    if (bookingsAsync.hasValue) {
      final bookings = bookingsAsync.value ?? [];
      totalBookings = bookings.length;
      completedBookings = bookings
          .where((b) => b.statusType == BookingStatusType.completed)
          .length;
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: ListView(
        children: [
          // ── Profile Hero Header ───────────────────────────────
          Container(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.screenPadding,
              0,
              AppSpacing.screenPadding,
              AppSpacing.xl,
            ),
            decoration: const BoxDecoration(
              color: AppColors.elevatedSurface,
              border: Border(
                bottom: BorderSide(color: AppColors.border, width: 0.5),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  const SizedBox(height: AppSpacing.md),
                  // Top bar
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Profile',
                        style:
                            Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      IconButton(
                        onPressed: () => context.push(RouteNames.editProfile),
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: AppColors.border, width: 0.5),
                          ),
                          child: const Icon(
                            Icons.edit_outlined,
                            size: 18,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),

                  // Avatar + name
                  Row(
                    children: [
                      // Gradient avatar
                      Container(
                        width: AppSpacing.avatarSizeLarge,
                        height: AppSpacing.avatarSizeLarge,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF2B2111), Color(0xFF6B5A3E)],
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            firstLetter,
                            style: Theme.of(context)
                                .textTheme
                                .headlineLarge
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              userName,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: AppSpacing.xxs),
                            Text(
                              user?.phone ?? '',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Stats row
                  Container(
                    padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.md, horizontal: AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _StatItem(
                          value: totalBookings.toString(),
                          label: 'Total\nBookings',
                          icon: Icons.calendar_month_rounded,
                        ),
                        Container(
                          width: 0.5,
                          height: 40,
                          color: AppColors.divider,
                        ),
                        _StatItem(
                          value: completedBookings.toString(),
                          label: 'Completed',
                          icon: Icons.check_circle_outline_rounded,
                        ),
                        Container(
                          width: 0.5,
                          height: 40,
                          color: AppColors.divider,
                        ),
                        _StatItem(
                          value: completedBookings > 0
                              ? '${((completedBookings / totalBookings) * 100).round()}%'
                              : '—',
                          label: 'Success\nRate',
                          icon: Icons.trending_up_rounded,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.xl),

          // ── Account Section ─────────────────────────────────
          _SectionHeader(title: 'Account'),
          _MenuItem(
            icon: Icons.person_outline_rounded,
            iconColor: AppColors.info,
            title: 'Personal Information',
            onTap: () => context.push(RouteNames.editProfile),
          ),
          _MenuItem(
            icon: Icons.location_on_outlined,
            iconColor: AppColors.success,
            title: 'Saved Addresses',
            onTap: () => context.push(RouteNames.savedAddresses),
          ),

          const SizedBox(height: AppSpacing.md),
          _SectionHeader(title: 'Activity'),
          _MenuItem(
            icon: Icons.history_rounded,
            iconColor: AppColors.warning,
            title: 'Booking History',
            onTap: () => context.push(RouteNames.bookings),
          ),

          const SizedBox(height: AppSpacing.md),
          _SectionHeader(title: 'Support'),
          _MenuItem(
            icon: Icons.help_outline_rounded,
            iconColor: AppColors.textSecondary,
            title: 'Help & Support',
            onTap: () => context.push(RouteNames.support),
          ),
          _MenuItem(
            icon: Icons.info_outline_rounded,
            iconColor: AppColors.textSecondary,
            title: 'About FixHub',
            onTap: () {},
          ),

          const SizedBox(height: AppSpacing.xxl),

          // Logout
          Padding(
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screenPadding),
            child: FixHubButton.secondary(
              label: 'Log Out',
              icon: Icons.logout_rounded,
              onPressed: () async {
                final confirmed = await FixHubDialog.showConfirm(
                  context: context,
                  title: 'Log out?',
                  message:
                      "You'll need to verify your phone number again to log back in.",
                  confirmLabel: 'Log Out',
                  cancelLabel: 'Cancel',
                );

                if (confirmed == true) {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    context.go(RouteNames.welcome);
                  }
                }
              },
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // Version
          Center(
            child: Text(
              'FixHub v1.0.0',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textDisabled,
                  ),
            ),
          ),

          const SizedBox(height: AppSpacing.huge),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.screenPadding,
        0,
        AppSpacing.screenPadding,
        AppSpacing.xs,
      ),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.textDisabled,
              letterSpacing: 1.2,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.value,
    required this.label,
    required this.icon,
  });

  final String value;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
                height: 1.3,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.sm,
          horizontal: AppSpacing.screenPadding,
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                title,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textDisabled,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
