import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../firebase_options.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('Handling a background message: ${message.messageId}');
}

final fcmServiceProvider = Provider<FCMService>((ref) {
  return FCMService(ref);
});

class FCMService {
  final Ref _ref;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  FCMService(this._ref);

  Future<void> initialize() async {
    try {
      FirebaseMessaging.onBackgroundMessage(
          _firebaseMessagingBackgroundHandler);

      // Timeout permission request — can hang if Play Services is broken
      final NotificationSettings settings = await _messaging
          .requestPermission(
            alert: true,
            badge: true,
            sound: true,
          )
          .timeout(const Duration(seconds: 5));

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('User granted permission');

        // Timeout getToken — can also hang
        final String? token = await _messaging
            .getToken()
            .timeout(const Duration(seconds: 5), onTimeout: () => null);

        if (token != null) {
          await updateDeviceToken(token);
        }

        _messaging.onTokenRefresh.listen((newToken) {
          updateDeviceToken(newToken);
        });
      } else {
        debugPrint('User declined or has not accepted permission');
      }

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Got a message whilst in the foreground!');
        debugPrint('Message data: ${message.data}');

        if (message.notification != null) {
          debugPrint(
              'Message also contained a notification: ${message.notification}');
        }
      });
    } catch (e) {
      debugPrint('FCM initialization error (non-fatal): $e');
    }
  }

  Future<void> updateDeviceToken(String token) async {
    try {
      final dio = _ref.read(dioProvider);
      final deviceInfo = _getDeviceInfo();
      await dio.post(ApiEndpoints.registerDevice, data: {
        'fcmToken': token,
        'deviceType': deviceInfo,
      });
      debugPrint('FCM token updated successfully: $token');
    } catch (e) {
      debugPrint('Failed to update FCM token: $e');
    }
  }

  String _getDeviceInfo() {
    if (kIsWeb) return 'WEB';
    if (Platform.isAndroid) return 'ANDROID';
    if (Platform.isIOS) return 'IOS';
    return 'UNKNOWN';
  }
}

