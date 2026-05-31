import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ExperiencesModule } from './experiences/experiences.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { CinemasModule } from './cinemas/cinemas.module';
import { MoviesModule } from './movie/movie.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { TicketModule } from './ticket/ticket.module';
import { ReviewModule } from './review/review.module';
import { FaqsModule } from './faqs/faqs.module';
import { TicketDesignModule } from './ticket-design/ticket-design.module';
import { SearchModule } from './search/search.module';
import { ReminderModule } from './reminder/reminder.module';
import { NotificationModule } from './notification/notification.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = config.get<string>('DATABASE_URL');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: true,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: parseInt(config.get<string>('DB_PORT') ?? '5432', 10),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    ExperiencesModule,
    ShowtimesModule,
    CinemasModule,
    MoviesModule,
    UsersModule,
    AuthModule,
    VehiclesModule,
    BookingsModule,
    PaymentsModule,
    TicketModule,
    ReviewModule,
    FaqsModule,
    TicketDesignModule,
    SearchModule,
    ReminderModule,
    NotificationModule,
    EmailModule,
  ],
})
export class AppModule {}
