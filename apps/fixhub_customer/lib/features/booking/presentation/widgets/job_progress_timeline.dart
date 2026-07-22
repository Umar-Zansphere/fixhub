import 'package:flutter/material.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';
import '../../data/models/booking_timeline_model.dart';
import '../../data/models/booking_model.dart';
import 'package:intl/intl.dart';

class JobProgressTimeline extends StatelessWidget {
  const JobProgressTimeline({
    super.key,
    required this.booking,
  });

  final BookingModel booking;

  @override
  Widget build(BuildContext context) {
    // Determine which steps are completed based on status
    final currentStatus = booking.statusType;
    
    // Status hierarchy logic
    final isArrived = [
      BookingStatusType.arrived,
      BookingStatusType.inProgress,
      BookingStatusType.completed
    ].contains(currentStatus);
    
    final isInProgress = [
      BookingStatusType.inProgress,
      BookingStatusType.completed
    ].contains(currentStatus);
    
    // "Testing" is not an official state in our BookingModel enum, but IN_PROGRESS covers it. 
    // If the booking is completed, we consider it done.
    final isCompleted = currentStatus == BookingStatusType.completed;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Job Progress',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: AppSpacing.md),
        _buildTimelineNode(
          context,
          title: 'Arrived',
          isCompleted: isArrived,
          isActive: currentStatus == BookingStatusType.arrived,
          time: _getEventTime('ARRIVED'),
          isLast: false,
        ),
        _buildTimelineNode(
          context,
          title: 'In Progress',
          isCompleted: isInProgress,
          isActive: currentStatus == BookingStatusType.inProgress && !isCompleted,
          time: _getEventTime('IN_PROGRESS'),
          isLast: false,
        ),
        _buildTimelineNode(
          context,
          title: 'Testing',
          isCompleted: isCompleted,
          isActive: false, // Testing is implicit in completed step for now
          time: null,
          isLast: false,
        ),
        _buildTimelineNode(
          context,
          title: 'Completed',
          isCompleted: isCompleted,
          isActive: currentStatus == BookingStatusType.completed,
          time: _getEventTime('COMPLETED'),
          isLast: true,
        ),
      ],
    );
  }

  String? _getEventTime(String status) {
    final event = booking.timeline.where((e) => e.status == status).firstOrNull;
    if (event != null) {
      return DateFormat('hh:mm a').format(event.createdAt);
    }
    return null;
  }

  Widget _buildTimelineNode(
    BuildContext context, {
    required String title,
    required bool isCompleted,
    required bool isActive,
    required String? time,
    required bool isLast,
  }) {
    final primaryColor = AppColors.success;
    final inactiveColor = AppColors.textSecondary.withOpacity(0.3);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Node icon + line
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: isCompleted ? primaryColor : AppColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isCompleted ? primaryColor : inactiveColor,
                      width: 2,
                    ),
                  ),
                  child: isCompleted
                      ? const Icon(Icons.check, color: AppColors.surface, size: 16)
                      : (isActive
                          ? Center(
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: AppColors.buttonPrimary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            )
                          : const Icon(Icons.remove, color: AppColors.textSecondary, size: 16)),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isCompleted ? primaryColor : inactiveColor,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xl),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: isActive || isCompleted ? FontWeight.bold : FontWeight.normal,
                          color: isCompleted
                              ? AppColors.textPrimary
                              : (isActive ? AppColors.textPrimary : AppColors.textSecondary),
                        ),
                  ),
                  Text(
                    time ?? (isActive ? 'In Progress' : 'Pending'),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
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
