import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  create(@Body() createReviewDto: any) {
    return this.reviewService.create(createReviewDto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.reviewService.findAllByUser(userId);
  }

  @Get(':movieId')
  findAll(@Param('movieId') movieId: string) {
    return this.reviewService.findAllByMovie(movieId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.reviewService.deleteReview(id);
  }
}
