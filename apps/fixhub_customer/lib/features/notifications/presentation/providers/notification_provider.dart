import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/notification_remote_datasource.dart';
import '../../data/models/notification_model.dart';
import '../../../../core/network/dio_client.dart';

final notificationRemoteDataSourceProvider = Provider<NotificationRemoteDataSource>((ref) {
  final dio = ref.watch(dioProvider);
  return NotificationRemoteDataSource(dio);
});

final notificationsProvider = FutureProvider<List<NotificationModel>>((ref) async {
  final dataSource = ref.watch(notificationRemoteDataSourceProvider);
  final data = await dataSource.getNotifications();
  return data.map((json) => NotificationModel.fromJson(json)).toList();
});

class NotificationNotifier extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() {
    return const AsyncValue.data(null);
  }

  Future<void> markAsRead(String id) async {
    state = const AsyncValue.loading();
    try {
      final dataSource = ref.read(notificationRemoteDataSourceProvider);
      await dataSource.markAsRead(id);
      ref.invalidate(notificationsProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markAllAsRead() async {
    state = const AsyncValue.loading();
    try {
      final dataSource = ref.read(notificationRemoteDataSourceProvider);
      await dataSource.markAllAsRead();
      ref.invalidate(notificationsProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final notificationNotifierProvider = NotifierProvider<NotificationNotifier, AsyncValue<void>>(() {
  return NotificationNotifier();
});
