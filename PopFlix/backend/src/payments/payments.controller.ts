import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  processPayment(
    @Request() req,
    @Body()
    dto: {
      bookingId: number;
      transactionId: string;
      paymentMethod: string;
    },
  ) {
    return this.paymentsService.processPayment(req.user.userId, dto);
  }
}
