import { Body, Controller, Get, Headers, Param, Post, Query, RawBodyRequest, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import {
  CreatePaymentOrderDto,
  PaymentHistoryQueryDto,
  RefundPaymentDto,
  VerifyPaymentDto,
} from '../dto';
import { PaymentService } from '../services/payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth()
  @Post('create-order/:bookingId')
  @ApiOperation({ summary: 'Create Razorpay order for a booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking id' })
  @ApiResponse({ status: 201, description: 'Razorpay order created' })
  async createOrder(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.paymentService.createOrder(bookingId, user.userId, dto);
  }

  @ApiBearerAuth()
  @Post('verify')
  @ApiOperation({ summary: 'Verify and capture Razorpay payment' })
  @ApiResponse({ status: 201, description: 'Payment verified' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.CUSTOMER)
  @Post('revision-order/:bookingId')
  @ApiOperation({
    summary: 'Create a Razorpay order for the price-revision delta (customer must pay the difference)',
  })
  @ApiParam({ name: 'bookingId', description: 'Booking id' })
  @ApiResponse({ status: 201, description: 'Revision order created or no payment required' })
  async createRevisionOrder(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.createRevisionOrder(bookingId, user.userId);
  }

  @ApiBearerAuth()
  @Get('history')
  @ApiOperation({ summary: 'Get payment history for current customer' })
  async history(@CurrentUser() user: AuthenticatedUser, @Query() query: PaymentHistoryQueryDto) {
    return this.paymentService.history(user.userId, query);
  }

  @ApiBearerAuth()
  @Get(':paymentId/invoice')
  @ApiOperation({ summary: 'Get payment invoice data' })
  @ApiParam({ name: 'paymentId', description: 'Payment id' })
  async invoice(@Param('paymentId') paymentId: string) {
    return this.paymentService.getInvoice(paymentId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post(':paymentId/refund')
  @ApiOperation({ summary: 'Refund captured payment' })
  @ApiParam({ name: 'paymentId', description: 'Payment id' })
  @ApiResponse({ status: 201, description: 'Refund requested' })
  async refund(@Param('paymentId') paymentId: string, @Body() dto: RefundPaymentDto) {
    return this.paymentService.refundPayment(paymentId, dto);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    return this.paymentService.enqueueWebhook(req.rawBody ?? JSON.stringify(req.body), signature);
  }
}
