import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Movie } from '../movie/entities/movie.entity';
import { Cinema } from '../cinemas/entities/cinema.entity';
import { Faq } from '../faqs/entities/faq.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Cinema, Faq])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
