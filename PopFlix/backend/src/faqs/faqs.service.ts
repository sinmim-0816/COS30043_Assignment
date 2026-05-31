import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq } from './entities/faq.entity';

@Injectable()
export class FaqsService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepository: Repository<Faq>,
  ) {}

  async create(createFaqDto: CreateFaqDto): Promise<Faq> {
    const newFaq = this.faqRepository.create(createFaqDto);
    return await this.faqRepository.save(newFaq);
  }

  async findAll(): Promise<Faq[]> {
    return await this.faqRepository.find({
      order: { category: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Faq> {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async update(id: number, updateFaqDto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.findOne(id);
    const updatedFaq = Object.assign(faq, updateFaqDto);
    return await this.faqRepository.save(updatedFaq);
  }

  async remove(id: number): Promise<{ message: string }> {
    const faq = await this.findOne(id);
    await this.faqRepository.remove(faq);
    return { message: `FAQ with ID ${id} successfully deleted` };
  }
}
