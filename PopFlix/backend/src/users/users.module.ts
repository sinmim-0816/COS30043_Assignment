import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailerModule, NotificationModule, EmailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
