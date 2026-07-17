import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_app_bar.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/widgets/fixhub_text_field.dart';
import '../../../../core/widgets/fixhub_snackbar.dart';
import '../../../booking/data/models/address_model.dart';
import '../providers/address_provider.dart';

class AddAddressScreen extends ConsumerStatefulWidget {
  const AddAddressScreen({super.key});

  @override
  ConsumerState<AddAddressScreen> createState() => _AddAddressScreenState();
}

class _AddAddressScreenState extends ConsumerState<AddAddressScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _labelController = TextEditingController();
  final _addressLine1Controller = TextEditingController();
  final _addressLine2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  
  bool _isDefault = false;

  @override
  void dispose() {
    _labelController.dispose();
    _addressLine1Controller.dispose();
    _addressLine2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    super.dispose();
  }

  void _saveAddress() async {
    if (_formKey.currentState?.validate() ?? false) {
      try {
        final addressModel = AddressModel(
          id: '',
          customerId: '',
          label: _labelController.text.trim(),
          line1: _addressLine1Controller.text.trim(),
          line2: _addressLine2Controller.text.trim(),
          city: _cityController.text.trim(),
          state: _stateController.text.trim(),
          pincode: _pincodeController.text.trim(),
          isDefault: _isDefault,
        );

        await ref.read(addressesProvider.notifier).addAddress(addressModel);
        
        if (mounted) {
          FixHubSnackbar.success(context, 'Address added successfully');
          context.pop();
        }
      } catch (e) {
        if (mounted) {
          FixHubSnackbar.error(context, 'Failed to add address: $e');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(addressesProvider).isLoading;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Add New Address'),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          children: [
            FixHubTextField(
              controller: _labelController,
              label: 'Label (e.g., Home, Work)',
              hint: 'Home',
              validator: (value) => value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: AppSpacing.md),
            FixHubTextField(
              controller: _addressLine1Controller,
              label: 'Flat / House No. / Building',
              hint: 'e.g. 101, Signature Towers',
              validator: (value) => value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: AppSpacing.md),
            FixHubTextField(
              controller: _addressLine2Controller,
              label: 'Street / Area / Locality',
              hint: 'e.g. MG Road',
              validator: (value) => value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: FixHubTextField(
                    controller: _cityController,
                    label: 'City',
                    hint: 'e.g. Bangalore',
                    validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: FixHubTextField(
                    controller: _stateController,
                    label: 'State',
                    hint: 'e.g. Karnataka',
                    validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            FixHubTextField(
              controller: _pincodeController,
              label: 'Pincode',
              hint: 'e.g. 560001',
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) return 'Required';
                if (value.length != 6) return 'Must be 6 digits';
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            SwitchListTile(
              title: Text(
                'Set as Default Address',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              value: _isDefault,
              onChanged: (val) {
                setState(() {
                  _isDefault = val;
                });
              },
              contentPadding: EdgeInsets.zero,
              activeColor: AppColors.buttonPrimary,
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: FixHubButton(
            label: 'Save Address',
            isLoading: isLoading,
            onPressed: _saveAddress,
          ),
        ),
      ),
    );
  }
}
