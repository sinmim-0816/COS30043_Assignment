import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { RemindersService } from './reminder.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('check/:movieId')
  @UseGuards(JwtAuthGuard)
  async checkReminder(
    @Req() req: Request & { user?: { userId?: number; email?: string } },
    @Param('movieId') movieId: string,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    const reminder = await this.remindersService.findByUserAndMovie(userId, movieId);
    return { exists: Boolean(reminder) };
  }

  @Post(':movieId')
  @UseGuards(JwtAuthGuard)
  async setReminder(
    @Req() req: Request & { user?: { userId?: number; email?: string } },
    @Param('movieId') movieId: string,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return await this.remindersService.create(userId, movieId);
  }
}
