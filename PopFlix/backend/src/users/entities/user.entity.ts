import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { MembershipTier } from '../../enum/MembershipTier';
import { Review } from '../../review/entities/review.entity';
import { TicketDesign } from './../../ticket-design/entities/ticket-design.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 0 })
  loyaltyPoints: number;

  @Column({
    type: 'enum',
    enum: MembershipTier,
    default: MembershipTier.BRONZE,
  })
  membershipTier: MembershipTier;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ type: 'varchar', nullable: true, length: 150 })
  location: string | null;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  gender: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', array: true, nullable: true })
  favouriteGenres: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry: Date | null;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  activationToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  activationTokenExpiry: Date | null;

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.user)
  vehicles: Vehicle[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => TicketDesign, (ticketDesign) => ticketDesign.user)
  ticketDesigns: TicketDesign[];
}
