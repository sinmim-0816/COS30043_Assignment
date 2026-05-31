import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  movieId: string;

  @Column({ default: false })
  isNotified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
