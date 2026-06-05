import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiDesignService } from './ai-design.service';
import { GenerateTicketDesignDto } from './dto/generate-ticket-design.dto';

@Controller('ai-design')
export class AiDesignController {
  constructor(private readonly aiDesignService: AiDesignService) {}

  @UseGuards(JwtAuthGuard)
  @Post('ticket')
  generateTicketDesign(@Body() dto: GenerateTicketDesignDto) {
    return this.aiDesignService.generateTicketDesign(dto);
  }
}
