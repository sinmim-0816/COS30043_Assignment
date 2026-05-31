import { Controller, Get, Param } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get()
  async getAll() {
    return await this.experiencesService.findAll();
  }

  @Get(':key')
  async getByExperince(@Param('key') key: string) {
    return await this.experiencesService.findByExpKey(key);
  }
}
