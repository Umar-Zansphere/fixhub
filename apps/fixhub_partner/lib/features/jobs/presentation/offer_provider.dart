import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/offer_repository.dart';
import '../domain/job_offer_models.dart';

// ── Offers list (refreshed every 60 s while screen is active) ────
final offersProvider =
    AsyncNotifierProvider<OffersNotifier, List<JobOffer>>(OffersNotifier.new);

class OffersNotifier extends AsyncNotifier<List<JobOffer>> {
  late final OfferRepository _repo;
  Timer? _pollTimer;

  @override
  FutureOr<List<JobOffer>> build() async {
    _repo = ref.watch(offerRepositoryProvider);
    // Poll every 60 s automatically
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 60), (_) => _refresh());
    ref.onDispose(() => _pollTimer?.cancel());
    return _repo.listOffers();
  }

  Future<void> refresh() => _refresh();

  Future<void> _refresh() async {
    state = await AsyncValue.guard(() => _repo.listOffers());
  }

  Future<void> accept(String offerId) async {
    await _repo.acceptOffer(offerId);
    await _refresh();
  }

  Future<void> reject(String offerId, {String? reason}) async {
    await _repo.rejectOffer(offerId, reason: reason);
    await _refresh();
  }
}

// ── Badge count ──────────────────────────────────────────────────
final offerCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final repo = ref.watch(offerRepositoryProvider);
  return repo.countPendingOffers();
});
