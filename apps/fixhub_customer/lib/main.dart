import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'app.dart';
import 'features/notifications/data/datasources/fcm_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase — wrapped so the app still launches if config is broken
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase init failed: $e');
  }

  // Initialize Hive for local storage (used for tokens & user data)
  await Hive.initFlutter();
  await dotenv.load(fileName: ".env");

  final container = ProviderContainer();

  // FCM — fire-and-forget; never block the UI from rendering
  container.read(fcmServiceProvider).initialize().catchError((e) {
    debugPrint('FCM init failed (non-blocking): $e');
  });

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const FixHubApp(),
    ),
  );
}

