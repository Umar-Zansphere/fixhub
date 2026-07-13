export enum Role {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum DocumentType {
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER',
}

export enum NotificationType {
  BOOKING_UPDATE = 'BOOKING_UPDATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  ASSIGNMENT = 'ASSIGNMENT',
  REVIEW = 'REVIEW',
  SYSTEM = 'SYSTEM',
  PROMOTIONAL = 'PROMOTIONAL',
}

export enum DevicePlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

export enum CancellationActor {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}
