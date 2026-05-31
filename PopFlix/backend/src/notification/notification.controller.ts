import {
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Delete,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  findAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('search') search?: string,
  ) {
    return this.notificationService.findAllByUser(userId, search);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('user/:userId/read-all')
  markAllRead(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationService.markAllAllAsRead(userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.remove(id);
  }
}
