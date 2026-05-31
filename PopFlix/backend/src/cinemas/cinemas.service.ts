import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { UpdateCinemaDto } from './dto/update-cinema.dto';
import { Cinema } from './entities/cinema.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CinemasService {
  constructor(
    @InjectRepository(Cinema)
    private repo: Repository<Cinema>,
  ) {}

  create(createCinemaDto: CreateCinemaDto) {
    return this.repo.save(this.repo.create(createCinemaDto));
  }

  async findAll(): Promise<Cinema[]> {
    return await this.repo.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Cinema> {
    const cinema = await this.repo.findOne({ where: { id } });
    if (!cinema) {
      throw new NotFoundException(`Cinema with ID ${id} not found`);
    }

    return cinema;
  }

  async update(id: number, updateCinemaDto: UpdateCinemaDto) {
    const cinema = await this.findOne(id);
    Object.assign(cinema, updateCinemaDto);

    return this.repo.save(cinema);
  }

  async remove(id: number) {
    const cinema = await this.findOne(id);
    await this.repo.remove(cinema);

    return { deleted: true, id };
  }
}
