# FixHub Architecture Document

## Overview

FixHub is a hyperlocal home services platform built as a monorepo with four independently deployable applications sharing common contracts.

## System Architecture

```
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  Customer App   │  │  Technician App  │  │   Admin Panel   │
│  (Flutter)      │  │  (Flutter)       │  │   (Next.js)     │
└────────┬────────┘  └────────┬─────────┘  └────────┬────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   REST API        │
                    │   /api/v1         │
                    ├───────────────────┤
                    │   NestJS Backend  │
                    ├───────────────────┤
                    │ ┌───────────────┐ │
                    │ │  Auth Module  │ │
                    │ │  Customer     │ │
                    │ │  Technician   │ │
                    │ │  Booking      │ │
                    │ │  Payment      │ │
                    │ │  Notification │ │
                    │ │  Admin        │ │
                    │ │  Reporting    │ │
                    │ └───────────────┘ │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼──────┐ ┌─────▼─────┐ ┌───────▼──────┐
     │  PostgreSQL   │ │   Redis   │ │   AWS S3     │
     │  (Data Store) │ │   (Cache) │ │  (Files)     │
     └───────────────┘ └─────┬─────┘ └──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │     BullMQ        │
                    │  (Job Queues)     │
                    ├───────────────────┤
                    │ • Notifications   │
                    │ • Email / SMS     │
                    │ • Payment Hooks   │
                    │ • Media Process   │
                    └───────────────────┘
```

## Design Principles

| Principle                | Implementation                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Clean Architecture**   | Controllers → Services → Repositories → Prisma                                             |
| **Feature-First**        | Each module is self-contained with its own controller, service, repository, DTOs           |
| **SOLID**                | Single responsibility per file, dependency injection via NestJS DI                         |
| **Repository Pattern**   | Database queries isolated in repositories, services don't touch Prisma directly            |
| **DTO Pattern**          | All input validated via class-validator DTOs, output shaped by services                    |
| **Consistent Responses** | Global response interceptor wraps all responses in `{ success, data, message, timestamp }` |
| **Async Processing**     | All non-critical work (notifications, emails, media) processed via BullMQ queues           |

## Authentication Flow

```
Customer/Technician App:
  1. POST /auth/otp/send { phone }
  2. OTP stored in Redis with 5-min TTL
  3. POST /auth/otp/verify { phone, otp, role }
  4. If new user → create User + Customer/Technician profile
  5. Return { accessToken (JWT, 15m), refreshToken (opaque, 7d) }
  6. POST /auth/refresh { refreshToken } → new token pair
  7. POST /auth/logout → revoke all refresh tokens

Admin:
  Same OTP flow but with role=ADMIN
```

## Booking Lifecycle

```
PENDING → CONFIRMED → TECHNICIAN_ASSIGNED → TECHNICIAN_EN_ROUTE → IN_PROGRESS → COMPLETED
     ↓                                                                              ↑
     └──────────────────── CANCELLED ──────────────────────────────────────────────┘

Each status change creates a BookingStatusHistory record.
```

## Data Flow (Example: Create Booking)

```
1. Customer App sends POST /bookings with DTO
2. BookingController validates DTO (class-validator pipe)
3. BookingController calls BookingService.create()
4. BookingService:
   a. Validates business rules (slot availability, service area)
   b. Creates booking via BookingRepository
   c. Queues notification via NotificationService (BullMQ)
   d. Returns booking data
5. ResponseInterceptor wraps in { success, data, message }
6. Customer App receives typed response
```

## Redis Usage

| Purpose       | Key Pattern                  | TTL  |
| ------------- | ---------------------------- | ---- |
| OTP Storage   | `otp:{phone}`                | 300s |
| OTP Attempts  | `otp_attempts:{phone}`       | 300s |
| Rate Limiting | `rate_limit:{ip}:{endpoint}` | 60s  |
| Booking Lock  | `booking_lock:{slotId}`      | 60s  |

## BullMQ Queues

| Queue              | Purpose                     | Retry          |
| ------------------ | --------------------------- | -------------- |
| `notification`     | FCM push + DB notification  | 3x exponential |
| `email`            | Transactional emails        | 3x exponential |
| `sms`              | OTP delivery                | 3x exponential |
| `payment-webhook`  | Razorpay webhook processing | 3x exponential |
| `media-processing` | Image/video optimization    | 3x exponential |
| `scheduled-jobs`   | Recurring tasks             | 3x exponential |

## S3 File Organization

```
fixhub-uploads/
├── bookings/{bookingId}/          # Customer-uploaded images/videos
├── technicians/{technicianId}/
│   ├── documents/                  # ID proofs, certificates
│   └── profile/                    # Profile pictures
├── customers/{customerId}/
│   └── profile/                    # Profile pictures
└── invoices/{bookingId}/           # Generated invoices
```

## API Versioning

- All routes prefixed with `/api/v1/`
- Future versions (`/api/v2/`) can coexist without breaking existing clients
- Breaking changes go in new version; additive changes stay in current version

## Future Scalability

| Expansion                      | Architecture Support                                       |
| ------------------------------ | ---------------------------------------------------------- |
| **Multi-city**                 | ServiceArea model with city/state; filter by pincode       |
| **New service categories**     | Category → SubService hierarchy; add via admin panel       |
| **Multiple technician skills** | TechnicianServiceArea join table; extensible               |
| **Coupons/Discounts**          | Add Coupon model, apply in BookingService                  |
| **Live tracking**              | Add WebSocket gateway module to NestJS                     |
| **AI recommendations**         | Add Recommendation module consuming booking history        |
| **Multi-language**             | i18n keys in responses; Flutter/Next.js handle translation |

## Error Handling Strategy

```
Backend:
  GlobalExceptionFilter catches ALL errors
  → Maps to { success: false, message, errorCode, errors, timestamp }
  → 5xx errors logged with stack trace
  → 4xx errors logged as warnings

Flutter:
  ErrorInterceptor catches Dio errors
  → Maps to sealed Failure classes (NetworkFailure, AuthFailure, etc.)
  → Presentation layer handles Failure display

Admin:
  Axios interceptor catches errors
  → Shows toast notifications via Sonner
  → 401 redirects to login
```
