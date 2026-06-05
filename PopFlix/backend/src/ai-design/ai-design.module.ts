import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiDesignController } from './ai-design.controller';
import { AiDesignService } from './ai-design.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiDesignController],
  providers: [AiDesignService],
})
export class AiDesignModule {}
