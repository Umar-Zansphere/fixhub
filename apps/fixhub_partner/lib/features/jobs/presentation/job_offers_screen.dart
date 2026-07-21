import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/config/theme/app_colors.dart';
import '../../../core/config/theme/app_spacing.dart';
import '../../../core/config/theme/app_radius.dart';
import '../../../core/widgets/fp_card.dart';
import '../../../core/widgets/fp_skeleton.dart';
import '../domain/job_offer_models.dart';
import 'offer_provider.dart';

class JobOffersScreen extends ConsumerStatefulWidget {
  const JobOffersScreen({super.key});

  @override
  ConsumerState<JobOffersScreen> createState() => _JobOffersScreenState();
}

class _JobOffersScreenState extends ConsumerState<JobOffersScreen> {
  @override
  Widget build(BuildContext context) {
    final offersAsync = ref.watch(offersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text(
          'Job Offers',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.textPrimary),
            onPressed: () => ref.read(offersProvider.notifier).refresh(),
          ),
        ],
      ),
      body: offersAsync.when(
        data: (offers) {
          if (offers.isEmpty) {
            return _EmptyOffersState();
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () => ref.read(offersProvider.notifier).refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              itemCount: offers.length,
              separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
              itemBuilder: (context, index) => _OfferCard(offer: offers[index]),
            ),
          );
        },
        loading: () => Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: Column(
            children: [
              const FpJobCardSkeleton(),
              const SizedBox(height: AppSpacing.md),
              const FpJobCardSkeleton(),
            ],
          ),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: AppSpacing.sm),
              const Text('Failed to load offers'),
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: () => ref.read(offersProvider.notifier).refresh(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyOffersState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(40),
            ),
            child: const Icon(Icons.inbox_rounded, size: 40, color: AppColors.textSecondary),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'No pending offers',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'New job offers will appear here.\nMake sure you are set to online.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}

class _OfferCard extends ConsumerStatefulWidget {
  const _OfferCard({required this.offer});
  final JobOffer offer;

  @override
  ConsumerState<_OfferCard> createState() => _OfferCardState();
}

class _OfferCardState extends ConsumerState<_OfferCard> {
  late Timer _countdownTimer;
  late Duration _remaining;
  bool _isActing = false;

  @override
  void initState() {
    super.initState();
    _remaining = widget.offer.timeRemaining;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() => _remaining = widget.offer.timeRemaining);
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer.cancel();
    super.dispose();
  }

  String get _countdownLabel {
    if (_remaining == Duration.zero) return 'Expired';
    final mins = _remaining.inMinutes.remainder(60).toString().padLeft(2, '0');
    final secs = _remaining.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  Color get _countdownColor {
    if (_remaining.inSeconds < 60) return AppColors.error;
    if (_remaining.inSeconds < 300) return AppColors.warning;
    return AppColors.success;
  }

  Future<void> _accept() async {
    setState(() => _isActing = true);
    try {
      await ref.read(offersProvider.notifier).accept(widget.offer.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Job accepted! Check your active jobs.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to accept: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isActing = false);
    }
  }

  Future<void> _reject() async {
    final reason = await _showRejectDialog();
    if (reason == null) return; // Cancelled

    setState(() => _isActing = true);
    try {
      await ref.read(offersProvider.notifier).reject(widget.offer.id, reason: reason);
    } finally {
      if (mounted) setState(() => _isActing = false);
    }
  }

  Future<String?> _showRejectDialog() {
    String reason = 'Not available at this time';
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        title: const Text('Decline Job Offer'),
        content: DropdownButtonFormField<String>(
          value: reason,
          decoration: const InputDecoration(labelText: 'Reason'),
          items: const [
            DropdownMenuItem(value: 'Not available at this time', child: Text('Not available')),
            DropdownMenuItem(value: 'Too far from my location', child: Text('Too far')),
            DropdownMenuItem(value: 'Outside my expertise', child: Text('Outside expertise')),
          ],
          onChanged: (v) => reason = v ?? reason,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, reason),
            child: const Text('Decline', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final offer = widget.offer;
    final booking = offer.booking;
    final moneyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return FpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: countdown + booking number
          Row(
            children: [
              Expanded(
                child: Text(
                  '#${booking.bookingNumber}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _countdownColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                  border: Border.all(color: _countdownColor.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.timer_rounded, size: 14, color: _countdownColor),
                    const SizedBox(width: 4),
                    Text(
                      _countdownLabel,
                      style: TextStyle(
                        color: _countdownColor,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.sm),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: AppSpacing.sm),

          // Service details
          _InfoRow(
            icon: Icons.build_rounded,
            label: booking.subService.name,
            sublabel: booking.subService.categoryName,
          ),
          const SizedBox(height: AppSpacing.xs),
          _InfoRow(
            icon: Icons.location_on_rounded,
            label: booking.address.shortAddress,
          ),
          const SizedBox(height: AppSpacing.xs),
          _InfoRow(
            icon: Icons.calendar_today_rounded,
            label: DateFormat('EEE, MMM d').format(booking.scheduledDate),
            sublabel: booking.scheduledSlot,
          ),

          const SizedBox(height: AppSpacing.sm),

          // Earnings highlight
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Row(
              children: [
                const Icon(Icons.currency_rupee, size: 18, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  'Estimated earnings: ',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                Text(
                  moneyFmt.format(booking.totalAmount),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.md),

          // Actions
          _isActing
              ? const Center(child: CircularProgressIndicator())
              : Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _remaining == Duration.zero ? null : _reject,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                        ),
                        child: const Text('Decline'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: _remaining == Duration.zero ? null : _accept,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.textOnPrimary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                        ),
                        child: const Text('Accept Job', style: TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, this.sublabel});
  final IconData icon;
  final String label;
  final String? sublabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodyMedium),
              if (sublabel != null)
                Text(
                  sublabel!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
