import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../data/models/address_model.dart';
import '../../data/models/time_slot_model.dart';
import '../../../home/data/models/sub_service_model.dart';

class BookingFlowState {
  final SubServiceModel? selectedService;
  final AddressModel? selectedAddress;
  final TimeSlotModel? selectedSlot;
  final String? notes;
  final bool isLoading;
  final String? errorMessage;

  const BookingFlowState({
    this.selectedService,
    this.selectedAddress,
    this.selectedSlot,
    this.notes,
    this.isLoading = false,
    this.errorMessage,
  });

  BookingFlowState copyWith({
    SubServiceModel? selectedService,
    AddressModel? selectedAddress,
    TimeSlotModel? selectedSlot,
    String? notes,
    bool? isLoading,
    String? errorMessage,
  }) {
    return BookingFlowState(
      selectedService: selectedService ?? this.selectedService,
      selectedAddress: selectedAddress ?? this.selectedAddress,
      selectedSlot: selectedSlot ?? this.selectedSlot,
      notes: notes ?? this.notes,
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

  void setNotes(String notes) {
    state = state.copyWith(notes: notes);
  }

  void clearFlow() {
    state = const BookingFlowState();
  }
}
