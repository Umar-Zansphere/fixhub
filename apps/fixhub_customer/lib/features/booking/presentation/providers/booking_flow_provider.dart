import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../data/models/address_model.dart';
import '../../data/models/time_slot_model.dart';
import '../../../home/data/models/sub_service_model.dart';
import '../../domain/repositories/booking_repository.dart';

class BookingFlowState {
  final String? draftBookingId;
  final SubServiceModel? selectedService;
  final List<String> issueTags;
  final String? description;
  final List<String> mediaUrls;
  final String? contactNumber;
  final AddressModel? selectedAddress;
  final TimeSlotModel? selectedSlot;
  final bool isLoading;
  final String? errorMessage;

  const BookingFlowState({
    this.draftBookingId,
    this.selectedService,
    this.issueTags = const [],
    this.description,
    this.mediaUrls = const [],
    this.contactNumber,
    this.selectedAddress,
    this.selectedSlot,
    this.isLoading = false,
    this.errorMessage,
  });

  BookingFlowState copyWith({
    String? draftBookingId,
    SubServiceModel? selectedService,
    List<String>? issueTags,
    String? description,
    List<String>? mediaUrls,
    String? contactNumber,
    AddressModel? selectedAddress,
    TimeSlotModel? selectedSlot,
    bool? isLoading,
    String? errorMessage,
  }) {
    return BookingFlowState(
      draftBookingId: draftBookingId ?? this.draftBookingId,
      selectedService: selectedService ?? this.selectedService,
      issueTags: issueTags ?? this.issueTags,
      description: description ?? this.description,
      mediaUrls: mediaUrls ?? this.mediaUrls,
      contactNumber: contactNumber ?? this.contactNumber,
      selectedAddress: selectedAddress ?? this.selectedAddress,
      selectedSlot: selectedSlot ?? this.selectedSlot,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

final bookingFlowProvider = StateNotifierProvider<BookingFlowNotifier, BookingFlowState>((ref) {
  return BookingFlowNotifier();
});

class BookingFlowNotifier extends StateNotifier<BookingFlowState> {
  BookingFlowNotifier() : super(const BookingFlowState());

  void setService(SubServiceModel service) {
    state = state.copyWith(selectedService: service);
  }

  void setAddress(AddressModel address) {
    state = state.copyWith(selectedAddress: address);
  }

  void setSlot(TimeSlotModel slot) {
    state = state.copyWith(selectedSlot: slot);
  }

  void setIssueTags(List<String> tags) {
    state = state.copyWith(issueTags: tags);
  }

  void setDescription(String description) {
    state = state.copyWith(description: description);
  }

  void setContactNumber(String contactNumber) {
    state = state.copyWith(contactNumber: contactNumber);
  }

  void setMediaUrls(List<String> urls) {
    state = state.copyWith(mediaUrls: urls);
  }

  void setDraftBookingId(String id) {
    state = state.copyWith(draftBookingId: id);
  }

  Future<void> createDraftBooking(BookingRepository repo) async {
    if (state.selectedService == null || state.selectedAddress == null || state.selectedSlot == null) {
      throw Exception('Missing required booking details');
    }
    
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final slot = state.selectedSlot!;
      // scheduledSlot must be 'HH:MM-HH:MM' in 24-hour format
      final scheduledSlot = '${_to24h(slot.startTime)}-${_to24h(slot.endTime)}';
      // scheduledDate must be 'YYYY-MM-DD'
      final scheduledDate = slot.date.toIso8601String().split('T').first;

      final payload = {
        'subServiceId': state.selectedService!.id,
        'addressId': state.selectedAddress!.id,
        'scheduledDate': scheduledDate,
        'scheduledSlot': scheduledSlot,
        'description': state.description,
      };
      
      final draft = await repo.createDraft(payload);
      state = state.copyWith(draftBookingId: draft.id, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      rethrow;
    }
  }

  void clearFlow() {
    state = const BookingFlowState();
  }

  /// Converts a display time like '9:00 AM' or '1:00 PM' to '09:00' or '13:00'
  static String _to24h(String displayTime) {
    final clean = displayTime.trim();
    final isPm = clean.toUpperCase().contains('PM');
    final isAm = clean.toUpperCase().contains('AM');
    final timePart = clean.replaceAll(RegExp(r'[APMapm\s]'), '');
    final parts = timePart.split(':');
    int hour = int.tryParse(parts[0]) ?? 0;
    final minute = parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0;
    if (isPm && hour != 12) hour += 12;
    if (isAm && hour == 12) hour = 0;
    return '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
  }
}
