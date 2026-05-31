import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  model: string;

  @Column()
  plateNumber: string;

  @Column()
  color: string;

  @ManyToOne(() => User, (user) => user.vehicles)
  user: User;
}
