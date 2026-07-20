import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Technician Login')),
        ),
      ),
      ShellRoute(
        builder: (context, state, child) => Scaffold(
          body: child,
          bottomNavigationBar: NavigationBar(
            selectedIndex: _getIndex(state.matchedLocation),
            onDestinationSelected: (i) => _navigate(i, context),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.work), label: 'Jobs'),
              NavigationDestination(icon: Icon(Icons.history), label: 'History'),
              NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
            ],
          ),
        ),
        routes: [
          GoRoute(path: '/jobs', builder: (_, __) => const Center(child: Text('Active Jobs'))),
          GoRoute(path: '/history', builder: (_, __) => const Center(child: Text('Job History'))),
          GoRoute(path: '/profile', builder: (_, __) => const Center(child: Text('Profile'))),
        ],
      ),
    ],
  );
});

int _getIndex(String location) {
  if (location.startsWith('/history')) return 1;
  if (location.startsWith('/profile')) return 2;
  return 0;
}

void _navigate(int index, BuildContext context) {
  switch (index) {
    case 0: context.go('/jobs');
    case 1: context.go('/history');
    case 2: context.go('/profile');
  }
}
