import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/config/theme/app_colors.dart';
import '../../../core/config/theme/app_spacing.dart';
import '../../../core/config/theme/app_radius.dart';
import '../../../core/widgets/fp_app_bar.dart';
import '../../../core/widgets/fp_button.dart';
import '../../../core/widgets/fp_card.dart';
import '../../../core/widgets/fp_skeleton.dart';
import '../../../core/widgets/fp_offline_banner.dart';
import '../../../core/widgets/fp_status_chip.dart';
import '../domain/job_models.dart';
import 'job_provider.dart';

class JobDetailsScreen extends ConsumerWidget {
  final String jobId;

  const JobDetailsScreen({super.key, required this.jobId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobAsync = ref.watch(jobDetailsProvider(jobId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: FpSurfaceAppBar(title: 'Job Details'),
      body: jobAsync.when(
        loading: () => const Center(child: FpPageLoader()),
        error: (e, _) => FpErrorState(
          message: 'Could not load job details',
          onRetry: () => ref.invalidate(jobDetailsProvider(jobId)),
        ),
        data: (job) => _JobDetailsBody(job: job),
      ),
    );
  }
}

class _JobDetailsBody extends ConsumerStatefulWidget {
  final Job job;

  const _JobDetailsBody({required this.job});

  @override
  ConsumerState<_JobDetailsBody> createState() => _JobDetailsBodyState();
}

class _JobDetailsBodyState extends ConsumerState<_JobDetailsBody> {
  bool _isUpdating = false;

  String get _nextStatus {
    return switch (widget.job.status) {
      'ASSIGNED' => 'ACCEPTED',
      'ACCEPTED' => 'EN_ROUTE',
      'EN_ROUTE' => 'ARRIVED',
      'ARRIVED' => 'IN_PROGRESS',
      'IN_PROGRESS' => 'COMPLETED',
      _ => '',
    };
  }

  String get _nextStatusLabel {
    return switch (widget.job.status) {
      'ASSIGNED' => 'Accept Job',
      'ACCEPTED' => '🗺 Start En Route',
      'EN_ROUTE' => '📍 Mark Arrived',
      'ARRIVED' => '🔧 Start Work',
      'IN_PROGRESS' => '✅ Complete Job',
      _ => '',
    };
  }

  Future<void> _updateStatus() async {
    setState(() => _isUpdating = true);
    try {
      await ref
          .read(activeJobProvider.notifier)
          .updateStatus(widget.job.id, _nextStatus);
      if (mounted && _nextStatus == 'COMPLETED') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Job completed successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      } else if (mounted) {
        ref.invalidate(jobDetailsProvider(widget.job.id));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated to $_nextStatus')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update status. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  Future<void> _callCustomer() async {
    final phone = widget.job.customer.phone;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) launchUrl(uri);
  }

  Future<void> _openMaps() async {
    final lat = widget.job.address.latitude;
    final lng = widget.job.address.longitude;
    if (lat == null || lng == null) return;
    final uri = Uri.parse('https://maps.google.com/?q=$lat,$lng');
    if (await canLaunchUrl(uri)) launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    final job = widget.job;
    final hasAction = _nextStatus.isNotEmpty;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.screenPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header ───────────────────────────────────────
                FpCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  job.bookingNumber,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(letterSpacing: 0.5),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  job.subService.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineSmall
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                if (job.subService.categoryName != null)
                                  Text(
                                    job.subService.categoryName!,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodyMedium,
                                  ),
                              ],
                            ),
                          ),
                          FpStatusChip(
                            status: FpStatusChip.fromString(job.status),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      const Divider(color: AppColors.divider, height: 1),
                      const SizedBox(height: AppSpacing.md),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            '₹${job.totalAmount.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.base),

                // ── Schedule ─────────────────────────────────────
                _Section(
                  title: 'Schedule',
                  child: Column(
                    children: [
                      _DetailRow(
                        icon: Icons.calendar_today_outlined,
                        label: 'Date',
                        value: DateFormat(
                          'EEEE, d MMMM yyyy',
                        ).format(job.scheduledDate),
                      ),
                      _DetailRow(
                        icon: Icons.access_time_rounded,
                        label: 'Time Slot',
                        value: job.scheduledSlot,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.base),

                // ── Customer ─────────────────────────────────────
                _Section(
                  title: 'Customer',
                  trailing: IconButton(
                    onPressed: _callCustomer,
                    icon: const Icon(
                      Icons.call_rounded,
                      size: 20,
                      color: AppColors.primary,
                    ),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.primaryContainer,
                      padding: const EdgeInsets.all(8),
                    ),
                  ),
                  child: Column(
                    children: [
                      _DetailRow(
                        icon: Icons.person_outline_rounded,
                        label: 'Name',
                        value: job.customer.displayName,
                      ),
                      _DetailRow(
                        icon: Icons.phone_outlined,
                        label: 'Phone',
                        value: job.customer.phone,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.base),

                // ── Address ──────────────────────────────────────
                _Section(
                  title: 'Service Location',
                  trailing: job.address.latitude != null
                      ? IconButton(
                          onPressed: _openMaps,
                          icon: const Icon(
                            Icons.directions_rounded,
                            size: 20,
                            color: AppColors.primary,
                          ),
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.primaryContainer,
                            padding: const EdgeInsets.all(8),
                          ),
                        )
                      : null,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(
                        icon: Icons.location_on_outlined,
                        label: 'Address',
                        value: job.address.fullAddress,
                      ),
                      if (job.address.landmark != null)
                        _DetailRow(
                          icon: Icons.place_outlined,
                          label: 'Landmark',
                          value: job.address.landmark!,
                        ),
                    ],
                  ),
                ),

                if (job.description != null && job.description!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.base),
                  _Section(
                    title: 'Customer Note',
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.xs,
                      ),
                      child: Text(
                        job.description!,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: AppSpacing.base),

                // ── Timeline ─────────────────────────────────────
                if (job.timeline.isNotEmpty) ...[
                  _Section(
                    title: 'Timeline',
                    child: Column(
                      children: job.timeline
                          .map((e) => _TimelineRow(entry: e))
                          .toList(),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.base),
                ],

                const SizedBox(height: 80),
              ],
            ),
          ),
        ),

        // ── Action Button ─────────────────────────────────────────
        if (hasAction)
          Container(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.screenPadding,
              AppSpacing.md,
              AppSpacing.screenPadding,
              AppSpacing.bottomSafePad,
            ),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: FpButton(
              label: _nextStatusLabel,
              isLoading: _isUpdating,
              onPressed: _updateStatus,
            ),
          ),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  final Widget? trailing;

  const _Section({required this.title, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) {
    return FpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          child,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.textSecondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  final JobTimelineEntry entry;

  const _TimelineRow({required this.entry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 8,
            height: 8,
            margin: const EdgeInsets.only(top: 4, right: 12),
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.status.replaceAll('_', ' '),
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                Text(
                  DateFormat('d MMM, h:mm a').format(entry.createdAt.toLocal()),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
