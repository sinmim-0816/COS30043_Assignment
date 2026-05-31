import { Showtime } from '../../showtimes/entities/showtime.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('movie_experience')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_exp_key')
  @Column({ length: 20 })
  exp_key: string;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 100, nullable: true })
  subtitle: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price_premium: number;

  @Column({ length: 255, nullable: true })
  image_url: string;

  @Column({ default: 0 })
  order_index: number;

  @OneToMany(() => Showtime, (showtime) => showtime.experience)
  showtimes: Showtime[];
}
