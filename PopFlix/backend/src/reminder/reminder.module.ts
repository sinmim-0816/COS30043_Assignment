import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { RemindersService } from './reminder.service';
import { RemindersController } from './reminder.controller';
import { NotificationScheduler } from './notification.scheduler';
import { Reminder } from './entities/reminder.entity';
import { MoviesModule } from 'src/movie/movie.module';
import { NotificationModule } from 'src/notification/notification.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reminder]),
    UsersModule,
    MoviesModule,
    NotificationModule,
    EmailModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, NotificationScheduler],
  exports: [RemindersService],
})
export class ReminderModule {}
