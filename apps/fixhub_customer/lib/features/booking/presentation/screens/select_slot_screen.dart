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
import '../../data/models/time_slot_model.dart';

class SelectSlotScreen extends ConsumerStatefulWidget {
  const SelectSlotScreen({super.key});

  @override
  ConsumerState<SelectSlotScreen> createState() => _SelectSlotScreenState();
}

class _SelectSlotScreenState extends ConsumerState<SelectSlotScreen> {
  late DateTime _selectedDate;
  TimeSlotModel? _selectedSlot;
  late List<DateTime> _availableDates;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
    _availableDates = List.generate(
      7,
      (index) => DateTime.now().add(Duration(days: index)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final slots = TimeSlotModel.getMockSlots(_selectedDate);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Select Time Slot'),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Date Selector
          Padding(
            padding: const EdgeInsets.all(AppSpacing.screenPadding),
            child: Text(
              'Select Date',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ),
          SizedBox(
            height: 90,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screenPadding,
              ),
              itemCount: _availableDates.length,
              separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
              itemBuilder: (context, index) {
                final date = _availableDates[index];
                final isSelected = DateUtils.isSameDay(date, _selectedDate);

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedDate = date;
                      _selectedSlot = null; // reset slot when date changes
                    });
                  },
                  child: Container(
                    width: 72,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.buttonPrimary
                          : AppColors.elevatedSurface,
                      borderRadius: AppRadius.cardRadius,
                      border: Border.all(
                        color: isSelected
                            ? AppColors.buttonPrimary
                            : AppColors.border,
                        width: 0.5,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          DateFormat('MMM').format(date),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: isSelected
                                    ? AppColors.textLight.withValues(alpha: 0.8)
                                    : AppColors.textSecondary,
                              ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          DateFormat('d').format(date),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: isSelected
                                    ? AppColors.textLight
                                    : AppColors.textPrimary,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          DateFormat('E').format(date),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: isSelected
                                    ? AppColors.textLight.withValues(alpha: 0.8)
                                    : AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // Time Slots
          Padding(
            padding: const EdgeInsets.all(AppSpacing.screenPadding),
            child: Text(
              'Select Time',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screenPadding,
              ),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 2.5,
                crossAxisSpacing: AppSpacing.md,
                mainAxisSpacing: AppSpacing.md,
              ),
              itemCount: slots.length,
              itemBuilder: (context, index) {
                final slot = slots[index];
                final isSelected = _selectedSlot == slot;

                return GestureDetector(
                  onTap: slot.isAvailable
                      ? () {
                          setState(() {
                            _selectedSlot = slot;
                          });
                        }
                      : null,
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.surface
                          : AppColors.elevatedSurface,
                      borderRadius: AppRadius.buttonRadius,
                      border: Border.all(
                        color: isSelected
                            ? AppColors.buttonPrimary
                            : AppColors.border,
                        width: isSelected ? 1.5 : 0.5,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        slot.formattedTime,
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: slot.isAvailable
                                  ? AppColors.textPrimary
                                  : AppColors.textDisabled,
                              fontWeight: isSelected ? FontWeight.bold : null,
                            ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              child: FixHubButton(
                label: 'Continue to Summary',
                onPressed: _selectedSlot != null
                    ? () {
                        ref
                            .read(bookingFlowProvider.notifier)
                            .setSlot(_selectedSlot!);
                        context.push(RouteNames.bookingSummary);
                      }
                    : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
