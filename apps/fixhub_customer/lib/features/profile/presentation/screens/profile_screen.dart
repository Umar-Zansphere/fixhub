import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/widgets/fixhub_dialog.dart';
import '../../../../core/router/route_names.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

/// Profile screen — personal info, menu items, logout.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: Text(
          'Profile',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        centerTitle: false,
        automaticallyImplyLeading: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screenPadding),
        children: [
          // Profile card
          Container(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            decoration: BoxDecoration(
              color: AppColors.elevatedSurface,
              borderRadius: AppRadius.cardRadius,
              border: Border.all(color: AppColors.border, width: 0.5),
            ),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: AppSpacing.avatarSizeLarge,
                  height: AppSpacing.avatarSizeLarge,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.border, width: 0.5),
                  ),
                  child: Center(
                    child: Text(
                      user?.displayName.isNotEmpty == true
                          ? user!.displayName[0].toUpperCase()
                          : 'C',
                      style:
                          Theme.of(context).textTheme.headlineLarge?.copyWith(
                                color: AppColors.textPrimary,
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
                        user?.displayName ?? 'Customer',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        user?.phone ?? '',
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {
                    context.push('/edit-profile');
                  },
                  icon: const Icon(
                    Icons.edit_outlined,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // Menu items
          _MenuItem(
            icon: Icons.person_outline_rounded,
            title: 'Personal Information',
            onTap: () => context.push('/edit-profile'),
          ),
          _MenuItem(
            icon: Icons.history_rounded,
            title: 'Booking History',
            onTap: () => context.push(RouteNames.bookings),
          ),
          _MenuItem(
            icon: Icons.location_on_outlined,
            title: 'Saved Addresses',
            onTap: () => context.push('/saved-addresses'),
          ),
          _MenuItem(
            icon: Icons.help_outline_rounded,
            title: 'Help & Support',
            onTap: () {},
          ),
          _MenuItem(
            icon: Icons.info_outline_rounded,
            title: 'About FixHub',
            onTap: () {},
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // Logout
          FixHubButton.secondary(
            label: 'Log Out',
            icon: Icons.logout_rounded,
            onPressed: () async {
              final confirmed = await FixHubDialog.showConfirm(
                context: context,
                title: 'Log out?',
                message: 'You\'ll need to verify your phone number again to log back in.',
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

          const SizedBox(height: AppSpacing.xl),

          // Version
          Center(
            child: Text(
              'FixHub v0.1.0',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textDisabled,
                  ),
            ),
          ),

          const SizedBox(height: AppSpacing.bottomSafePadding),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.md,
          horizontal: AppSpacing.xs,
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.textPrimary, size: 24),
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
            ),
          ],
        ),
      ),
    );
  }
}
