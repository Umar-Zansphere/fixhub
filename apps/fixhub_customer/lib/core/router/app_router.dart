import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/otp_screen.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/welcome_screen.dart';
import '../../features/booking/presentation/screens/bookings_list_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/saved_addresses_screen.dart';
import '../../features/profile/presentation/screens/add_address_screen.dart';
import '../../features/profile/presentation/screens/edit_profile_screen.dart';
import '../../features/services/presentation/screens/category_services_screen.dart';
import '../../features/services/presentation/screens/service_detail_screen.dart';
import '../../features/support/presentation/screens/support_screen.dart';
import '../../features/location/presentation/screens/location_access_screen.dart';
import '../../features/location/presentation/screens/set_location_screen.dart';
import '../../features/location/presentation/screens/service_area_not_covered_screen.dart';
import '../../features/location/presentation/providers/location_provider.dart';
import '../../features/booking/presentation/screens/select_address_screen.dart';
import '../../features/booking/presentation/screens/select_slot_screen.dart';
import '../../features/booking/presentation/screens/booking_summary_screen.dart';
import '../../features/booking/presentation/screens/payment_screen.dart';
import '../../features/booking/presentation/screens/booking_success_screen.dart';
import '../../features/booking/presentation/screens/booking_detail_screen.dart';
import '../../features/booking/presentation/screens/booking_tracking_screen.dart';
import '../../features/booking/presentation/screens/booking_progress_screen.dart';
import 'route_names.dart';
import 'scaffold_with_nav_bar.dart';

final navigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(Ref ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
    ref.listen(locationProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);
  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: RouteNames.splash,
    debugLogDiagnostics: true,
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      
      final isAuthRoute = state.matchedLocation == RouteNames.welcome ||
          state.matchedLocation == RouteNames.login ||
          state.matchedLocation == RouteNames.otp;

      final isSplashRoute = state.matchedLocation == RouteNames.splash;

      if (isSplashRoute) return null;

      if (!authState.isAuthenticated && !isAuthRoute) {
        return RouteNames.welcome;
      }

      if (authState.isAuthenticated && isAuthRoute) {
        if (ref.read(locationProvider).status == LocationStatus.valid) {
          return RouteNames.home;
        } else {
          return RouteNames.locationAccess;
        }
      }

      if (authState.isAuthenticated) {
        final locationState = ref.read(locationProvider);
        // Wait for location to be restored from storage before redirecting
        if (locationState.isRestoring) return null;
        final locationStatus = locationState.status;
        final isLocationRoute = state.matchedLocation == RouteNames.locationAccess ||
            state.matchedLocation == RouteNames.setLocation ||
            state.matchedLocation == RouteNames.serviceAreaNotCovered;
            
        if (locationStatus == LocationStatus.initial && !isLocationRoute) {
          return RouteNames.locationAccess;
        }
      }

      return null;
    },
    routes: [
      // ── Auth Routes ─────────────────────────────────────────────
      GoRoute(
        path: RouteNames.splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: RouteNames.welcome,
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: RouteNames.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteNames.otp,
        name: 'otp',
        builder: (context, state) => const OtpScreen(),
      ),

      // ── Shell Routes (Bottom Nav) ───────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0 - Home
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.home,
                name: 'home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          // Branch 1 - Bookings
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.bookings,
                name: 'bookings',
                builder: (context, state) => const BookingsListScreen(),
              ),
            ],
          ),
          // Branch 2 - Support
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.support,
                name: 'support',
                builder: (context, state) => const SupportScreen(),
              ),
            ],
          ),
          // Branch 3 - Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.profile,
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // ── Feature Routes ──────────────────────────────────────────
      GoRoute(
        path: RouteNames.categoryServices,
        name: 'categoryServices',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return CategoryServicesScreen(categoryId: id);
        },
      ),
      GoRoute(
        path: RouteNames.serviceDetail,
        name: 'serviceDetail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ServiceDetailScreen(serviceId: id);
        },
      ),

      // ── Location Routes ──────────────────────────────────────────
      GoRoute(
        path: RouteNames.locationAccess,
        name: 'locationAccess',
        builder: (context, state) => const LocationAccessScreen(),
      ),
      GoRoute(
        path: RouteNames.setLocation,
        name: 'setLocation',
        builder: (context, state) => const SetLocationScreen(),
      ),
      GoRoute(
        path: RouteNames.serviceAreaNotCovered,
        name: 'serviceAreaNotCovered',
        builder: (context, state) => const ServiceAreaNotCoveredScreen(),
      ),

      // ── Booking Flow Routes ──────────────────────────────────────
      GoRoute(
        path: RouteNames.selectAddress,
        name: 'selectAddress',
        builder: (context, state) => const SelectAddressScreen(),
      ),
      GoRoute(
        path: RouteNames.selectSlot,
        name: 'selectSlot',
        builder: (context, state) => const SelectSlotScreen(),
      ),
      GoRoute(
        path: RouteNames.bookingSummary,
        name: 'bookingSummary',
        builder: (context, state) => const BookingSummaryScreen(),
      ),
      GoRoute(
        path: RouteNames.payment,
        name: 'payment',
        builder: (context, state) => const PaymentScreen(),
      ),
      GoRoute(
        path: RouteNames.bookingSuccess,
        name: 'bookingSuccess',
        builder: (context, state) => const BookingSuccessScreen(),
      ),
      GoRoute(
        path: '/booking-detail/:id',
        name: 'bookingDetail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return BookingDetailScreen(bookingId: id);
        },
      ),
      GoRoute(
        path: '/booking-tracking/:id',
        name: 'bookingTracking',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return BookingTrackingScreen(bookingId: id);
        },
      ),
      GoRoute(
        path: '/booking-progress/:id',
        name: 'bookingProgress',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return BookingProgressScreen(bookingId: id);
        },
      ),
      GoRoute(
        path: RouteNames.savedAddresses,
        name: 'savedAddresses',
        builder: (context, state) => const SavedAddressesScreen(),
      ),
      GoRoute(
        path: '/add-address',
        name: 'addAddress',
        builder: (context, state) => const AddAddressScreen(),
      ),
      GoRoute(
        path: RouteNames.editProfile,
        name: 'editProfile',
        builder: (context, state) => const EditProfileScreen(),
      ),
    ],
  );
});
