import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/job_repository.dart';
import '../domain/job_models.dart';

// ── Current active job ───────────────────────────────────────────
final currentJobProvider = FutureProvider<Job?>((ref) async {
  return ref.read(jobRepositoryProvider).getCurrentJob();
});

// ── Upcoming jobs (ACCEPTED + EN_ROUTE statuses) ─────────────────
final upcomingJobsProvider = FutureProvider<PaginatedJobs>((ref) async {
  return ref.read(jobRepositoryProvider).listJobs(
    status: 'ACCEPTED',
    limit: 10,
  );
});

// ── My jobs (all statuses, paginated) ────────────────────────────
final myJobsProvider = FutureProvider.family<PaginatedJobs, String?>((ref, status) async {
  return ref.read(jobRepositoryProvider).listJobs(status: status);
});

// ── Job history ──────────────────────────────────────────────────
final jobHistoryProvider = FutureProvider<PaginatedJobs>((ref) async {
  return ref.read(jobRepositoryProvider).listJobHistory();
});

// ── Job details ──────────────────────────────────────────────────
final jobDetailsProvider = FutureProvider.family<Job, String>((ref, id) async {
  return ref.read(jobRepositoryProvider).getJobDetails(id);
});

// ── Active job status controller ─────────────────────────────────
final activeJobProvider =
    AsyncNotifierProvider<ActiveJobNotifier, Job?>(ActiveJobNotifier.new);

class ActiveJobNotifier extends AsyncNotifier<Job?> {
  late final JobRepository _repository;

  @override
  FutureOr<Job?> build() async {
    _repository = ref.watch(jobRepositoryProvider);
    return _repository.getCurrentJob();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.getCurrentJob());
  }

  Future<Job?> acceptJob(String id) async {
    state = const AsyncValue.loading();
    final job = await _repository.acceptJob(id);
    state = AsyncValue.data(job);
    return job;
  }

  Future<void> rejectJob(String id, String reason) async {
    await _repository.rejectJob(id, reason);
    await refresh();
  }

  Future<Job?> updateStatus(
    String id,
    String status, {
    String? note,
    double? latitude,
    double? longitude,
  }) async {
    state = const AsyncValue.loading();
    final job = await _repository.updateJobStatus(
      id,
      status,
      note: note,
      latitude: latitude,
      longitude: longitude,
    );
    state = AsyncValue.data(job);
    return job;
  }
}
