import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { BookingsService } from '../bookings/bookings.service';
import { UsersService } from '../users/users.service';
import { BookingStatus } from '../enum/BookingStatus';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class PaymentsService {
  constructor(
    private bookingsService: BookingsService,
    private usersService: UsersService,
    private mailerService: MailerService,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private notificationService: NotificationService,
  ) {}

  async processPayment(
    userId: number,
    dto: { bookingId: number; transactionId: string; paymentMethod: string },
  ) {
    const booking = await this.bookingsService.findPendingBooking(
      dto.bookingId,
    );

    if (
      !booking ||
      booking.status !== BookingStatus.PENDING ||
      new Date() > booking.expiresAt
    ) {
      throw new BadRequestException('Booking has expired or is invalid.');
    }

    const existingPayment = await this.paymentRepo.findOne({
      where: { booking: { id: booking.id } },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already processed');
    }

    const payment = this.paymentRepo.create({
      amount: booking.totalPrice,
      booking: { id: booking.id },
      paymentMethod: dto.paymentMethod,
    });

    await this.paymentRepo.save(payment);

    await this.bookingsService.markAsPaid(booking.id);

    await this.usersService.addPoints(userId, booking.pointsEarned);
    await this.usersService.updateTotalSpent(userId, booking.totalPrice);
    try {
      const movieTitle = booking.showtime?.movie?.title || 'your movie';
      await this.notificationService.createNotification(
        userId,
        'Ticket Confirmed!',
        `Your payment for "${movieTitle}" was successful. Your seats are locked in!`,
        'success',
        '/my-tickets',
      );
    } catch (notifError) {
      console.error('Failed to dispatch booking notification:', notifError);
    }
    const bookingDate = new Date(booking.showtime.start_time);
    try {
      await this.mailerService.sendMail({
        to: booking.user.email,
        subject: 'Your PopFlix Booking Confirmation',
        template: './booking-confirmation',
        context: {
          name: booking.user.firstName,
          movieTitle: booking.showtime.movie.title,
          time: bookingDate.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
          seats: booking.tickets.map((s) => s.seatNumber).join(', '),
          location: booking.showtime.cinema.name,
          totalPrice: booking.totalPrice,
        },
      });
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }
    return {
      message: 'Payment successful, tickets confirmed!',
    };
  }
}
