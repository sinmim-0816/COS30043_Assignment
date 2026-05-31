import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketDesignService } from './ticket-design.service';
import { TicketDesignController } from './ticket-design.controller';
import { TicketDesign } from './entities/ticket-design.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([TicketDesign]), NotificationModule],
  controllers: [TicketDesignController],
  providers: [TicketDesignService],
  exports: [TicketDesignService],
})
export class TicketDesignModule {}
