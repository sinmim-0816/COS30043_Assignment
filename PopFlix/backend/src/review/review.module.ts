import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Review } from './entities/review.entity';
import { Movie } from '../movie/entities/movie.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Movie]), NotificationModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
