import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/widgets/fixhub_app_bar.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/router/route_names.dart';
import '../providers/booking_flow_provider.dart';
import '../providers/booking_provider.dart';
import '../../../../core/widgets/fixhub_snackbar.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  late Razorpay _razorpay;
  bool _isProcessing = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _startPayment() async {
    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    try {
      final flowState = ref.read(bookingFlowProvider);
      if (flowState.draftBookingId == null) {
        throw Exception('Booking not found');
      }

      // 1. Create Razorpay order via backend
      final repo = ref.read(bookingRepositoryProvider);
      final orderData = await repo.createPaymentOrder(flowState.draftBookingId!);

      final keyId = orderData['keyId'] as String?;
      final orderId = orderData['orderId'] as String?;
      final amount = orderData['amount'] as int?;

      if (keyId == null || orderId == null || amount == null) {
        throw Exception('Invalid payment order response');
      }

      // 2. Open Razorpay checkout
      final options = {
        'key': keyId,
        'amount': amount,
        'currency': 'INR',
        'order_id': orderId,
        'name': 'FixHub',
        'description': flowState.selectedService?.name ?? 'Service Booking',
        'timeout': 300,  // 5 minutes
        'prefill': {
          'contact': '',
          'email': '',
        },
        'theme': {
          'color': '#1F1F1F',
        },
      };

      _razorpay.open(options);
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _errorMessage = 'Failed to create payment order: $e';
      });
      if (mounted) {
        FixHubSnackbar.error(context, _errorMessage!);
      }
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    // 3. Verify payment with backend
    try {
      final repo = ref.read(bookingRepositoryProvider);
      await repo.verifyPayment({
        'razorpayOrderId': response.orderId,
        'razorpayPaymentId': response.paymentId,
        'razorpaySignature': response.signature,
      });

      if (mounted) {
        FixHubSnackbar.success(context, 'Payment Successful!');
        context.go(RouteNames.bookingSuccess);
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _errorMessage = 'Payment verification failed. Please contact support.';
      });
      if (mounted) {
        FixHubSnackbar.error(context, _errorMessage!);
      }
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    setState(() {
      _isProcessing = false;
      _errorMessage = response.message ?? 'Payment was cancelled or failed';
    });
    if (mounted) {
      FixHubSnackbar.error(context, _errorMessage!);
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (mounted) {
      FixHubSnackbar.info(
        context,
        'External wallet selected: ${response.walletName}',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final flowState = ref.watch(bookingFlowProvider);
    final service = flowState.selectedService;
    const platformFee = 49.0;
    final total = (service?.basePrice ?? 0) + platformFee;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Payment'),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: Column(
            children: [
              const Spacer(),

              // ── Payment Icon ──────────────────────────
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.border, width: 1),
                ),
                child: const Icon(
                  Icons.lock_rounded,
                  size: 40,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),

              // ── Amount ──────────────────────────────
              Text(
                'Total Amount',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                '₹${total.toStringAsFixed(0)}',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
              ),
              const SizedBox(height: AppSpacing.xs),
              if (service != null)
                Text(
                  service.name,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),

              const SizedBox(height: AppSpacing.xxl),

              // ── Secure Badge ──────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: AppRadius.mediumRadius,
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_user_rounded,
                        size: 16, color: AppColors.success),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'Secured by Razorpay',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  ],
                ),
              ),

              // ── Error Message ──────────────────────────
              if (_errorMessage != null) ...[
                const SizedBox(height: AppSpacing.lg),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.05),
                    borderRadius: AppRadius.mediumRadius,
                    border: Border.all(
                      color: AppColors.error.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline_rounded,
                          size: 18, color: AppColors.error),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.error,
                                  ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const Spacer(),

              // ── CTA ──────────────────────────────────
              FixHubButton(
                label: _errorMessage != null ? 'Retry Payment' : 'Pay Now',
                isLoading: _isProcessing,
                onPressed: _startPayment,
              ),
              const SizedBox(height: AppSpacing.md),
              FixHubButton.secondary(
                label: 'Cancel',
                onPressed: _isProcessing ? null : () => context.pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
