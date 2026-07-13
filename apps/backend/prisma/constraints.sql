-- ============================================================
-- FixHub — Post-Migration Constraints & Partial Indexes
-- 
-- These constraints cannot be expressed in Prisma schema and
-- must be applied AFTER prisma migrate dev generates the base.
--
-- Run: pnpm prisma db execute --file prisma/constraints.sql
-- ============================================================

-- ── CHECK CONSTRAINTS ───────────────────────────────────────

-- Review rating must be 1–5
ALTER TABLE reviews
  ADD CONSTRAINT chk_reviews_rating
  CHECK (rating >= 1 AND rating <= 5);

-- SubService base_price must be non-negative
ALTER TABLE sub_services
  ADD CONSTRAINT chk_sub_services_base_price
  CHECK (base_price >= 0);

-- SubService estimated_duration_mins must be positive
ALTER TABLE sub_services
  ADD CONSTRAINT chk_sub_services_duration
  CHECK (estimated_duration_mins > 0);

-- Booking total_amount must be non-negative
ALTER TABLE bookings
  ADD CONSTRAINT chk_bookings_total_amount
  CHECK (total_amount >= 0);

-- Payment amount must be positive
ALTER TABLE payments
  ADD CONSTRAINT chk_payments_amount
  CHECK (amount > 0);

-- PaymentTransaction amount must be positive
ALTER TABLE payment_transactions
  ADD CONSTRAINT chk_payment_transactions_amount
  CHECK (amount > 0);

-- Technician rating must be 0.00–5.00
ALTER TABLE technicians
  ADD CONSTRAINT chk_technicians_rating
  CHECK (rating >= 0 AND rating <= 5);

-- Technician total_jobs must be non-negative
ALTER TABLE technicians
  ADD CONSTRAINT chk_technicians_total_jobs
  CHECK (total_jobs >= 0);

-- ── PARTIAL INDEXES ─────────────────────────────────────────
-- These exclude soft-deleted records for faster active-record queries.

-- Active users only (exclude soft-deleted)
CREATE INDEX IF NOT EXISTS idx_users_active
  ON users (role, is_active)
  WHERE deleted_at IS NULL;

-- Active addresses only
CREATE INDEX IF NOT EXISTS idx_addresses_active
  ON addresses (customer_id, is_default)
  WHERE deleted_at IS NULL;

-- Active categories only
CREATE INDEX IF NOT EXISTS idx_categories_active
  ON categories (sort_order)
  WHERE deleted_at IS NULL AND is_active = true;

-- Active sub-services only
CREATE INDEX IF NOT EXISTS idx_sub_services_active
  ON sub_services (category_id, sort_order)
  WHERE deleted_at IS NULL AND is_active = true;

-- Active service areas only
CREATE INDEX IF NOT EXISTS idx_service_areas_active
  ON service_areas (city)
  WHERE deleted_at IS NULL AND is_active = true;

-- Active technicians only (verified + available)
CREATE INDEX IF NOT EXISTS idx_technicians_verified_available
  ON technicians (is_available)
  WHERE deleted_at IS NULL AND verification_status = 'VERIFIED';

-- Unread notifications (for badge count queries)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- Non-revoked, non-expired refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_valid
  ON refresh_tokens (user_id)
  WHERE is_revoked = false AND expires_at > NOW();
