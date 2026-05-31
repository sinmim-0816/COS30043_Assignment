import { Module } from '@nestjs/common';
import { CinemasService } from './cinemas.service';
import { CinemasController } from './cinemas.controller';
import { Cinema } from './entities/cinema.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Cinema])],
  controllers: [CinemasController],
  providers: [CinemasService],
})
export class CinemasModule {}
