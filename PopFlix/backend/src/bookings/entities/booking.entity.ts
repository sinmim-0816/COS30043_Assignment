import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { BookingStatus } from '../../enum/BookingStatus';
import { Showtime } from '../../showtimes/entities/showtime.entity';
import { TicketDesign } from '../../ticket-design/entities/ticket-design.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  showtimeId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ default: 0 })
  pointsEarned: number;

  @Column({ default: 0 })
  pointsRedeemed: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  parkingSpot: string | null;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.bookings)
  user: User;

  @OneToMany(() => Ticket, (ticket) => ticket.booking, { cascade: true })
  tickets: Ticket[];

  @ManyToOne(() => Showtime)
  @JoinColumn({ name: 'showtimeId' })
  showtime: Showtime;

  @OneToMany(() => TicketDesign, (ticketDesign) => ticketDesign.booking)
  ticketDesigns: TicketDesign[];
}
