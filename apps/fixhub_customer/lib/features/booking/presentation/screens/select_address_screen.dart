import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_app_bar.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/widgets/fixhub_card.dart';
import '../../../../core/router/route_names.dart';
import '../providers/booking_flow_provider.dart';
import '../../data/models/address_model.dart';
import '../../../profile/presentation/providers/address_provider.dart';
import '../../../../core/widgets/fixhub_empty_state.dart';

class SelectAddressScreen extends ConsumerStatefulWidget {
  const SelectAddressScreen({super.key});

  @override
  ConsumerState<SelectAddressScreen> createState() => _SelectAddressScreenState();
}

class _SelectAddressScreenState extends ConsumerState<SelectAddressScreen> {
  AddressModel? _selectedAddress;

  @override
  Widget build(BuildContext context) {
    final addressesAsync = ref.watch(addressesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Select Address'),
      body: addressesAsync.when(
        data: (addresses) {
          if (addresses.isEmpty) {
            return FixHubEmptyState(
              icon: Icons.location_on_outlined,
              title: 'No saved addresses',
              message: 'Add an address to proceed with your booking.',
              actionLabel: 'Add Address',
              onAction: () => context.push('/add-address'),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(AppSpacing.screenPadding),
                  itemCount: addresses.length + 1,
                  itemBuilder: (context, index) {
                    if (index == addresses.length) {
                      return Padding(
                        padding: const EdgeInsets.only(top: AppSpacing.md),
                        child: FixHubButton.secondary(
                          label: 'Add New Address',
                          icon: Icons.add_rounded,
                          onPressed: () {
                            context.push('/add-address');
                          },
                        ),
                      );
                    }

                    final address = addresses[index];
                    final isSelected = _selectedAddress?.id == address.id;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: FixHubCard(
                        borderColor: isSelected ? AppColors.buttonPrimary : null,
                        onTap: () {
                          setState(() {
                            _selectedAddress = address;
                          });
                        },
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              address.label.toUpperCase() == 'HOME'
                                  ? Icons.home_rounded
                                  : Icons.work_rounded,
                              color: AppColors.textPrimary,
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        address.label,
                                        style: Theme.of(context).textTheme.titleMedium,
                                      ),
                                      if (address.isDefault) ...[
                                        const SizedBox(width: AppSpacing.sm),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: AppSpacing.xs,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: AppColors.surface,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            'Default',
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(
                                                  color: AppColors.textSecondary,
                                                  fontSize: 10,
                                                ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: AppSpacing.xxs),
                                  Text(
                                    address.formattedAddress,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: AppColors.textSecondary,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(
                                Icons.check_circle_rounded,
                                color: AppColors.success,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.screenPadding),
                  child: FixHubButton(
                    label: 'Continue to Time Slot',
                    onPressed: _selectedAddress != null
                        ? () {
                            ref
                                .read(bookingFlowProvider.notifier)
                                .setAddress(_selectedAddress!);
                            context.push(RouteNames.selectSlot);
                          }
                        : null,
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
