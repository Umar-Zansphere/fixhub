import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiPropertyOptional({ example: 'checkout-uuid-from-client' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_Nabc123' })
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty({ example: 'pay_Nabc123' })
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty({ example: 'hex_signature' })
  @IsString()
  razorpaySignature!: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}

export class RefundPaymentDto {
  @ApiPropertyOptional({ example: 49900, description: 'Refund amount in paise. Defaults to full payment amount.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99_99_99_900)
  amountInPaise?: number;

  @ApiPropertyOptional({ example: 'Customer requested refund' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: 'refund-request-uuid' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
}

export class PaymentHistoryQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }
}
