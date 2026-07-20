import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/earnings_repository.dart';

enum EarningsPeriod { thisWeek, lastWeek, thisMonth, custom }

class EarningsState {
  final EarningsPeriod period;
  final EarningsSummary? summary;
  final List<EarningsTransaction> transactions;
  final bool isLoading;
  final String? error;

  const EarningsState({
    this.period = EarningsPeriod.thisWeek,
    this.summary,
    this.transactions = const [],
    this.isLoading = true,
    this.error,
  });

  EarningsState copyWith({
    EarningsPeriod? period,
    EarningsSummary? summary,
    List<EarningsTransaction>? transactions,
    bool? isLoading,
    String? error,
  }) =>
      EarningsState(
        period: period ?? this.period,
        summary: summary ?? this.summary,
        transactions: transactions ?? this.transactions,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

final earningsProvider = NotifierProvider<EarningsNotifier, EarningsState>(EarningsNotifier.new);

class EarningsNotifier extends Notifier<EarningsState> {
  late final EarningsRepository _repository;

  @override
  EarningsState build() {
    _repository = ref.watch(earningsRepositoryProvider);
    // Initialize loading first
    Future.microtask(() => load(EarningsPeriod.thisWeek));
    return const EarningsState();
  }

  Future<void> load(EarningsPeriod period) async {
    state = state.copyWith(isLoading: true, period: period, error: null);

    final (dateFrom, dateTo) = _getDates(period);
    try {
      final summary = await _repository.getSummary(dateFrom: dateFrom, dateTo: dateTo);
      final transactions = await _repository.getHistory(dateFrom: dateFrom, dateTo: dateTo);
      state = state.copyWith(
        summary: summary,
        transactions: transactions,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  (String?, String?) _getDates(EarningsPeriod period) {
    final now = DateTime.now();
    switch (period) {
      case EarningsPeriod.thisWeek:
        final monday = now.subtract(Duration(days: now.weekday - 1));
        return (_fmt(monday), _fmt(now));
      case EarningsPeriod.lastWeek:
        final lastMonday = now.subtract(Duration(days: now.weekday + 6));
        final lastSunday = now.subtract(Duration(days: now.weekday));
        return (_fmt(lastMonday), _fmt(lastSunday));
      case EarningsPeriod.thisMonth:
        return (_fmt(DateTime(now.year, now.month, 1)), _fmt(now));
      case EarningsPeriod.custom:
        return (null, null);
    }
  }

  String _fmt(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

// Quick today earnings for dashboard
final todayEarningsProvider = FutureProvider<EarningsSummary>((ref) async {
  final today = DateTime.now();
  final fmt = (DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  return ref.read(earningsRepositoryProvider).getSummary(
    dateFrom: fmt(today),
    dateTo: fmt(today),
  );
});
