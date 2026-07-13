import { Body, Controller, Param, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation,ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { PaymentService } from '../services/payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth()
  @Post('create-order/:bookingId')
  @ApiOperation({ summary: 'Create Razorpay order for a booking' })
  async createOrder(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.createOrder(bookingId, user.userId);
  }

  @ApiBearerAuth()
  @Post('verify')
  @ApiOperation({ summary: 'Verify payment after Razorpay checkout' })
  async verifyPayment(@Body() body: any) {
    // TODO: Add proper DTO
    return this.paymentService.verifyPayment(body);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    // TODO: Implement webhook signature verification and processing via BullMQ
    return { received: true };
  }
}
