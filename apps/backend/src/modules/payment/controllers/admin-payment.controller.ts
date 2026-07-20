import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../../common/decorators/roles.decorator';
import { RefundPaymentDto } from '../dto';
import { PaymentService } from '../services/payment.service';

@ApiTags('Admin Payments')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/payments')
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a captured payment' })
  @ApiParam({ name: 'id', description: 'Payment id' })
  async refundPayment(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentService.refundPayment(id, dto);
  }
}
