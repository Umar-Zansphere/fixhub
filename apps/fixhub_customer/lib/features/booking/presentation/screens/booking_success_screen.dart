import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lottie/lottie.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_images.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/router/route_names.dart';
import '../providers/booking_flow_provider.dart';

class BookingSuccessScreen extends ConsumerWidget {
  const BookingSuccessScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flowState = ref.watch(bookingFlowProvider);
    final serviceName = flowState.selectedService?.name ?? 'your service';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // Lottie animation
              SizedBox(
                width: 200,
                height: 200,
                child: Lottie.asset(
                  AppImages.bookingSuccessAnimation,
                  repeat: false,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      size: 64,
                      color: AppColors.success,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.xl),

              // Success headline
              Text(
                'Booking Confirmed!',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Your request for $serviceName has been received.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: AppSpacing.xxl),

              // Info card
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.elevatedSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border, width: 0.5),
                ),
                child: Column(
                  children: [
                    _InfoRow(
                      icon: Icons.pending_rounded,
                      iconColor: const Color(0xFFF59E0B),
                      title: 'Status',
                      value: 'Waiting for technician',
                    ),
                    const Divider(height: AppSpacing.xl),
                    _InfoRow(
                      icon: Icons.notifications_rounded,
                      iconColor: AppColors.info,
                      title: 'You will receive',
                      value: 'Push notification when assigned',
                    ),
                    const Divider(height: AppSpacing.xl),
                    _InfoRow(
                      icon: Icons.support_agent_rounded,
                      iconColor: AppColors.success,
                      title: 'Support',
                      value: 'Help & Support in app',
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 3),

              // CTAs
              FixHubButton(
                label: 'View My Booking',
                onPressed: () {
                  ref.read(bookingFlowProvider.notifier).clearFlow();
                  context.go(RouteNames.bookings);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              FixHubButton.secondary(
                label: 'Back to Home',
                onPressed: () {
                  ref.read(bookingFlowProvider.notifier).clearFlow();
                  context.go(RouteNames.home);
                },
              ),
              const SizedBox(height: AppSpacing.bottomSafePadding),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 18, color: iconColor),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontSize: 14,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
