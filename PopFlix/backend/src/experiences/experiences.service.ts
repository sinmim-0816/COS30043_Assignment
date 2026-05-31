import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from './entities/experience.entity';

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectRepository(Experience)
    private repo: Repository<Experience>,
  ) {}

  async findAll(): Promise<Experience[]> {
    return await this.repo.find({
      order: {
        exp_key: 'ASC',
        order_index: 'ASC',
      },
    });
  }

  async findByExpKey(key: string): Promise<Experience[]> {
    if (!key) return [];
    const experiences = await this.repo.find({
      where: {
        exp_key: key.toUpperCase(),
      },
      order: {
        order_index: 'ASC',
      },
    });

    if (!experiences.length) {
      throw new NotFoundException(`No experiences found for key: ${key}`);
    }

    return experiences;
  }

  async findOne(id: number): Promise<Experience> {
    const experience = await this.repo.findOne({ where: { id } });
    if (!experience) {
      throw new NotFoundException(`Experience with ID ${id} not found`);
    }
    return experience;
  }
}
