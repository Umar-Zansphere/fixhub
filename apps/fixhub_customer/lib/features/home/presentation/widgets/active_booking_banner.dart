import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';
import '../../../booking/data/models/booking_model.dart';
import '../../../booking/presentation/providers/booking_provider.dart';

class ActiveBookingBanner extends ConsumerWidget {
  const ActiveBookingBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(bookingsProvider);

    return bookingsAsync.when(
      data: (bookings) {
        // Find the first active booking
        final activeBooking = bookings.where((b) => 
          b.statusType != BookingStatusType.completed && 
          b.statusType != BookingStatusType.cancelled && 
          b.statusType != BookingStatusType.failed
        ).firstOrNull;

        if (activeBooking == null) return const SizedBox.shrink();

        return GestureDetector(
          onTap: () {
            context.push('/booking-detail/${activeBooking.id}');
          },
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppRadius.cardRadius,
              border: Border.all(color: AppColors.buttonPrimary, width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: AppColors.buttonPrimary.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.buttonPrimary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.calendar_month,
                    color: AppColors.buttonPrimary,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Active Booking',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: AppColors.buttonPrimary,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        activeBooking.subService?['name'] ?? 'Service',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        activeBooking.displayStatus,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: AppColors.textSecondary,
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}
