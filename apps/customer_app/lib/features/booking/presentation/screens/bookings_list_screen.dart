import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_empty_state.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';

/// Bookings list screen — shows all user bookings with status filters.
class BookingsListScreen extends ConsumerWidget {
  const BookingsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
      ),
      body: const FixHubEmptyState(
        icon: Icons.calendar_today_rounded,
        title: 'No bookings yet',
        message: 'Your bookings will appear here once you book a service.',
        actionLabel: 'Browse Services',
      ),
    );
  }
}
