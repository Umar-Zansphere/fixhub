import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/notification_repository.dart';

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(NotificationsNotifier.new);

class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  late final NotificationRepository _repository;

  @override
  FutureOr<List<AppNotification>> build() async {
    _repository = ref.watch(notificationRepositoryProvider);
    return _repository.listNotifications();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.listNotifications());
  }

  Future<void> markAsRead(String id) async {
    await _repository.markAsRead(id);
    state = state.whenData((list) => list.map((n) {
          if (n.id == id) {
            return AppNotification(
              id: n.id, title: n.title, body: n.body, type: n.type,
              isRead: true, createdAt: n.createdAt, data: n.data,
            );
          }
          return n;
        }).toList());
  }

  Future<void> markAllAsRead() async {
    await _repository.markAllAsRead();
    state = state.whenData((list) => list
        .map((n) => AppNotification(
              id: n.id, title: n.title, body: n.body, type: n.type,
              isRead: true, createdAt: n.createdAt, data: n.data,
            ))
        .toList());
  }
}

final unreadCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider);
  return notifications.value?.where((n) => !n.isRead).length ?? 0;
});
