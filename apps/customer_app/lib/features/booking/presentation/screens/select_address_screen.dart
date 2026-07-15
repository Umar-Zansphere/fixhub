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

class SelectAddressScreen extends ConsumerStatefulWidget {
  const SelectAddressScreen({super.key});

  @override
  ConsumerState<SelectAddressScreen> createState() => _SelectAddressScreenState();
}

class _SelectAddressScreenState extends ConsumerState<SelectAddressScreen> {
  AddressModel? _selectedAddress;

  // Mock addresses since backend address CRUD is TODO
  final _mockAddresses = [
    const AddressModel(
      id: '1',
      type: 'HOME',
      street: '123 Main St, Apartment 4B',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600099',
      country: 'India',
      isDefault: true,
    ),
    const AddressModel(
      id: '2',
      type: 'WORK',
      street: '456 Tech Park, Block C',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600100',
      country: 'India',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Select Address'),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              itemCount: _mockAddresses.length + 1,
              itemBuilder: (context, index) {
                if (index == _mockAddresses.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.md),
                    child: FixHubButton.secondary(
                      label: 'Add New Address',
                      icon: Icons.add_rounded,
                      onPressed: () {
                        // TODO: Navigate to Add Address Screen
                      },
                    ),
                  );
                }

                final address = _mockAddresses[index];
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
                          address.type == 'HOME'
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
                                    address.type,
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
      ),
    );
  }
}
