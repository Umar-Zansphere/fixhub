import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/config/theme/app_colors.dart';

class AppNavigation extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const AppNavigation({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.border, width: 1)),
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: (index) {
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          },
          backgroundColor: AppColors.surface,
          elevation: 0,
          height: 65,
          indicatorColor: Colors.transparent,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            _NavigationDestination(
              icon: Icons.home_outlined,
              selectedIcon: Icons.home_rounded,
              label: 'Home',
              isSelected: navigationShell.currentIndex == 0,
            ),
            _NavigationDestination(
              icon: Icons.work_outline_rounded,
              selectedIcon: Icons.work_rounded,
              label: 'Jobs',
              isSelected: navigationShell.currentIndex == 1,
            ),
            _NavigationDestination(
              icon: Icons.account_balance_wallet_outlined,
              selectedIcon: Icons.account_balance_wallet_rounded,
              label: 'Earnings',
              isSelected: navigationShell.currentIndex == 2,
            ),
            _NavigationDestination(
              icon: Icons.person_outline_rounded,
              selectedIcon: Icons.person_rounded,
              label: 'Profile',
              isSelected: navigationShell.currentIndex == 3,
            ),
          ],
        ),
      ),
    );
  }
}

class _NavigationDestination extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool isSelected;

  const _NavigationDestination({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return NavigationDestination(
      icon: Icon(icon, color: AppColors.textSecondary, size: 24),
      selectedIcon: Icon(selectedIcon, color: AppColors.primary, size: 24),
      label: label,
    );
  }
}
