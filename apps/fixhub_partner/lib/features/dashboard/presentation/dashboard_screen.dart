import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/config/theme/app_colors.dart';
import '../../../core/config/theme/app_spacing.dart';
import '../../../core/config/theme/app_radius.dart';
import '../../../core/widgets/fp_card.dart';
import '../../../core/widgets/fp_status_chip.dart';
import '../../../core/widgets/fp_availability_toggle.dart';
import '../../../core/widgets/fp_skeleton.dart';
import '../../../core/widgets/fp_offline_banner.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../auth/domain/auth_state.dart';
import '../../profile/presentation/profile_provider.dart';
import '../../jobs/presentation/job_provider.dart';
import '../../jobs/domain/job_models.dart';
import '../../earnings/presentation/earnings_provider.dart';
import '../../notifications/presentation/notification_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _isTogglingAvailability = false;

  Future<void> _toggleAvailability(bool value) async {
    setState(() => _isTogglingAvailability = true);
    try {
      await ref.read(profileProvider.notifier).toggleAvailability(value);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              value
                  ? 'Could not go online. Are you verified?'
                  : 'Could not go offline.',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isTogglingAvailability = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final profileAsync = ref.watch(profileProvider);
    final currentJobAsync = ref.watch(currentJobProvider);
    final todayEarningsAsync = ref.watch(todayEarningsProvider);
    final unreadCount = ref.watch(unreadCountProvider);

    final user = authState is AuthAuthenticated ? authState.user : null;
    final profile = profileAsync.value;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(currentJobProvider);
            ref.invalidate(todayEarningsProvider);
            ref.read(profileProvider.notifier).load();
          },
          child: CustomScrollView(
            slivers: [
              // ── App Bar ──────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.screenPadding,
                    AppSpacing.base,
                    AppSpacing.screenPadding,
                    0,
                  ),
                  child: Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _greeting(),
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.displayName ?? 'Technician',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      const Spacer(),
                      // Notifications
                      Stack(
                        children: [
                          IconButton(
                            onPressed: () => context.push('/notifications'),
                            icon: const Icon(
                              Icons.notifications_outlined,
                              size: 24,
                            ),
                            style: IconButton.styleFrom(
                              backgroundColor: AppColors.surface,
                              foregroundColor: AppColors.textPrimary,
                              padding: const EdgeInsets.all(10),
                              shape: const CircleBorder(
                                side: BorderSide(color: AppColors.border),
                              ),
                            ),
                          ),
                          if (unreadCount > 0)
                            Positioned(
                              right: 8,
                              top: 8,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.error,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              SliverPadding(
                padding: const EdgeInsets.all(AppSpacing.screenPadding),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ── Availability Toggle ───────────────────────
                    FpAvailabilityToggle(
                      isAvailable: profile?.isAvailable ?? false,
                      isLoading:
                          _isTogglingAvailability || profileAsync.isLoading,
                      onChanged: _toggleAvailability,
                    ),

                    const SizedBox(height: AppSpacing.xl),

                    // ── Today's Overview ──────────────────────────
                    Text(
                      'Today\'s Overview',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        Expanded(
                          child: todayEarningsAsync.when(
                            loading: () => const FpSkeleton(height: 96),
                            error: (_, __) => _StatCard(
                              label: 'Earnings',
                              value: '₹0',
                              icon: Icons.currency_rupee_rounded,
                              color: AppColors.success,
                            ),
                            data: (e) => _StatCard(
                              label: 'Earnings',
                              value: '₹${_fmt(e.totalEarnings)}',
                              icon: Icons.currency_rupee_rounded,
                              color: AppColors.success,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: todayEarningsAsync.when(
                            loading: () => const FpSkeleton(height: 96),
                            error: (_, __) => _StatCard(
                              label: 'Completed',
                              value: '0 jobs',
                              icon: Icons.check_circle_outline_rounded,
                              color: AppColors.primary,
                            ),
                            data: (e) => _StatCard(
                              label: 'Completed',
                              value:
                                  '${e.completedJobs} job${e.completedJobs == 1 ? '' : 's'}',
                              icon: Icons.check_circle_outline_rounded,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: AppSpacing.xl),

                    // ── Current / Active Job ──────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Active Job',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        TextButton(
                          onPressed: () => context.go('/jobs'),
                          child: const Text('View All'),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    currentJobAsync.when(
                      loading: () => const FpJobCardSkeleton(),
                      error: (e, _) => FpCard(
                        child: Center(
                          child: Text(
                            'Could not load jobs',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                      ),
                      data: (job) => job == null
                          ? _NoActiveJobCard()
                          : _ActiveJobCard(job: job),
                    ),

                    const SizedBox(height: AppSpacing.xl),

                    // ── Quick Actions ─────────────────────────────
                    Text(
                      'Quick Actions',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        _QuickAction(
                          icon: Icons.work_history_rounded,
                          label: 'My Jobs',
                          onTap: () => context.go('/jobs'),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        _QuickAction(
                          icon: Icons.account_balance_wallet_outlined,
                          label: 'Earnings',
                          onTap: () => context.go('/earnings'),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        _QuickAction(
                          icon: Icons.folder_outlined,
                          label: 'Documents',
                          onTap: () => context.push('/documents'),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        _QuickAction(
                          icon: Icons.support_agent_outlined,
                          label: 'Support',
                          onTap: () => context.push('/settings'),
                        ),
                      ],
                    ),

                    const SizedBox(height: AppSpacing.xxxl),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  String _fmt(double val) {
    if (val >= 1000) {
      return NumberFormat('#,##0', 'en_IN').format(val);
    }
    return val.toStringAsFixed(0);
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return FpCard(
      padding: const EdgeInsets.all(AppSpacing.base),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _ActiveJobCard extends StatelessWidget {
  final Job job;

  const _ActiveJobCard({required this.job});

  @override
  Widget build(BuildContext context) {
    return FpCard(
      onTap: () => context.push('/job-details/${job.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      job.bookingNumber,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontFamily: 'monospace',
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      job.subService.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              FpStatusChip(status: FpStatusChip.fromString(job.status)),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(height: 1, color: AppColors.divider),
          const SizedBox(height: AppSpacing.md),
          _InfoRow(
            icon: Icons.person_outline_rounded,
            text: job.customer.displayName,
          ),
          const SizedBox(height: AppSpacing.sm),
          _InfoRow(
            icon: Icons.location_on_outlined,
            text: job.address.fullAddress,
          ),
          const SizedBox(height: AppSpacing.sm),
          _InfoRow(
            icon: Icons.schedule_rounded,
            text: '${_formatDate(job.scheduledDate)} · ${job.scheduledSlot}',
          ),
          const SizedBox(height: AppSpacing.base),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '₹${job.totalAmount.toStringAsFixed(0)}',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              TextButton.icon(
                onPressed: () => context.push('/job-details/${job.id}'),
                icon: const Text('View Details'),
                label: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return DateFormat('EEE, d MMM').format(date);
  }
}

class _NoActiveJobCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FpCard(
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.base),
          Container(
            padding: const EdgeInsets.all(AppSpacing.base),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.inbox_outlined,
              size: 32,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'No Active Job',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Go online to receive job requests',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.base),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, size: 22, color: AppColors.primary),
              const SizedBox(height: AppSpacing.xs),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
