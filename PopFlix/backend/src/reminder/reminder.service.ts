import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Reminder } from './entities/reminder.entity';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(Reminder)
    private reminderRepo: Repository<Reminder>,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async create(userId: number, movieId: string) {
    const existing = await this.reminderRepo.findOne({
      where: { userId, movieId },
    });
    if (existing) return existing;

    return this.reminderRepo.save({ userId, movieId });
  }

  async findByUserAndMovie(userId: number, movieId: string) {
    return this.reminderRepo.findOne({
      where: { userId, movieId },
    });
  }

  async getPendingReminders() {
    return this.reminderRepo.find({ where: { isNotified: false } });
  }

  async markAsNotified(id: number) {
    await this.reminderRepo.update(id, { isNotified: true });
  }

  async sendReminderEmail(
    userId: number,
    movie: { id: string | number; title: string },
  ): Promise<void> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.email) {
      this.logger.warn(`Reminder email skipped: user ${userId} not found or missing email`);
      return;
    }

    const movieUrl = `https://popflix-frontend.onrender.com/movie/${String(movie.id)}`;

    await this.emailService.sendMail({
      to: user.email,
      subject: `PopFlix Reminder: ${movie.title} releases tomorrow!`,
      template: './reminder',
      context: {
        name: user.firstName || 'Movie Fan',
        movieTitle: movie.title,
        movieUrl: movieUrl,
      },
    });
  }
}
