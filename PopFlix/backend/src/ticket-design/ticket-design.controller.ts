import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { TicketDesignService } from './ticket-design.service';
import { CreateTicketDesignDto } from './dto/create-ticket-design.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ticket-design')
export class TicketDesignController {
  constructor(private readonly ticketDesignService: TicketDesignService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() createTicketDesignDto: CreateTicketDesignDto) {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.ticketDesignService.createNewDesign(
      userId,
      createTicketDesignDto,
    );
  }

  @Get(':bookingId')
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.ticketDesignService.findAllByBookingId(bookingId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  findAllMyDesigns(@Req() req) {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.ticketDesignService.findAllByUserId(userId);
  }
}
