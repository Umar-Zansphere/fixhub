class TimeSlotModel {
  const TimeSlotModel({
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.isAvailable,
  });

  final DateTime date;
  final String startTime;
  final String endTime;
  final bool isAvailable;

  String get formattedTime => '$startTime - $endTime';

  // For testing/mocking since the API doesn't exist yet
  static List<TimeSlotModel> getMockSlots(DateTime date) {
    return [
      TimeSlotModel(date: date, startTime: '09:00 AM', endTime: '11:00 AM', isAvailable: true),
      TimeSlotModel(date: date, startTime: '11:00 AM', endTime: '01:00 PM', isAvailable: true),
      TimeSlotModel(date: date, startTime: '02:00 PM', endTime: '04:00 PM', isAvailable: false),
      TimeSlotModel(date: date, startTime: '04:00 PM', endTime: '06:00 PM', isAvailable: true),
    ];
  }
}
