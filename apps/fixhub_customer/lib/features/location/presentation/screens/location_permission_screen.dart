import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../providers/location_provider.dart';

class LocationPermissionScreen extends ConsumerWidget {
  const LocationPermissionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.location_on_rounded,
                  size: 64,
                  color: AppColors.buttonPrimary,
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              Text(
                'Enable Location',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'We need your location to show available services and verified technicians in your area.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              FixHubButton(
                label: 'Allow Location Access',
                onPressed: () async {
                  final granted = await ref
                      .read(locationProvider.notifier)
                      .requestPermission();
                  if (granted && context.mounted) {
                    context.pop();
                  }
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              FixHubButton.ghost(
                label: 'Enter Location Manually',
                onPressed: () {
                  context.pop();
                },
              ),
              const SizedBox(height: AppSpacing.bottomSafePadding),
            ],
          ),
        ),
      ),
    );
  }
}
