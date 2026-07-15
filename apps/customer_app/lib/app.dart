import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/theme/app_theme.dart';
import 'core/router/app_router.dart';

class FixHubApp extends ConsumerWidget {
  const FixHubApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'FixHub',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      // Forcing light mode for MVP per implementation plan
      themeMode: ThemeMode.light,
      routerConfig: router,
    );
  }
}
