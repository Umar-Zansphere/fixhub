import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/widgets/fixhub_button.dart';

class ServiceAreaNotCoveredScreen extends StatelessWidget {
  const ServiceAreaNotCoveredScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go(RouteNames.locationAccess),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              
              Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.sentiment_dissatisfied_rounded,
                  size: 80,
                  color: AppColors.textSecondary,
                ),
              ),
              
              const SizedBox(height: AppSpacing.xxl),
              
              Text(
                'We\'re not here yet',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      color: AppColors.textPrimary,
                    ),
              ),
              
              const SizedBox(height: AppSpacing.md),
              
              Text(
                'Sorry, we don\'t provide services in your area right now.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              
              const Spacer(),
              
              FixHubButton(
                label: 'Notify me when live',
                onPressed: () {
                  // TODO: Save to backend or local list
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('We will notify you when we launch!')),
                  );
                  context.go(RouteNames.locationAccess);
                },
              ),
              
              const SizedBox(height: AppSpacing.md),
              
              TextButton(
                onPressed: () {
                  context.go(RouteNames.setLocation);
                },
                child: Text(
                  'Change Location',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              
              const SizedBox(height: AppSpacing.bottomSafePadding),
            ],
          ),
        ),
      ),
    );
  }
}
