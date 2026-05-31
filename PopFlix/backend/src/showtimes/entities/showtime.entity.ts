import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Experience } from '../../experiences/entities/experience.entity';
import { Cinema } from '../../cinemas/entities/cinema.entity';
import { Movie } from '../../movie/entities/movie.entity';
@Entity('showtimes')
@Index(['movie_id', 'cinema_id', 'start_time', 'experience'], {
  unique: true,
})
export class Showtime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  movie_id: number;

  @Column()
  cinema_id: number;

  @Column()
  hall_name: string;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @ManyToOne(() => Experience, { nullable: false })
  @JoinColumn({ name: 'experience_id' })
  experience: Experience;

  @ManyToOne(() => Cinema, (cinema) => cinema.showtimes, { nullable: false })
  @JoinColumn({ name: 'cinema_id' })
  cinema: Cinema;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Movie, { nullable: false })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;
}
