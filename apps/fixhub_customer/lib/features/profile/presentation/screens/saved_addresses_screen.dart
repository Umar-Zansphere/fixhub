import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_app_bar.dart';
import '../../../../core/widgets/fixhub_card.dart';
import '../../../../core/widgets/fixhub_shimmer.dart';
import '../../../../core/widgets/fixhub_error_state.dart';
import '../../../../core/widgets/fixhub_empty_state.dart';
import '../providers/address_provider.dart';

class SavedAddressesScreen extends ConsumerWidget {
  const SavedAddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesAsync = ref.watch(addressesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Saved Addresses'),
      body: addressesAsync.when(
        data: (addresses) {
          if (addresses.isEmpty) {
            return FixHubEmptyState(
              icon: Icons.location_on_outlined,
              title: 'No saved addresses',
              message: 'Add a new address to book services.',
              actionLabel: 'Add Address',
              onAction: () {
                context.push('/add-address');
              },
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.screenPadding),
            itemCount: addresses.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, index) {
              final address = addresses[index];
              return FixHubCard(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.location_on,
                      color: AppColors.buttonPrimary,
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            address.label,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: AppSpacing.xxs),
                          Text(
                            address.formattedAddress,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: AppColors.error),
                      onPressed: () {
                        // TODO: Confirm delete and delete using provider
                        ref.read(addressesProvider.notifier).deleteAddress(address.id);
                      },
                    ),
                  ],
                ),
              );
            },
          );
        },
        loading: () => Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: FixHubShimmer.listPlaceholder(itemCount: 3),
        ),
        error: (error, _) => FixHubErrorState(
          onRetry: () => ref.invalidate(addressesProvider),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.push('/add-address');
        },
        backgroundColor: AppColors.buttonPrimary,
        child: const Icon(Icons.add, color: AppColors.surface),
      ),
    );
  }
}
