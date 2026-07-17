import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_empty_state.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';
import '../../../../core/widgets/fixhub_shimmer.dart';
import '../../../../core/widgets/fixhub_error_state.dart';
import '../providers/booking_provider.dart';

/// Bookings list screen — shows all user bookings with status filters.
class BookingsListScreen extends ConsumerStatefulWidget {
  const BookingsListScreen({super.key});

  @override
  ConsumerState<BookingsListScreen> createState() => _BookingsListScreenState();
}

class _BookingsListScreenState extends ConsumerState<BookingsListScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    // Always refresh when this screen mounts
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.invalidate(bookingsProvider);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(bookingsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: Text(
          'My Bookings',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        centerTitle: false,
        automaticallyImplyLeading: false,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.buttonPrimary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.buttonPrimary,
          tabs: const [
            Tab(text: 'Active'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: bookingsAsync.when(
        data: (bookings) {
          final activeStatuses = {
            BookingStatusType.pending, // includes DRAFT & PENDING_PAYMENT
            BookingStatusType.confirmed,
            BookingStatusType.assigned,
            BookingStatusType.enRoute,
            BookingStatusType.arrived,
            BookingStatusType.inProgress,
          };
          final activeBookings = bookings.where((b) => activeStatuses.contains(b.statusType)).toList();
          final historyBookings = bookings.where((b) =>
              b.statusType == BookingStatusType.completed ||
              b.statusType == BookingStatusType.cancelled ||
              b.statusType == BookingStatusType.failed).toList();

          return RefreshIndicator(
            color: AppColors.buttonPrimary,
            backgroundColor: AppColors.elevatedSurface,
            onRefresh: () async {
              ref.invalidate(bookingsProvider);
              await ref.read(bookingsProvider.future);
            },
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildBookingsList(context, activeBookings),
                _buildBookingsList(context, historyBookings),
              ],
            ),
          );
        },
        loading: () => Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: FixHubShimmer.listPlaceholder(itemCount: 5),
        ),
        error: (error, _) => FixHubErrorState(
          onRetry: () => ref.invalidate(bookingsProvider),
        ),
      ),
    );
  }

  Widget _buildBookingsList(BuildContext context, List<dynamic> bookings) {
    if (bookings.isEmpty) {
      return const FixHubEmptyState(
        icon: Icons.calendar_today_rounded,
        title: 'No bookings yet',
        message: 'Your bookings will appear here.',
        actionLabel: 'Browse Services',
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.screenPadding),
      itemCount: bookings.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, index) {
              final booking = bookings[index];
              return GestureDetector(
                onTap: () => context.push('/booking-detail/${booking.id}'),
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.elevatedSurface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border, width: 0.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            booking.bookingNumber,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          FixHubStatusChip(
                            status: booking.statusType,
                            label: booking.displayStatus,
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.build_rounded,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Use service name from backend relation
                                Text(
                                  booking.subService?['name'] ?? 'Service',
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                const SizedBox(height: AppSpacing.xxs),
                                Text(
                                  DateFormat('MMM d, yyyy - hh:mm a')
                                      .format(booking.scheduledDate),
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
  }
}
