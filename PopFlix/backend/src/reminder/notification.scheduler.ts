import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RemindersService } from './reminder.service';
import { MovieService } from '../movie/movie.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class NotificationScheduler {
  constructor(
    private remindersService: RemindersService,
    private moviesService: MovieService,
    private notificationService: NotificationService,
  ) {}

  @Cron('0 9 * * *')
  async checkReleasesAndNotify() {
    const pendingReminders = await this.remindersService.getPendingReminders();

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    for (const reminder of pendingReminders) {
      const movieResult = await this.moviesService.findOne(
        Number(reminder.movieId),
      );
      const movie = movieResult?.movie;

      if (!movie) continue;

      const releaseDate = new Date(movie.release_date);

      const isReleasingTomorrow =
        releaseDate.getDate() === tomorrow.getDate() &&
        releaseDate.getMonth() === tomorrow.getMonth() &&
        releaseDate.getFullYear() === tomorrow.getFullYear();

      if (isReleasingTomorrow) {
        await this.remindersService.sendReminderEmail(reminder.userId, movie);

        try {
          await this.notificationService.createNotification(
            Number(reminder.userId),
            'Movie Releasing Tomorrow!',
            `"${movie.title}" drops tomorrow! Click here to grab your early showtime tickets before they sell out.`, // Message
            'info',
            `/movies/${movie.id}`,
          );
        } catch (notifError) {
          console.error(
            `Failed to send real-time reminder for movie ${movie.id}:`,
            notifError,
          );
        }

        await this.remindersService.markAsNotified(reminder.id);
      }
    }
  }
}
