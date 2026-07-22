import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/widgets/fixhub_app_bar.dart';
import '../../../../core/widgets/fixhub_error_state.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';
import '../providers/booking_provider.dart';
import '../widgets/job_progress_timeline.dart';
import 'rate_service_screen.dart';

class BookingProgressScreen extends ConsumerWidget {
  const BookingProgressScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingDetailProvider(bookingId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Job in Progress'),
      body: bookingAsync.when(
        data: (booking) {
          final isCompleted = booking.statusType == BookingStatusType.completed;

          return Padding(
            padding: const EdgeInsets.all(AppSpacing.screenPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Status Card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Booking ID',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                          Text(
                            '#${booking.id.substring(0, 8).toUpperCase()}',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),
                      FixHubStatusChip(status: booking.statusType, label: booking.displayStatus),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // Description
                Text(
                  isCompleted 
                      ? '${booking.technician?['user']?['name'] ?? 'Technician'} has completed your service.'
                      : '${booking.technician?['user']?['name'] ?? 'Technician'} is working on your service.',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: AppSpacing.xxl),

                // Timeline
                Expanded(
                  child: SingleChildScrollView(
                    child: JobProgressTimeline(booking: booking),
                  ),
                ),

                // Bottom Button
                if (isCompleted && booking.review == null)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.buttonPrimary,
                        foregroundColor: AppColors.buttonPrimaryText,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => RateServiceScreen(
                              bookingId: booking.id,
                              serviceName: booking.subService?['name'] ?? 'Service',
                            ),
                          ),
                        ).then((submitted) {
                          if (submitted == true) {
                            ref.invalidate(bookingDetailProvider(bookingId));
                          }
                        });
                      },
                      child: const Text('Submit Review'),
                    ),
                  ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => FixHubErrorState(
          onRetry: () => ref.invalidate(bookingDetailProvider(bookingId)),
        ),
      ),
    );
  }
}
