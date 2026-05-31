import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('ticket_designs')
export class TicketDesign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  booking_id: string;

  @Column()
  user_id: number;

  @Column({ type: 'text' })
  design_image: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.ticketDesigns)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Booking, (booking) => booking.ticketDesigns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}
