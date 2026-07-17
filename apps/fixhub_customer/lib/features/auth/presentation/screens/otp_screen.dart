import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/widgets/fixhub_snackbar.dart';
import '../providers/auth_provider.dart';

/// OTP verification screen with 6-digit Pinput entry,
/// countdown timer, and resend functionality.
class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _otpController = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _timer;
  int _remainingSeconds = 30;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _remainingSeconds = 30;
    _canResend = false;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_remainingSeconds > 0) {
            _remainingSeconds--;
          } else {
            _canResend = true;
            timer.cancel();
          }
        });
      }
    });
  }

  Future<void> _verifyOtp(String otp) async {
    final phone = ref.read(authProvider).phone;
    if (phone == null) return;

    await ref.read(authProvider.notifier).verifyOtp(
          phone: phone,
          otp: otp,
        );
  }

  Future<void> _resendOtp() async {
    if (!_canResend) return;
    _otpController.clear();
    await ref.read(authProvider.notifier).resendOtp();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final phone = authState.phone ?? '';

    // Listen for state changes
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.status == AuthStatus.authenticated) {
        context.go(RouteNames.home);
      } else if (next.status == AuthStatus.error && next.errorMessage != null) {
        FixHubSnackbar.error(context, next.errorMessage!);
        _otpController.clear();
        ref.read(authProvider.notifier).clearError();
      }
    });

    // Pre-fill dev OTP if available
    if (authState.devOtp != null && _otpController.text.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _otpController.text.isEmpty) {
          _otpController.text = authState.devOtp!;
        }
      });
    }

    // Pinput theme
    final defaultPinTheme = PinTheme(
      width: 52,
      height: 56,
      textStyle: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
      decoration: BoxDecoration(
        color: AppColors.elevatedSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
    );

    final focusedPinTheme = defaultPinTheme.copyDecorationWith(
      border: Border.all(color: AppColors.buttonPrimary, width: 1.5),
    );

    final errorPinTheme = defaultPinTheme.copyDecorationWith(
      border: Border.all(color: AppColors.error),
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xxl),

              // Title
              Text(
                'Enter OTP',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      color: AppColors.textPrimary,
                      height: 1.2,
                    ),
              ),

              const SizedBox(height: AppSpacing.sm),

              RichText(
                text: TextSpan(
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                  children: [
                    const TextSpan(text: 'We\'ve sent a 6-digit code to '),
                    TextSpan(
                      text: _formatPhone(phone),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),

              if (authState.devOtp != null) ...[
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.warning),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.bug_report_outlined, color: AppColors.warning, size: 20),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          'Dev Mode: Your OTP is ${authState.devOtp}',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.warning,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.xxxl),

              // OTP Input
              Center(
                child: Pinput(
                  controller: _otpController,
                  focusNode: _focusNode,
                  length: 6,
                  autofocus: true,
                  defaultPinTheme: defaultPinTheme,
                  focusedPinTheme: focusedPinTheme,
                  errorPinTheme: errorPinTheme,
                  onCompleted: _verifyOtp,
                  hapticFeedbackType: HapticFeedbackType.lightImpact,
                  closeKeyboardWhenCompleted: false,
                  keyboardType: TextInputType.number,
                ),
              ),

              const SizedBox(height: AppSpacing.xxl),

              // Resend section
              Center(
                child: _canResend
                    ? GestureDetector(
                        onTap: _resendOtp,
                        child: Text(
                          'Resend Code',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w600,
                                    decoration: TextDecoration.underline,
                                  ),
                        ),
                      )
                    : Text(
                        'Resend OTP in 00:${_remainingSeconds.toString().padLeft(2, '0')}',
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textDisabled,
                                ),
                      ),
              ),

              const Spacer(),

              // Verify button
              FixHubButton(
                label: 'Verify',
                onPressed: _otpController.text.length == 6
                    ? () => _verifyOtp(_otpController.text)
                    : null,
                isLoading: authState.status == AuthStatus.verifying,
              ),

              const SizedBox(height: AppSpacing.bottomSafePadding),
            ],
          ),
        ),
      ),
    );
  }

  String _formatPhone(String phone) {
    if (phone.length >= 13) {
      return '${phone.substring(0, 3)} ${phone.substring(3, 8)} ${phone.substring(8)}';
    }
    return phone;
  }
}
