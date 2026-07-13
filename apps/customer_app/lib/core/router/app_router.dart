import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'route_names.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: RouteNames.splash,
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: RouteNames.splash,
        name: 'splash',
        builder: (context, state) => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
        // TODO: Replace with SplashScreen that checks auth state
      ),
      GoRoute(
        path: RouteNames.login,
        name: 'login',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Login Screen')),
        ),
        // TODO: Replace with LoginScreen from auth feature
      ),
      ShellRoute(
        builder: (context, state, child) => Scaffold(
          body: child,
          bottomNavigationBar: NavigationBar(
            selectedIndex: _getSelectedIndex(state.matchedLocation),
            onDestinationSelected: (index) => _onDestinationSelected(index, context),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
              NavigationDestination(icon: Icon(Icons.calendar_today), label: 'Bookings'),
              NavigationDestination(icon: Icon(Icons.notifications), label: 'Alerts'),
              NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
            ],
          ),
        ),
        routes: [
          GoRoute(
            path: RouteNames.home,
            name: 'home',
            builder: (context, state) => const Center(child: Text('Home')),
            // TODO: Replace with HomeScreen
          ),
          GoRoute(
            path: RouteNames.bookings,
            name: 'bookings',
            builder: (context, state) => const Center(child: Text('Bookings')),
            // TODO: Replace with BookingsScreen
          ),
          GoRoute(
            path: RouteNames.notifications,
            name: 'notifications',
            builder: (context, state) => const Center(child: Text('Notifications')),
            // TODO: Replace with NotificationsScreen
          ),
          GoRoute(
            path: RouteNames.profile,
            name: 'profile',
            builder: (context, state) => const Center(child: Text('Profile')),
            // TODO: Replace with ProfileScreen
          ),
        ],
      ),
    ],
    // TODO: Add redirect logic for auth state
  );
});

int _getSelectedIndex(String location) {
  if (location.startsWith(RouteNames.bookings)) return 1;
  if (location.startsWith(RouteNames.notifications)) return 2;
  if (location.startsWith(RouteNames.profile)) return 3;
  return 0;
}

void _onDestinationSelected(int index, BuildContext context) {
  switch (index) {
    case 0:
      context.go(RouteNames.home);
    case 1:
      context.go(RouteNames.bookings);
    case 2:
      context.go(RouteNames.notifications);
    case 3:
      context.go(RouteNames.profile);
  }
}
