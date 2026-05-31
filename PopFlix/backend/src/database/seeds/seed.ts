import { DataSource } from 'typeorm';
import { Experience } from '../../experiences/entities/experience.entity';
import { Cinema } from '../../cinemas/entities/cinema.entity';
import { Showtime } from '../../showtimes/entities/showtime.entity';
import { MovieSeedService } from '../../movie/MovieSeedService';
import { Movie } from '../../movie/entities/movie.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { BookingStatus } from '../../enum/BookingStatus';
import { MembershipTier } from '../../enum/MembershipTier';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { TicketDesign } from '../../ticket-design/entities/ticket-design.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { User } from '../../users/entities/user.entity';
import { Review } from '../../review/entities/review.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Faq } from '../../faqs/entities/faq.entity';
import moment from 'moment';
import * as bcrypt from 'bcrypt';

import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    Experience,
    Cinema,
    Showtime,
    Movie,
    User,
    Vehicle,
    Booking,
    TicketDesign,
    Ticket,
    Payment,
    Review,
    Notification,
    Faq,
  ],
  synchronize: true,
  dropSchema: true,
});

async function runSeed() {
  try {
    console.log('Initializing Data Source...');

    if (!process.env.DB_HOST) {
      throw new Error('Could not find DB_HOST in .env file!');
    }

    await AppDataSource.initialize();

    const expRepo = AppDataSource.getRepository(Experience);
    const cinemaRepo = AppDataSource.getRepository(Cinema);
    const movieRepo = AppDataSource.getRepository(Movie);
    const showtimeRepo = AppDataSource.getRepository(Showtime);

    console.log('Cleaning up old data...');
    await AppDataSource.query(`TRUNCATE TABLE "showtimes" RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "cinemas" RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "movie_experience" RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "movies" RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "vehicles" RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "tickets" RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "payments" RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "bookings" RESTART IDENTITY CASCADE`);

    await AppDataSource.query(`TRUNCATE TABLE "reviews" RESTART IDENTITY CASCADE`);

    await AppDataSource.query(`TRUNCATE TABLE "faqs" RESTART IDENTITY CASCADE`);

    console.log('Seeding Users & Vehicles...');
    const userRepo = AppDataSource.getRepository(User);
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const hashedPass = await bcrypt.hash('Password123!', 10);

    const users = await userRepo.save([
      {
        firstName: 'Fam',
        lastName: 'Sin Mim',
        email: 'janefam88@gmail.com',
        password: hashedPass,
        loyaltyPoints: 0,
        membershipTier: MembershipTier.BRONZE,
        phone: '0163548926',
        isVerified: true,
        location: 'Sarawak',
        gender: 'Male',
        bio: 'Avid moviegoer and regular tech stack builder. Always looking forward to upcoming sci-fi releases.',
        favouriteGenres: ['Sci-Fi', 'Action', 'Thriller'],
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@popflix.com',
        password: hashedPass,
        loyaltyPoints: 500,
        membershipTier: MembershipTier.BRONZE,
        phone: '0163548926',
        isVerified: true,
        location: 'Kuala Lumpur',
        gender: 'Male',
        bio: 'Just looking for a good bucket of popcorn and a mind-bending thriller.',
        favouriteGenres: ['Thriller', 'Mystery'],
      },
      {
        firstName: 'Alice',
        lastName: 'Tan',
        email: 'alice.tan@example.com',
        password: hashedPass,
        loyaltyPoints: 1200,
        membershipTier: MembershipTier.BRONZE,
        phone: '0163548926',
        isVerified: true,
        location: 'Penang',
        gender: 'Female',
        bio: 'Die-hard Marvel fanatic and cinematic score enthusiast.',
        favouriteGenres: ['Action', 'Adventure', 'Fantasy'],
      },
      {
        firstName: 'Michael',
        lastName: 'Lee',
        email: 'michael.lee@example.com',
        password: hashedPass,
        loyaltyPoints: 2000,
        membershipTier: MembershipTier.BRONZE,
        phone: '0163548926',
        isVerified: true,
        location: 'Selangor',
        gender: 'Male',
        bio: 'Weekend film critic. Nothing beats a well-written indie drama.',
        favouriteGenres: ['Drama', 'Crime'],
      },
      {
        firstName: 'Sophia',
        lastName: 'Ng',
        email: 'sophia.ng@example.com',
        password: hashedPass,
        loyaltyPoints: 50,
        membershipTier: MembershipTier.BRONZE,
        phone: '0163548926',
        isVerified: true,
        location: 'Sarawak',
        gender: 'Female',
        bio: 'I love watching horror movies in a packed theater just for the collective scares!',
        favouriteGenres: ['Horror', 'Thriller'],
      },
      {
        firstName: 'David',
        lastName: 'Chan',
        email: 'david.chan@example.com',
        password: hashedPass,
        loyaltyPoints: 2000,
        membershipTier: MembershipTier.BRONZE,
        phone: '0163548926',
        isVerified: true,
        location: 'Sabah',
        gender: 'Male',
        bio: 'If it features lightspeed travel or futuristic worlds, count me in.',
        favouriteGenres: ['Sci-Fi', 'Adventure'],
      },
      {
        firstName: 'Emily',
        lastName: 'Wong',
        email: 'emily.wong@example.com',
        password: hashedPass,
        loyaltyPoints: 750,
        membershipTier: MembershipTier.BRONZE,
        phone: '0163548926',
        isVerified: true,
        location: 'Johor',
        gender: 'Female',
        bio: 'Hopeless romantic who cries at every rom-com premiere.',
        favouriteGenres: ['Romance', 'Comedy', 'Drama'],
      },
    ]);

    await vehicleRepo.save([
      {
        model: 'Proton X50',
        plateNumber: 'QAA 1234 A',
        color: '#448aff',
        user: users[0],
      },
      {
        model: 'Honda Civic',
        plateNumber: 'KAA 9999',
        color: '#ffffff',
        user: users[0],
      },

      {
        model: 'Toyota Corolla',
        plateNumber: 'SBA 4321 B',
        color: '#ff5252',
        user: users[1],
      },

      {
        model: 'Mazda CX-5',
        plateNumber: 'QBB 5678 C',
        color: '#4caf50',
        user: users[2],
      },

      {
        model: 'Perodua Myvi',
        plateNumber: 'KBB 8888 D',
        color: '#ffeb3b',
        user: users[3],
      },

      {
        model: 'BMW 3 Series',
        plateNumber: 'WAA 2222 E',
        color: '#9c27b0',
        user: users[4],
      },

      {
        model: 'Mercedes-Benz C200',
        plateNumber: 'JAA 7777 F',
        color: '#03a9f4',
        user: users[5],
      },

      {
        model: 'Nissan Almera',
        plateNumber: 'LAA 5555 G',
        color: '#795548',
        user: users[6],
      },
    ]);

    console.log('Seeding Movies...');
    const movieSeedService = new MovieSeedService(movieRepo);
    await movieSeedService.seedFromTmdb();

    console.log('Seeding Experiences...');
    const experienceData = [
      {
        exp_key: 'IMAX',
        title: 'Colossal Screen',
        subtitle: 'Expanded Aspect Ratio',
        description: 'Experience 26% more picture with our massive high-resolution screens.',
        image_url: '/img/imax-1.jpg',
        order_index: 1,
        price_premium: 12.0,
      },
      {
        exp_key: 'IMAX',
        title: '4K Laser',
        subtitle: 'Dual Projection',
        description: 'Sharper, brighter, and more vivid images than a standard cinema.',
        image_url: '/img/imax-2.jpg',
        order_index: 2,
        price_premium: 12.0,
      },
      {
        exp_key: 'IMAX',
        title: 'Precision Audio',
        subtitle: '12-Channel Sound',
        description: 'Immersive audio that lets you hear everything from a whisper to a roar.',
        image_url: '/img/imax-3.jpg',
        order_index: 3,
        price_premium: 12.0,
      },
      {
        exp_key: 'IMAX',
        title: 'Director Choice',
        subtitle: 'Filmmaker Intent',
        description: 'The exact way the director wanted you to see their blockbuster masterpiece.',
        image_url: '/img/imax-4.jpg',
        order_index: 4,
        price_premium: 12.0,
      },

      // DOLBY
      {
        exp_key: 'DOLBY',
        title: 'Vivid Vision',
        subtitle: 'HDR Excellence',
        description: 'Contrast and colors that reveal details you never knew were there.',
        image_url: '/img/dolby-1.jpg',
        order_index: 1,
        price_premium: 8.0,
      },
      {
        exp_key: 'DOLBY',
        title: 'Moving Audio',
        subtitle: 'Dolby Atmos',
        description: 'Sound that moves around you in 3D space, even from above your head.',
        image_url: '/img/dolby-2.jpg',
        order_index: 2,
        price_premium: 8.0,
      },
      {
        exp_key: 'DOLBY',
        title: 'Signature Entry',
        subtitle: 'Blue Path',
        description: 'A dramatic entrance that prepares you for a superior cinematic world.',
        image_url: '/img/dolby-3.jpg',
        order_index: 3,
        price_premium: 8.0,
      },
      {
        exp_key: 'DOLBY',
        title: 'Deepest Blacks',
        subtitle: 'OLED Contrast',
        description: 'True black levels that make every color pop with cinematic realism.',
        image_url: '/img/dolby-4.jpg',
        order_index: 4,
        price_premium: 8.0,
      },

      // 4DX
      {
        exp_key: '4DX',
        title: 'Motion Seats',
        subtitle: 'Synchronized Movement',
        description: 'Seats that heave, roll, and pitch in perfect sync with the on-screen action.',
        image_url: '/img/4dx-1.jpg',
        order_index: 1,
        price_premium: 15.0,
      },
      {
        exp_key: '4DX',
        title: 'Environment',
        subtitle: 'Multi-Sensory',
        description: 'Realistic wind, fog, lightning, and scents that bring the movie to life.',
        image_url: '/img/4dx-2.jpg',
        order_index: 2,
        price_premium: 15.0,
      },
      {
        exp_key: '4DX',
        title: 'Atmosphere',
        subtitle: 'Rain & Snow',
        description: 'Get closer to the elements with weather effects inside the auditorium.',
        image_url: '/img/4dx-3.jpg',
        order_index: 3,
        price_premium: 15.0,
      },
      {
        exp_key: '4DX',
        title: 'Total Immersion',
        subtitle: 'Sensory Journey',
        description: 'A revolutionary way to experience movies using all five of your senses.',
        image_url: '/img/4dx-4.jpg',
        order_index: 4,
        price_premium: 15.0,
      },

      // LUXE
      {
        exp_key: 'LUXE',
        title: 'Premium Style',
        subtitle: 'Exclusive Design',
        description: 'A sophisticated environment designed for the most discerning film lovers.',
        image_url: '/img/luxe-1.jpg',
        order_index: 1,
        price_premium: 5.0,
      },
      {
        exp_key: 'LUXE',
        title: 'Extra Legroom',
        subtitle: 'Spacious Seating',
        description: 'Stretch out and enjoy your film with significantly more space per person.',
        image_url: '/img/luxe-2.jpg',
        order_index: 2,
        price_premium: 5.0,
      },
      {
        exp_key: 'LUXE',
        title: 'Crisp Sound',
        subtitle: 'Acoustic Clarity',
        description: 'Every seat is tuned for perfect acoustics and crystal clear dialogue.',
        image_url: '/img/luxe-3.jpg',
        order_index: 3,
        price_premium: 5.0,
      },
      {
        exp_key: 'LUXE',
        title: 'Elegant Bar',
        subtitle: 'Pre-Show Drinks',
        description: 'Enjoy a selection of fine beverages and snacks before your feature begins.',
        image_url: '/img/luxe-4.jpg',
        order_index: 4,
        price_premium: 5.0,
      },

      // INDULGE
      {
        exp_key: 'INDULGE',
        title: 'Fine Dining',
        subtitle: 'Chef-Prepared',
        description: 'Gourmet meals delivered to your seat so you never miss a moment.',
        image_url: '/img/indulge-1.jpg',
        order_index: 1,
        price_premium: 5.0,
      },
      {
        exp_key: 'INDULGE',
        title: 'Full Recline',
        subtitle: 'Leather Luxury',
        description: 'Adjust your plush leather seat to the perfect angle for total relaxation.',
        image_url: '/img/indulge-2.jpg',
        order_index: 2,
        price_premium: 5.0,
      },
      {
        exp_key: 'INDULGE',
        title: 'Personal Service',
        subtitle: 'At Your Command',
        description: 'A dedicated call button for service whenever you need a refreshment.',
        image_url: '/img/indulge-3.jpg',
        order_index: 3,
        price_premium: 5.0,
      },
      {
        exp_key: 'INDULGE',
        title: 'Boutique Hall',
        subtitle: 'Quiet Atmosphere',
        description: 'An intimate theater setting with limited seating for a private feel.',
        image_url: '/img/indulge-4.jpg',
        order_index: 4,
        price_premium: 5.0,
      },

      // BEANIE
      {
        exp_key: 'BEANIE',
        title: 'Cloud Comfort',
        subtitle: 'Bean Bag Seating',
        description: 'Sink into our giant, cozy bean bags for the most relaxed viewing ever.',
        image_url: '/img/beanie-1.jpg',
        order_index: 1,
        price_premium: 10.0,
      },
      {
        exp_key: 'BEANIE',
        title: 'Social Cinema',
        subtitle: 'Casual Vibes',
        description: 'The perfect atmosphere for hanging out with friends while you watch.',
        image_url: '/img/beanie-2.jpg',
        order_index: 2,
        price_premium: 10.0,
      },
      {
        exp_key: 'BEANIE',
        title: 'Snack Heaven',
        subtitle: 'Popcorn & More',
        description: 'Specialized snack combos designed for the ultimate comfort movie night.',
        image_url: '/img/beanie-3.jpg',
        order_index: 3,
        price_premium: 10.0,
      },
      {
        exp_key: 'BEANIE',
        title: 'Cozy Lighting',
        subtitle: 'Soft Ambiance',
        description: 'A warm, inviting theater design that makes you feel right at home.',
        image_url: '/img/beanie-4.jpg',
        order_index: 4,
        price_premium: 10.0,
      },

      // JUNIOR
      {
        exp_key: 'JUNIOR',
        title: 'Play Zone',
        subtitle: 'In-Cinema Slide',
        description: 'Kids can play on the slide and in the ball pit before the movie starts.',
        image_url: '/img/junior-1.jpg',
        order_index: 1,
        price_premium: 5.0,
      },
      {
        exp_key: 'JUNIOR',
        title: 'Family Friendly',
        subtitle: 'Soft Lighting',
        description: 'Modified sound and light levels to keep the experience fun for little ones.',
        image_url: '/img/junior-2.jpg',
        order_index: 2,
        price_premium: 5.0,
      },
      {
        exp_key: 'JUNIOR',
        title: 'Colorful Seats',
        subtitle: 'Kid-Sized Comfort',
        description: 'Brightly colored, ergonomically designed seating just for children.',
        image_url: '/img/junior-3.jpg',
        order_index: 3,
        price_premium: 5.0,
      },
      {
        exp_key: 'JUNIOR',
        title: 'Intermission',
        subtitle: 'Stretch Break',
        description: 'Special breaks designed so kids can burn off energy halfway through.',
        image_url: '/img/junior-4.jpg',
        order_index: 4,
        price_premium: 5.0,
      },
    ];

    const cinemaData = [
      {
        slug: 'vivacity-mall',
        name: 'Popflix Vivacity Megamall',
        mall: 'Vivacity Megamall',
        image_path:
          'https://kygmgshzafyxfvilxbxo.supabase.co/storage/v1/object/public/cinema/viva.png',
        location_address: 'Lot 35, Vivacity Megamall, Jln Wan Alwi, 93350 Kuching, Sarawak',
        latitude: 1.5303,
        longitude: 110.3653,
        base_price: 20.0,
        hall: 8,
        operating_hours: {
          weekday: '10:00 – 00:00',
          weekend: '09:00 – 01:00',
          ph: '09:00 – 01:00',
        },
        amenities: [
          { icon: 'Car', label: 'Free Parking' },
          { icon: 'Accessibility', label: 'Accessible' },
          { icon: 'Coffee', label: 'Café' },
          { icon: 'Tv', label: 'Lounge' },
          { icon: 'Wifi', label: 'Free WiFi' },
        ],
      },
      {
        slug: 'the-spring',
        name: 'Popflix The Spring',
        mall: 'The Spring Shopping Mall',
        image_path:
          'https://kygmgshzafyxfvilxbxo.supabase.co/storage/v1/object/public/cinema/spring.png',
        location_address: 'Lot 1-59, The Spring Shopping Mall, Jln Simpang Tiga, 93350 Kuching',
        latitude: 1.5358,
        longitude: 110.3582,
        base_price: 18.0,
        hall: 6,
        operating_hours: {
          weekday: '10:30 – 23:30',
          weekend: '09:30 – 00:30',
          ph: '09:30 – 00:30',
        },
        amenities: [
          { icon: 'Car', label: 'Parking' },
          { icon: 'Accessibility', label: 'Accessible' },
          { icon: 'Coffee', label: 'Snack Bar' },
          { icon: 'Wifi', label: 'Free WiFi' },
        ],
      },
      {
        slug: 'cityone',
        name: 'Popflix CityOne Megamall',
        mall: 'CityOne Megamall',
        image_path:
          'https://kygmgshzafyxfvilxbxo.supabase.co/storage/v1/object/public/cinema/cityone.png',
        location_address: 'Lot 5, CityOne Megamall, Jln Song Thian Cheok, 93100 Kuching',
        latitude: 1.5248,
        longitude: 110.3575,
        base_price: 10.0,
        hall: 5,
        operating_hours: {
          weekday: '11:00 – 23:00',
          weekend: '10:00 – 00:00',
          ph: '10:00 – 00:00',
        },
        amenities: [
          { icon: 'Car', label: 'Parking' },
          { icon: 'Accessibility', label: 'Accessible' },
          { icon: 'Coffee', label: 'Café' },
        ],
      },
      {
        slug: 'aeon-mall',
        name: 'Popflix AEON Kuching Central',
        mall: 'AEON Mall Kuching Central',
        image_path:
          'https://kygmgshzafyxfvilxbxo.supabase.co/storage/v1/object/public/cinema/aeon.png',
        location_address: 'Lot G-10, AEON Mall Kuching Central, Jln Stutong, 93350 Kuching',
        latitude: 1.535,
        longitude: 110.334,
        base_price: 15.0,
        hall: 7,
        operating_hours: {
          weekday: '10:00 – 23:30',
          weekend: '09:00 – 00:30',
          ph: '09:00 – 00:30',
        },
        amenities: [
          { icon: 'Car', label: 'Free Parking' },
          { icon: 'Accessibility', label: 'Accessible' },
          { icon: 'Utensils', label: 'Food Court' },
          { icon: 'Baby', label: 'Family Zone' },
          { icon: 'Wifi', label: 'Free WiFi' },
        ],
      },
    ];

    await expRepo.save(experienceData);
    const cinemas = await cinemaRepo.save(cinemaData);
    const movies = await movieRepo.find();
    const experiences = await expRepo.find();
    const timeSlots = ['10:30', '13:00', '15:45', '18:30', '21:15'];

    const getMovieExperiences = (movie: any) => {
      const keys: string[] = [];
      const genres = movie.genre_ids || [];

      if (movie.popularity > 500) keys.push('IMAX');
      if (movie.vote_average > 7.5) keys.push('DOLBY');
      if (genres.includes('27') || genres.includes('28')) keys.push('4DX');
      if (movie.runtime > 140 || genres.includes('10749')) keys.push('LUXE');
      if (movie.vote_average > 8 || genres.includes('18')) keys.push('INDULGE');
      if (genres.includes('16') || genres.includes('10751')) {
        keys.push('BEANIE');
        keys.push('JUNIOR');
      }

      if (keys.length === 0) keys.push('LUXE');

      return experiences.filter((e) => keys.includes(e.exp_key.toUpperCase()));
    };

    const showtimes: Showtime[] = [];

    const DAYS = 8;
    const MAX_EXPERIENCES_PER_MOVIE = 2;
    const MAX_TIMESLOTS_PER_DAY = 3;

    const selectedTimeSlots = timeSlots.slice(0, MAX_TIMESLOTS_PER_DAY);

    for (const movie of movies) {
      const movieExperiences = getMovieExperiences(movie)
        .sort(() => Math.random() - 0.5)
        .slice(0, MAX_EXPERIENCES_PER_MOVIE);

      for (const cinema of cinemas) {
        for (let day = 0; day < DAYS; day++) {
          const dateStr = moment().add(day, 'days').format('YYYY-MM-DD');

          for (const time of selectedTimeSlots) {
            const startTime = new Date(`${dateStr}T${time}:00`);

            const exp = movieExperiences[Math.floor(Math.random() * movieExperiences.length)];

            showtimes.push(
              showtimeRepo.create({
                movie_id: movie.id,
                cinema,
                experience: exp,
                start_time: startTime,
                hall_name: `Hall ${Math.floor(Math.random() * 5) + 1}`,
              }),
            );
          }
        }
      }
    }

    const batchSize = 500;

    for (let i = 0; i < showtimes.length; i += batchSize) {
      const batch = showtimes.slice(i, i + batchSize);

      await showtimeRepo.save(batch);

      console.log(
        `Inserted batch ${i / batchSize + 1} / ${Math.ceil(showtimes.length / batchSize)}`,
      );
    }

    const allShowtimes = await showtimeRepo.find({ take: 10 });

    console.log('Seeding Bookings and Payments');

    const bookingRepo = AppDataSource.getRepository(Booking);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const notificationRepo = AppDataSource.getRepository(Notification);

    const getTierForSpend = (totalSpent: number) => {
      if (totalSpent >= 2000) return MembershipTier.GOLD;
      if (totalSpent >= 500) return MembershipTier.SILVER;
      return MembershipTier.BRONZE;
    };

    const getEarnMultiplier = (tier: MembershipTier) => {
      if (tier === MembershipTier.GOLD) return 2;
      if (tier === MembershipTier.SILVER) return 1.5;
      return 1;
    };

    const bookingPlans = [
      [45, 50, 85], // Bronze
      [120, 150, 180, 270], // Silver
      [200, 220, 240, 320, 310], // Silver
      [350, 400, 450, 500, 500], // Gold
      [35, 30, 30], // Bronze
      [500, 600, 750, 750], // Gold
      [150, 180, 220, 350], // Silver
    ];

    for (let userIndex = 0; userIndex < users.length; userIndex++) {
      const user = users[userIndex];
      const plan = bookingPlans[userIndex] || [45, 45, 45];

      let runningTotal = 0;
      let loyaltyPoints = 0;
      let currentTier = MembershipTier.BRONZE;
      let silverTierNotified = false;
      let goldTierNotified = false;

      for (let bookingIndex = 0; bookingIndex < plan.length; bookingIndex++) {
        const amount = plan[bookingIndex];
        const targetShowtime = allShowtimes[(userIndex * 3 + bookingIndex) % allShowtimes.length];
        const targetMovie = movies.find((movie) => movie.id === targetShowtime.movie_id);
        const seatCount = Math.max(1, Math.min(4, Math.ceil(amount / 100)));
        const ticketPrice = Number((amount / seatCount).toFixed(2));
        const seatPrefix = String.fromCharCode(65 + (userIndex % 6));
        const seatStart = bookingIndex * 2 + 1;

        const tickets = Array.from({ length: seatCount }, (_, seatOffset) => ({
          seatNumber: `${seatPrefix}${seatStart + seatOffset}`,
          price: ticketPrice,
        }));

        const pointsEarned = Math.floor(amount * getEarnMultiplier(currentTier));
        runningTotal += amount;
        loyaltyPoints += pointsEarned;
        currentTier = getTierForSpend(runningTotal);

        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 8);

        const savedBooking = await bookingRepo.save(
          bookingRepo.create({
            user,
            showtimeId: targetShowtime.id,
            totalPrice: amount,
            status: BookingStatus.PAID,
            expiresAt: expiry,
            pointsEarned,
            tickets,
          }),
        );

        await paymentRepo.save({
          paymentMethod: 'Credit Card',
          amount,
          booking: savedBooking,
        });

        const movieTitle = targetMovie?.title || 'your movie booking';
        await notificationRepo.save({
          userId: user.id,
          title: 'Payment Successful',
          message: `Your payment for "${movieTitle}" was successful. Your seats are locked in!`,
          type: 'success',
          url: '/my-tickets',
          isRead: false,
        });

        if (!silverTierNotified && runningTotal >= 500) {
          silverTierNotified = true;
          await notificationRepo.save({
            userId: user.id,
            title: 'Silver Membership Unlocked',
            message:
              'Congratulations! You have unlocked Silver membership benefits with your booking history.',
            type: 'success',
            url: '/profile',
            isRead: false,
          });
        }

        if (!goldTierNotified && runningTotal >= 2000) {
          goldTierNotified = true;
          await notificationRepo.save({
            userId: user.id,
            title: 'Gold Membership Unlocked',
            message: 'Amazing! You have reached Gold membership and unlocked premium benefits.',
            type: 'success',
            url: '/profile',
            isRead: false,
          });
        }

        currentTier = getTierForSpend(runningTotal);
      }

      await userRepo.update(user.id, {
        loyaltyPoints,
        totalSpent: runningTotal,
        membershipTier: currentTier,
      });
    }

    console.log('Seeding Reviews...');
    const reviewRepo = AppDataSource.getRepository(Review);

    const bookings = await bookingRepo.find({
      relations: ['user', 'showtime'],
    });

    for (const booking of bookings) {
      if (booking.status === BookingStatus.PAID) {
        const mockReviews = [
          {
            rating: 5,
            title: 'A Visual Triumph!',
            comment: 'An absolute masterpiece! The cinematography was breathtaking.',
          },
          {
            rating: 4,
            title: 'Great Weekend Watch',
            comment: 'Really enjoyed the story, highly recommended for a weekend watch.',
          },
          {
            rating: 5,
            title: 'Sensational Sound Design',
            comment: 'The sound design in this cinema is incredible. Best experience ever.',
          },
          {
            rating: 3,
            title: 'Visually Impressive but Long',
            comment: 'It was okay, a bit long but the visuals were great.',
          },
        ];

        const randomReview = mockReviews[Math.floor(Math.random() * mockReviews.length)];

        await reviewRepo.save({
          rating: randomReview.rating,
          title: randomReview.title,
          comment: randomReview.comment,
          booking: booking,
          user: booking.user,
          createdAt: new Date(),
        });
      }
    }
    console.log('Reviews seeded successfully!');
    console.log('Seeding FAQs:');

    const faqRepo = AppDataSource.getRepository(Faq);

    const faqSeedData = [
      // ==========================================
      // CATEGORY: Booking
      // ==========================================
      {
        category: 'Booking',
        question: 'How do I book a ticket online?',
        answer:
          'Simply select your desired movie, choose a cinema and showtime, pick your seats and proceed to checkout. Your digital ticket will be sent to your email and saved in the "My Tickets" section of your app.',
      },
      {
        category: 'Booking',
        question: 'Can I cancel or refund my ticket?',
        answer:
          'Tickets purchased through PopFlix are non‑refundable and cannot be cancelled once confirmed. Please double‑check your movie, cinema, showtime, and seat selection before completing your booking.',
      },
      {
        category: 'Booking',
        question: 'Is there an online booking fee?',
        answer:
          'No, PopFlix does not charge any additional booking fees. The price you see at checkout is the final ticket price.',
      },
      {
        category: 'Booking',
        question: "I didn't receive my confirmation email. What should I do?",
        answer:
          'First, check your spam or junk folder. If it is not there, log into your Popflix account and navigate to "My Tickets" where your QR code will be safely stored. You can also resend the email from that page.',
      },

      // ==========================================
      // CATEGORY: Seating
      // ==========================================
      {
        category: 'Seating',
        question: 'How does seat selection work?',
        answer:
          'All our cinemas feature reserved seating. During booking, you will see a live map of the cinema hall. Grey seats are available, red seats are taken, and your selected seats will turn green.',
      },
      {
        category: 'Seating',
        question: 'Can I preview my seat before booking?',
        answer:
          'Yes. PopFlix offers a 3D scene preview that lets you experience the cinema hall layout and see how far your chosen seat is from the screen. This helps you make an informed choice and ensures the best viewing comfort before confirming your booking.',
      },
      {
        category: 'Seating',
        question: 'Can I change my seat after booking?',
        answer:
          'Once a booking is confirmed, seats cannot be modified directly. You will need to make a new reservation with your preferred seats.',
      },
      {
        category: 'Seating',
        question: 'What is the difference between Standard and Premium seats?',
        answer:
          'Standard seats offer our classic, comfortable plush rocking chairs. Premium seats are located in the center-back sweet spot of the theater, offering extra legroom, wider armrests, and motorized reclining features.',
      },
      {
        category: 'Seating',
        question: 'Do children need their own seat and ticket?',
        answer:
          "Children aged 3 and older require their own ticket and dedicated seat. Children under 3 may enter for free provided they sit on a parent or guardian's lap for the entire performance.",
      },

      // ==========================================
      // CATEGORY: Policies
      // ==========================================
      {
        category: 'Policies',
        question: 'Can I bring outside food and drinks into the cinema?',
        answer:
          'To ensure a consistent and clean experience for all guests, outside food and beverages are strictly prohibited. We offer a wide variety of fresh popcorn, hot food, and drinks at our concession stands.',
      },
      {
        category: 'Policies',
        question: 'What are the age restrictions for movies?',
        answer:
          'We strictly adhere to the national film classification board ratings (e.g., PG13, P18). Cinema staff reserve the right to request valid photo ID for age-restricted films. Entry will be denied without proof of age.',
      },
      {
        category: 'Policies',
        question: 'What time should I arrive for my movie?',
        answer:
          'We recommend arriving 15 to 20 minutes before the printed showtime. This gives you plenty of time to scan your ticket, buy snacks, and find your seat before the trailers begin.',
      },
      {
        category: 'Policies',
        question: 'What is your policy on mobile phone usage?',
        answer:
          'Popflix enforces a strict "Dark and Quiet" policy. Once the lights dim, all mobile phones must be silenced and put away. Guests who continuously disrupt the experience for others may be asked to leave without a refund.',
      },

      // ==========================================
      // CATEGORY: Payments
      // ==========================================
      {
        category: 'Payments',
        question: 'What payment methods do you accept online?',
        answer:
          'We accept all major credit and debit cards (Visa, Mastercard, AMEX), Apple Pay, Google Pay, and select local e-wallets.',
      },
      {
        category: 'Payments',
        question: 'My payment failed but the money was deducted. What happens now?',
        answer:
          'Do not panic! Unsuccessful transactions due to network timeouts are automatically flagged and reversed. The funds will be credited back to your original payment method within 3 to 5 business days.',
      },
      {
        category: 'Payments',
        question: 'Is it safe to save my credit card on Popflix?',
        answer:
          'Yes. Popflix does not store your actual credit card numbers on our servers. We use secure, industry-standard tokenization provided by our payment gateway partners (like Stripe/Braintree) to facilitate one-click checkouts.',
      },
      {
        category: 'Payments',
        question: 'Can I split the payment across multiple cards?',
        answer:
          'Currently, we do not support split payments for a single online transaction. The total amount must be charged to one card or digital wallet.',
      },
    ];

    await faqRepo.save(faqSeedData);
    console.log('FAQs seeded successfully!');

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('Data Source destroyed.');
  }
}

runSeed();
