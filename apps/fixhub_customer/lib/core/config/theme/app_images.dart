/// FixHub Asset Path Constants
///
/// Centralized reference for all image and animation assets.
/// Use these constants instead of hardcoding paths.
class AppImages {
  AppImages._();

  // ── Welcome & Onboarding ────────────────────────────────────
  static const String welcomeHero = 'assets/images/welcome_hero.png';

  // ── Featured Banners ────────────────────────────────────────
  static const String bannerElectrical = 'assets/images/banner_electrical.png';
  static const String bannerAcService = 'assets/images/banner_ac_service.png';
  static const String bannerFanRepair = 'assets/images/banner_fan_repair.png';

  // ── Service Detail Heroes ────────────────────────────────────
  static const String serviceHeroElectrical = 'assets/images/service_hero_electrical.png';
  static const String serviceHeroAc = 'assets/images/service_hero_ac.png';

  // ── Empty States ─────────────────────────────────────────────
  static const String emptyBookings = 'assets/images/empty_state_bookings.png';

  // ── Animations ───────────────────────────────────────────────
  static const String bookingSuccessAnimation = 'assets/animations/booking_success.json';

  /// Returns the appropriate service hero image for a category slug.
  static String serviceHeroForCategory(String? slug) {
    switch (slug) {
      case 'electrical':
        return serviceHeroElectrical;
      case 'ac-service':
        return serviceHeroAc;
      default:
        return serviceHeroElectrical;
    }
  }
}
