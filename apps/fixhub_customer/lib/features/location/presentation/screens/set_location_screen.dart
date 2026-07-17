import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/widgets/fixhub_snackbar.dart';
import '../providers/location_provider.dart';

class SetLocationScreen extends ConsumerStatefulWidget {
  const SetLocationScreen({super.key});

  @override
  ConsumerState<SetLocationScreen> createState() => _SetLocationScreenState();
}

class _SetLocationScreenState extends ConsumerState<SetLocationScreen> {
  final _pincodeController = TextEditingController();

  @override
  void dispose() {
    _pincodeController.dispose();
    super.dispose();
  }

  void _validatePincode() {
    final pincode = _pincodeController.text.trim();
    if (pincode.length == 6) {
      ref.read(locationProvider.notifier).validateArea(pincode);
    } else {
      FixHubSnackbar.error(context, 'Please enter a valid 6-digit pincode');
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(locationProvider);

    ref.listen<LocationState>(locationProvider, (previous, next) {
      if (next.status == LocationStatus.valid) {
        context.go(RouteNames.home);
      } else if (next.status == LocationStatus.invalid) {
        context.go('/location/not-covered');
      } else if (next.status == LocationStatus.error && next.errorMessage != null) {
        FixHubSnackbar.error(context, next.errorMessage!);
        ref.read(locationProvider.notifier).reset();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('Enter Pincode'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Where do you need service?',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.textPrimary,
                    ),
              ),
              const SizedBox(height: AppSpacing.md),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.elevatedSurface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on_outlined, color: AppColors.textSecondary),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: TextField(
                        controller: _pincodeController,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        decoration: const InputDecoration(
                          hintText: 'Enter 6-digit Pincode',
                          border: InputBorder.none,
                          counterText: '',
                        ),
                        onSubmitted: (_) => _validatePincode(),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              FixHubButton(
                label: 'Check Service Availability',
                isLoading: locationState.status == LocationStatus.checking,
                onPressed: _validatePincode,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
