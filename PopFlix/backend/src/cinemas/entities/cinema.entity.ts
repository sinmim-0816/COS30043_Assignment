import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity';

@Entity('cinemas')
export class Cinema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  mall: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 18.0 })
  base_price: number;

  @Column({ type: 'text', nullable: true })
  location_address: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'int', default: 0 })
  hall: number;

  @Column({ type: 'text', nullable: true })
  image_path: string;

  @Column({ type: 'jsonb', nullable: true })
  operating_hours: { weekday: string; weekend: string; ph: string };

  @Column({ type: 'jsonb', nullable: true })
  amenities: { icon: string; label: string }[];

  @OneToMany(() => Showtime, (showtime) => showtime.cinema)
  showtimes: Showtime[];
}
