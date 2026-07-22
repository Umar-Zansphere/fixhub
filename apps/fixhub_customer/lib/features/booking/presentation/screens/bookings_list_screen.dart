import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_images.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_shimmer.dart';
import '../../../../core/widgets/fixhub_error_state.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';
import '../providers/booking_provider.dart';

/// Bookings list screen — Active and History tabs with rich booking cards.
class BookingsListScreen extends ConsumerStatefulWidget {
  const BookingsListScreen({super.key});

  @override
  ConsumerState<BookingsListScreen> createState() => _BookingsListScreenState();
}

class _BookingsListScreenState extends ConsumerState<BookingsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            margin: const EdgeInsets.fromLTRB(
                AppSpacing.screenPadding, 0, AppSpacing.screenPadding, 8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              controller: _tabController,
              labelColor: AppColors.textPrimary,
              unselectedLabelColor: AppColors.textSecondary,
              indicator: BoxDecoration(
                color: AppColors.elevatedSurface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border, width: 0.5),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
              tabs: const [
                Tab(text: 'Active'),
                Tab(text: 'History'),
              ],
            ),
          ),
        ),
      ),
      body: bookingsAsync.when(
        data: (bookings) {
          final activeStatuses = {
            BookingStatusType.pending,
            BookingStatusType.confirmed,
            BookingStatusType.assigned,
            BookingStatusType.enRoute,
            BookingStatusType.arrived,
            BookingStatusType.inProgress,
          };
          final activeBookings = bookings
              .where((b) => activeStatuses.contains(b.statusType))
              .toList();
          final historyBookings = bookings
              .where((b) =>
                  b.statusType == BookingStatusType.completed ||
                  b.statusType == BookingStatusType.cancelled ||
                  b.statusType == BookingStatusType.failed)
              .toList();

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
                _BookingsList(bookings: activeBookings, isActive: true),
                _BookingsList(bookings: historyBookings, isActive: false),
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
}

class _BookingsList extends StatelessWidget {
  const _BookingsList({required this.bookings, required this.isActive});

  final List<dynamic> bookings;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return _EmptyBookingsState(isActive: isActive);
    }

    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.screenPadding),
      itemCount: bookings.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (context, index) {
        final booking = bookings[index];
        return _BookingCard(booking: booking);
      },
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.booking});

  final dynamic booking;

  @override
  Widget build(BuildContext context) {
    final serviceName = booking.subService?['name'] as String? ?? 'Service';
    final iconConfig = _iconForService(serviceName);

    return GestureDetector(
      onTap: () => context.push('/booking-detail/${booking.id}'),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.elevatedSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border, width: 0.5),
          boxShadow: [
            BoxShadow(
              color: AppColors.textPrimary.withValues(alpha: 0.03),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: booking number + status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.receipt_long_rounded,
                      size: 14,
                      color: AppColors.textDisabled,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      booking.bookingNumber,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
                FixHubStatusChip(
                  status: booking.statusType,
                  label: booking.displayStatus,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // Service info row
            Row(
              children: [
                // Service icon
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: iconConfig.$3,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    iconConfig.$1,
                    color: iconConfig.$2,
                    size: 24,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        serviceName,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today_rounded,
                            size: 13,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            DateFormat('MMM d, yyyy · hh:mm a')
                                .format(booking.scheduledDate),
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.textDisabled,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  (IconData, Color, Color) _iconForService(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('electric') || lower.contains('wiring')) {
      return (Icons.bolt_rounded, const Color(0xFFF59E0B), const Color(0xFFFFF8E1));
    } else if (lower.contains('ac') || lower.contains('air')) {
      return (Icons.ac_unit_rounded, const Color(0xFF2196F3), const Color(0xFFE3F2FD));
    } else if (lower.contains('fan')) {
      return (Icons.air_rounded, const Color(0xFF3F51B5), const Color(0xFFE8EAF6));
    } else if (lower.contains('plumb') || lower.contains('pipe')) {
      return (Icons.plumbing_rounded, const Color(0xFF4CAF50), const Color(0xFFE8F5E9));
    } else if (lower.contains('clean')) {
      return (Icons.cleaning_services_rounded, const Color(0xFF9C27B0), const Color(0xFFF3E5F5));
    }
    return (Icons.home_repair_service_rounded, AppColors.textSecondary, AppColors.surface);
  }
}

class _EmptyBookingsState extends StatelessWidget {
  const _EmptyBookingsState({required this.isActive});

  final bool isActive;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.screenPadding),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Illustration
            Image.asset(
              AppImages.emptyBookings,
              width: 180,
              height: 180,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.calendar_today_rounded,
                size: 64,
                color: AppColors.textDisabled,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              isActive ? 'No active bookings' : 'No booking history',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              isActive
                  ? 'Your active service bookings will appear here.'
                  : 'Completed and cancelled bookings will appear here.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
