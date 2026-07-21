import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/widgets/fixhub_app_bar.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/router/route_names.dart';
import '../providers/booking_flow_provider.dart';
import '../providers/booking_provider.dart';
import '../../../location/presentation/providers/location_provider.dart';
import '../../data/models/time_slot_model.dart';
import '../../../../core/widgets/fixhub_empty_state.dart';

class SelectSlotScreen extends ConsumerStatefulWidget {
  const SelectSlotScreen({super.key});

  @override
  ConsumerState<SelectSlotScreen> createState() => _SelectSlotScreenState();
}

class _SelectSlotScreenState extends ConsumerState<SelectSlotScreen> {
  late DateTime _selectedDate;
  TimeSlotModel? _selectedSlot;
  late List<DateTime> _availableDates;

  // All possible slots (2-hour windows, 9am-7pm)
  static const List<_RawSlot> _allSlots = [
    _RawSlot(startHour: 9,  startMinute: 0,  label: '9:00 AM – 11:00 AM'),
    _RawSlot(startHour: 11, startMinute: 0,  label: '11:00 AM – 1:00 PM'),
    _RawSlot(startHour: 13, startMinute: 0,  label: '1:00 PM – 3:00 PM'),
    _RawSlot(startHour: 15, startMinute: 0,  label: '3:00 PM – 5:00 PM'),
    _RawSlot(startHour: 17, startMinute: 0,  label: '5:00 PM – 7:00 PM'),
  ];

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
    // Show next 30 days
    _availableDates = List.generate(
      30,
      (index) => DateTime.now().add(Duration(days: index)),
    );
  }

  List<TimeSlotModel> _getSlotsForDate(DateTime date) {
    final now = DateTime.now();
    final isToday = DateUtils.isSameDay(date, now);

    return _allSlots.map((raw) {
      final slotStart = DateTime(
        date.year,
        date.month,
        date.day,
        raw.startHour,
        raw.startMinute,
      );

      // Mark past slots (+ 1 hour buffer) as unavailable for today
      final isPast = isToday && slotStart.isBefore(now.add(const Duration(hours: 1)));

      return TimeSlotModel(
        date: date,
        startTime: raw.label.split('–').first.trim(),
        endTime: raw.label.split('–').last.trim(),
        isAvailable: !isPast,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(locationProvider);
    final bookingFlowState = ref.watch(bookingFlowProvider);
    final subServiceId = bookingFlowState.selectedService?.id;
    final pincode = locationState.currentPincode;
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    AsyncValue<List<String>> availableSlotsAsync = const AsyncValue.data([]);
    if (subServiceId != null && pincode != null) {
      availableSlotsAsync = ref.watch(availableSlotsProvider((
        subServiceId: subServiceId,
        pincode: pincode,
        date: dateStr,
      )));
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Choose a Time'),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Calendar Header ─────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.screenPadding,
              AppSpacing.md,
              AppSpacing.screenPadding,
              0,
            ),
            child: Row(
              children: [
                Text(
                  DateFormat('MMMM yyyy').format(_selectedDate),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // ── Horizontal Date Picker ───────────────────────────
          SizedBox(
            height: 84,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screenPadding,
              ),
              itemCount: _availableDates.length,
              itemBuilder: (context, index) {
                final date = _availableDates[index];
                final isSelected = DateUtils.isSameDay(date, _selectedDate);
                final isToday = DateUtils.isSameDay(date, DateTime.now());

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedDate = date;
                      _selectedSlot = null;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeInOut,
                    width: 60,
                    margin: const EdgeInsets.only(right: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.buttonPrimary
                          : AppColors.elevatedSurface,
                      borderRadius: AppRadius.cardRadius,
                      border: Border.all(
                        color: isSelected
                            ? AppColors.buttonPrimary
                            : AppColors.border,
                        width: 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          DateFormat('E').format(date),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: isSelected
                                ? Colors.white.withValues(alpha: 0.75)
                                : AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          DateFormat('d').format(date),
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: isSelected
                                ? Colors.white
                                : AppColors.textPrimary,
                          ),
                        ),
                        if (isToday) ...[
                          const SizedBox(height: 3),
                          Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.white
                                  : AppColors.buttonPrimary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: AppSpacing.xl),

          Expanded(
            child: availableSlotsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => FixHubEmptyState(
                icon: Icons.error_outline,
                title: 'Error loading slots',
                message: err.toString(),
              ),
              data: (backendAvailableSlots) {
                // Map local slots, check availability against backend list
                final slots = _allSlots.map((raw) {
                  final slot24h = '${raw.startHour.toString().padLeft(2, '0')}:00-${(raw.startHour + 2).toString().padLeft(2, '0')}:00';
                  return TimeSlotModel(
                    date: _selectedDate,
                    startTime: raw.label.split('–').first.trim(),
                    endTime: raw.label.split('–').last.trim(),
                    isAvailable: backendAvailableSlots.contains(slot24h),
                  );
                }).toList();

                final availableCount = slots.where((s) => s.isAvailable).length;

                return Column(
                  children: [
                    // ── Time Slots Section ───────────────────────────────
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.screenPadding,
                      ),
                      child: Row(
                        children: [
                          Text(
                            'Available Times',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.xs,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '$availableCount slots',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Expanded(
                      child: slots.isEmpty || availableCount == 0
                          ? FixHubEmptyState(
                              icon: Icons.event_busy_rounded,
                              title: 'No slots available',
                              message: 'No slots available for this date.',
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.screenPadding,
                              ),
                              itemCount: slots.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: AppSpacing.sm),
                              itemBuilder: (context, index) {
                                final slot = slots[index];
                                final isSelected = _selectedSlot == slot;
                                final isPast = !slot.isAvailable;

                                return _SlotTile(
                                  slot: slot,
                                  isSelected: isSelected,
                                  isPast: isPast,
                                  onTap: isPast
                                      ? null
                                      : () {
                                          setState(() {
                                            _selectedSlot = slot;
                                          });
                                        },
                                );
                              },
                            ),
                    ),
                  ],
                );
              },
            ),
          ),

          // ── CTA ─────────────────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_selectedSlot != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      margin: const EdgeInsets.only(bottom: AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: AppRadius.mediumRadius,
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.check_circle_rounded,
                              size: 18, color: AppColors.success),
                          const SizedBox(width: AppSpacing.xs),
                          Text(
                            'Selected: ${_selectedSlot!.formattedTime}',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                          ),
                          const Spacer(),
                          Text(
                            DateFormat('d MMM').format(_selectedDate),
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  FixHubButton(
                    label: 'Confirm & Continue',
                    onPressed: _selectedSlot != null
                        ? () {
                            ref
                                .read(bookingFlowProvider.notifier)
                                .setSlot(_selectedSlot!);
                            context.push(RouteNames.bookingSummary);
                          }
                        : null,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Slot Tile ────────────────────────────────────────────────────

class _SlotTile extends StatelessWidget {
  const _SlotTile({
    required this.slot,
    required this.isSelected,
    required this.isPast,
    this.onTap,
  });

  final TimeSlotModel slot;
  final bool isSelected;
  final bool isPast;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        height: 64,
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.buttonPrimary
              : isPast
                  ? AppColors.surface
                  : AppColors.elevatedSurface,
          borderRadius: AppRadius.mediumRadius,
          border: Border.all(
            color: isSelected ? AppColors.buttonPrimary : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          child: Row(
            children: [
              Icon(
                isPast
                    ? Icons.block_rounded
                    : isSelected
                        ? Icons.check_circle_rounded
                        : Icons.schedule_rounded,
                size: 20,
                color: isSelected
                    ? Colors.white
                    : isPast
                        ? AppColors.textDisabled
                        : AppColors.textSecondary,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  slot.formattedTime,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight:
                        isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected
                        ? Colors.white
                        : isPast
                            ? AppColors.textDisabled
                            : AppColors.textPrimary,
                  ),
                ),
              ),
              if (isPast)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xs,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    'Unavailable',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.textDisabled,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                )
              else if (isSelected)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xs,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Selected',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                )
              else
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: AppColors.textSecondary,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Internal raw slot data ────────────────────────────────────────

class _RawSlot {
  const _RawSlot({
    required this.startHour,
    required this.startMinute,
    required this.label,
  });

  final int startHour;
  final int startMinute;
  final String label;
}
