import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { MovieStatus } from '../../enum/movieStatus';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tmdb_id: number;

  @Column()
  title: string;

  @Column({ type: 'float', default: 0 })
  popularity: number;

  @Column({ type: 'float', default: 0 })
  vote_average: number;

  @Column({ type: 'int', default: 0 })
  runtime: number;

  @Column({ type: 'simple-array', nullable: true })
  genre_ids: number[];

  @Column({ type: 'date', nullable: true })
  release_date: Date;

  @Column({ nullable: true })
  poster_path: string;

  @Column({ nullable: true })
  backdrop_path: string;

  @Column({ nullable: true })
  original_language: string;

  @Column({ nullable: true })
  tagline: string;

  @Column({ nullable: true })
  overview: string;

  @Column({
    type: 'enum',
    enum: MovieStatus,
    default: MovieStatus.COMING_SOON,
  })
  status: MovieStatus;
}
