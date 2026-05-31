import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { UsersModule } from '../users/users.module';
import { RemindersService } from './reminder.service';
import { RemindersController } from './reminder.controller';
import { NotificationScheduler } from './notification.scheduler';
import { Reminder } from './entities/reminder.entity';
import { MoviesModule } from 'src/movie/movie.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reminder]),
    MailerModule,
    UsersModule,
    MoviesModule,
    NotificationModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, NotificationScheduler],
  exports: [RemindersService],
})
export class ReminderModule {}
