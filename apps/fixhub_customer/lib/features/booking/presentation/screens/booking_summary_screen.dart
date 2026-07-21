import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:path/path.dart' as p;
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/widgets/fixhub_app_bar.dart';
import '../../../../core/widgets/fixhub_button.dart';
import '../../../../core/widgets/fixhub_card.dart';
import '../../../../core/router/route_names.dart';
import '../providers/booking_flow_provider.dart';
import '../../../../core/widgets/fixhub_text_field.dart';
import '../../../../core/widgets/fixhub_snackbar.dart';
import '../providers/booking_provider.dart';
import '../../data/services/booking_media_upload_service.dart';

/// Maximum number of media files (photos + videos combined)
const _kMaxMedia = 5;

class BookingSummaryScreen extends ConsumerStatefulWidget {
  const BookingSummaryScreen({super.key});

  @override
  ConsumerState<BookingSummaryScreen> createState() =>
      _BookingSummaryScreenState();
}

class _BookingSummaryScreenState extends ConsumerState<BookingSummaryScreen> {
  final _picker = ImagePicker();

  /// Locally-selected files before upload
  final List<XFile> _selectedFiles = [];

  // ── Media picking ─────────────────────────────────────────────────

  Future<void> _pickImage() async {
    if (_selectedFiles.length >= _kMaxMedia) {
      FixHubSnackbar.error(context, 'Maximum $_kMaxMedia files allowed');
      return;
    }
    final file = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1920,
    );
    if (file != null && mounted) {
      setState(() => _selectedFiles.add(file));
    }
  }

  Future<void> _pickVideo() async {
    if (_selectedFiles.length >= _kMaxMedia) {
      FixHubSnackbar.error(context, 'Maximum $_kMaxMedia files allowed');
      return;
    }
    final file = await _picker.pickVideo(
      source: ImageSource.gallery,
      maxDuration: const Duration(seconds: 60),
    );
    if (file != null && mounted) {
      setState(() => _selectedFiles.add(file));
    }
  }

  Future<void> _pickFromCamera() async {
    if (_selectedFiles.length >= _kMaxMedia) {
      FixHubSnackbar.error(context, 'Maximum $_kMaxMedia files allowed');
      return;
    }
    final file = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
      maxWidth: 1920,
    );
    if (file != null && mounted) {
      setState(() => _selectedFiles.add(file));
    }
  }

  void _removeFile(int index) =>
      setState(() => _selectedFiles.removeAt(index));

  // ── Content type inference ────────────────────────────────────────

  String _contentType(XFile file) {
    final ext = p.extension(file.name).toLowerCase().replaceAll('.', '');
    return switch (ext) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'webp' => 'image/webp',
      'mp4' => 'video/mp4',
      'mov' => 'video/quicktime',
      'webm' => 'video/webm',
      _ => 'image/jpeg',
    };
  }

  bool _isVideo(XFile file) => _contentType(file).startsWith('video/');

  // ── Upload after draft is created ────────────────────────────────

  Future<void> _uploadMedia(String draftId) async {
    if (_selectedFiles.isEmpty) return;
    final uploadService = ref.read(bookingMediaUploadServiceProvider);
    for (final xfile in _selectedFiles) {
      await uploadService.uploadFile(
        bookingId: draftId,
        file: File(xfile.path),
        contentType: _contentType(xfile),
        phase: 'BEFORE_SERVICE',
      );
    }
  }

  // ── Main action ───────────────────────────────────────────────────

  Future<void> _proceedToPay(double total) async {
    final repo = ref.read(bookingRepositoryProvider);
    try {
      // 1. Create draft
      await ref.read(bookingFlowProvider.notifier).createDraftBooking(repo);
      final draftId = ref.read(bookingFlowProvider).draftBookingId!;

      // 2. Upload media (best-effort — never block payment if upload fails)
      try {
        await _uploadMedia(draftId);
      } catch (_) {
        // silently skip; media is optional
      }

      // 3. Confirm booking
      await repo.confirmBooking(draftId, {});

      if (mounted) context.push(RouteNames.payment);
    } catch (e) {
      if (mounted) {
        FixHubSnackbar.error(context, 'Failed to create booking: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final flowState = ref.watch(bookingFlowProvider);
    final service = flowState.selectedService;
    final address = flowState.selectedAddress;
    final slot = flowState.selectedSlot;

    if (service == null || address == null || slot == null) {
      return const Scaffold(body: Center(child: Text('Missing booking details')));
    }

    const platformFee = 49.0;
    final total = service.basePrice + platformFee;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const FixHubAppBar(title: 'Review Booking'),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              children: [
                // ── Service Detail ────────────────────────────────
                FixHubCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Service Details',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.sm),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: AppRadius.smallRadius,
                            ),
                            child: const Icon(Icons.build_rounded),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  service.name,
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                Text(
                                  service.formattedPrice,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (flowState.issueTags.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.md),
                        Wrap(
                          spacing: AppSpacing.xs,
                          runSpacing: AppSpacing.xs,
                          children: flowState.issueTags.map((tag) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.sm,
                                  vertical: AppSpacing.xxs),
                              decoration: BoxDecoration(
                                color: AppColors.buttonPrimary.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Text(
                                tag,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: AppColors.buttonPrimary),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Date & Time ───────────────────────────────────
                FixHubCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Scheduled For',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today_rounded,
                              color: AppColors.textSecondary, size: 20),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            DateFormat('EEEE, MMM d, yyyy').format(slot.date),
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        children: [
                          const Icon(Icons.access_time_rounded,
                              color: AppColors.textSecondary, size: 20),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            slot.formattedTime,
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Address ───────────────────────────────────────
                FixHubCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Address',
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                          GestureDetector(
                            onTap: () => context.pop(),
                            child: Text(
                              'Change',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelMedium
                                  ?.copyWith(
                                    color: AppColors.buttonPrimary,
                                    decoration: TextDecoration.underline,
                                  ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        address.label,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        address.formattedAddress,
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Issue Details & Contact ────────────────────────
                FixHubCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Issue Description (Optional)',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      FixHubTextField(
                        hint: 'Describe the issue or add special instructions...',
                        maxLines: 3,
                        onChanged: (val) =>
                            ref.read(bookingFlowProvider.notifier).setDescription(val),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text(
                        'Contact Number',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      FixHubTextField(
                        hint: 'Enter mobile number for technician',
                        keyboardType: TextInputType.phone,
                        onChanged: (val) =>
                            ref.read(bookingFlowProvider.notifier).setContactNumber(val),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Issue Media ───────────────────────────────────
                _IssueMediaPicker(
                  files: _selectedFiles,
                  isVideo: _isVideo,
                  onPickGallery: _pickImage,
                  onPickVideo: _pickVideo,
                  onPickCamera: _pickFromCamera,
                  onRemove: _removeFile,
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Price Summary ─────────────────────────────────
                FixHubCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Payment Summary',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _PriceRow(label: 'Service Total', amount: service.basePrice),
                      const SizedBox(height: AppSpacing.sm),
                      _PriceRow(label: 'Platform Fee', amount: platformFee),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
                        child: Divider(),
                      ),
                      _PriceRow(
                        label: 'Total Amount',
                        amount: total,
                        isTotal: true,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Sticky Pay Button ─────────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              child: FixHubButton(
                label: 'Proceed to Pay ₹${total.toStringAsFixed(0)}',
                isLoading: flowState.isLoading,
                onPressed: () => _proceedToPay(total),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Issue Media Picker card
// ─────────────────────────────────────────────────────────────────────────────

class _IssueMediaPicker extends StatelessWidget {
  const _IssueMediaPicker({
    required this.files,
    required this.isVideo,
    required this.onPickGallery,
    required this.onPickVideo,
    required this.onPickCamera,
    required this.onRemove,
  });

  final List<XFile> files;
  final bool Function(XFile) isVideo;
  final VoidCallback onPickGallery;
  final VoidCallback onPickVideo;
  final VoidCallback onPickCamera;
  final void Function(int) onRemove;

  @override
  Widget build(BuildContext context) {
    final canAdd = files.length < _kMaxMedia;

    return FixHubCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Issue Media (Optional)',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Help your technician understand the issue. Up to $_kMaxMedia photos or videos (max 60 s each).',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Thumbnails grid
          if (files.isNotEmpty) ...[
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                for (int i = 0; i < files.length; i++)
                  _MediaThumb(
                    file: files[i],
                    isVideoFile: isVideo(files[i]),
                    onRemove: () => onRemove(i),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
          ],

          // Add buttons
          if (canAdd)
            Row(
              children: [
                _AddButton(
                  icon: Icons.photo_library_rounded,
                  label: 'Gallery',
                  onTap: onPickGallery,
                ),
                const SizedBox(width: AppSpacing.sm),
                _AddButton(
                  icon: Icons.videocam_rounded,
                  label: 'Video',
                  onTap: onPickVideo,
                ),
                const SizedBox(width: AppSpacing.sm),
                _AddButton(
                  icon: Icons.camera_alt_rounded,
                  label: 'Camera',
                  onTap: onPickCamera,
                ),
              ],
            )
          else
            Text(
              'Maximum files reached ($_kMaxMedia)',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.textSecondary),
            ),
        ],
      ),
    );
  }
}

class _MediaThumb extends StatelessWidget {
  const _MediaThumb({
    required this.file,
    required this.isVideoFile,
    required this.onRemove,
  });

  final XFile file;
  final bool isVideoFile;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 90,
      height: 90,
      child: Stack(
        fit: StackFit.expand,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: isVideoFile
                ? Container(
                    color: AppColors.surface,
                    child: const Center(
                      child: Icon(
                        Icons.videocam_rounded,
                        size: 36,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  )
                : Image.file(
                    File(file.path),
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: AppColors.surface,
                      child: const Icon(Icons.broken_image_rounded,
                          color: AppColors.textSecondary),
                    ),
                  ),
          ),
          // Video label chip
          if (isVideoFile)
            Positioned(
              bottom: 6,
              left: 6,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'VIDEO',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w700),
                ),
              ),
            ),
          // Remove button
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 14, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, size: 22, color: AppColors.buttonPrimary),
              const SizedBox(height: 4),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.buttonPrimary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Price row
// ─────────────────────────────────────────────────────────────────────────────

class _PriceRow extends StatelessWidget {
  const _PriceRow({
    required this.label,
    required this.amount,
    this.isTotal = false,
  });

  final String label;
  final double amount;
  final bool isTotal;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal
              ? Theme.of(context).textTheme.titleLarge
              : Theme.of(context)
                  .textTheme
                  .bodyLarge
                  ?.copyWith(color: AppColors.textSecondary),
        ),
        Text(
          '₹${amount.toStringAsFixed(0)}',
          style: isTotal
              ? Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold)
              : Theme.of(context)
                  .textTheme
                  .bodyLarge
                  ?.copyWith(fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}

