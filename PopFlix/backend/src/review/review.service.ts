import { NotificationService } from 'src/notification/notification.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Movie } from '../movie/entities/movie.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createReviewDto: any) {
    const review = this.reviewRepository.create(createReviewDto) as any;
    const savedReview = (await this.reviewRepository.save(review)) as any;
    try {
      const userId = createReviewDto.userId || createReviewDto.user?.id || savedReview.user?.id;

      if (userId) {
        const reviewTitle = savedReview.title
          ? `"${savedReview.title}"`
          : 'Your review';

        await this.notificationService.createNotification(
          Number(userId),
          'Review Published!',
          `${reviewTitle} was posted successfully. Thank you for your feedback!`,
          'success',
          '/profile?tab=Reviews',
        );
      }
    } catch (notifError) {
      console.error(
        'Failed to dispatch review creation notification:',
        notifError,
      );
    }
    return savedReview;
  }

  async findAllByMovie(movieId: string) {
    const parsedMovieId = parseInt(movieId, 10);
    if (Number.isNaN(parsedMovieId)) {
      return [];
    }

    const movie = await this.movieRepository.findOne({
      where: { tmdb_id: parsedMovieId },
      select: ['id'],
    });

    if (!movie) {
      return [];
    }

    return await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.user', 'user')
      .innerJoin('review.booking', 'booking')
      .where(
        'booking.showtimeId IN (SELECT s.id FROM showtimes s WHERE s.movie_id = :movieId)',
        { movieId: movie.id },
      )
      .orderBy('review.createdAt', 'DESC')
      .getMany();
  }

  async findAllByUser(userId: string) {
    const parsedUserId = parseInt(userId, 10);
    if (Number.isNaN(parsedUserId)) return [];

    return await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.user', 'user')
      .innerJoinAndSelect('review.booking', 'booking')
      .innerJoinAndSelect('booking.showtime', 'showtime')
      .innerJoinAndSelect('showtime.movie', 'movie')
      .where('user.id = :userId', { userId: parsedUserId })
      .orderBy('review.createdAt', 'DESC')
      .getMany();
  }

  async deleteReview(id: string) {
    const parsedId = parseInt(id, 10);
    const review = await this.reviewRepository.findOne({
      where: { id: parsedId },
    });

    if (!review) {
      throw new NotFoundException(
        `Review record targeting ID #${id} was not found.`,
      );
    }

    await this.reviewRepository.remove(review);
    return { success: true };
  }
}
