-- CreateEnum
CREATE TYPE "JobOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PRICE_REVISION_PENDING';

-- AlterTable
ALTER TABLE "booking_media" ADD COLUMN     "duration_seconds" INTEGER;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "customer_consent_at" TIMESTAMP(3),
ADD COLUMN     "price_revision_note" TEXT,
ADD COLUMN     "revised_amount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "job_offers" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "technician_id" UUID NOT NULL,
    "status" "JobOfferStatus" NOT NULL DEFAULT 'PENDING',
    "offered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_service_areas" (
    "id" UUID NOT NULL,
    "sub_service_id" UUID NOT NULL,
    "service_area_id" UUID NOT NULL,

    CONSTRAINT "sub_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_offers_technician_id_status_idx" ON "job_offers"("technician_id", "status");

-- CreateIndex
CREATE INDEX "job_offers_booking_id_status_idx" ON "job_offers"("booking_id", "status");

-- CreateIndex
CREATE INDEX "job_offers_expires_at_idx" ON "job_offers"("expires_at");

-- CreateIndex
CREATE INDEX "sub_service_areas_service_area_id_idx" ON "sub_service_areas"("service_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "sub_service_areas_sub_service_id_service_area_id_key" ON "sub_service_areas"("sub_service_id", "service_area_id");

-- AddForeignKey
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technicians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_service_areas" ADD CONSTRAINT "sub_service_areas_sub_service_id_fkey" FOREIGN KEY ("sub_service_id") REFERENCES "sub_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_service_areas" ADD CONSTRAINT "sub_service_areas_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "service_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
