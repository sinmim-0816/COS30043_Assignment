import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Movie } from '../movie/entities/movie.entity';
import { Cinema } from '../cinemas/entities/cinema.entity';
import { Faq } from '../faqs/entities/faq.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Movie) private movieRepo: Repository<Movie>,
    @InjectRepository(Cinema) private cinemaRepo: Repository<Cinema>,
    @InjectRepository(Faq) private faqRepo: Repository<Faq>,
  ) {}

  async globalSearch(query: string, category: string) {
    const searchTerm = query?.trim();
    if (!searchTerm) {
      return { movies: [], cinemas: [], faqs: [] };
    }

    const normalizedCategory = category?.trim().toLowerCase() ?? 'all';
    const searchCondition = { name: ILike(`%${searchTerm}%`) };
    const titleCondition = { title: ILike(`%${searchTerm}%`) };
    const faqCondition = [
      { question: ILike(`%${searchTerm}%`) },
      { answer: ILike(`%${searchTerm}%`) },
      { category: ILike(`%${searchTerm}%`) },
    ];

    const [movies, cinemas, faqs] = await Promise.all([
      normalizedCategory === 'all' || normalizedCategory === 'movies'
        ? this.movieRepo.find({ where: titleCondition, take: 5 })
        : Promise.resolve([]),

      normalizedCategory === 'all' || normalizedCategory === 'cinemas'
        ? this.cinemaRepo.find({ where: searchCondition, take: 5 })
        : Promise.resolve([]),

      normalizedCategory === 'all' ||
      normalizedCategory === 'faq' ||
      normalizedCategory === 'faqs'
        ? this.faqRepo.find({ where: faqCondition, take: 5 })
        : Promise.resolve([]),
    ]);

    return {
      movies: movies.map((m) => ({
        id: m.id,
        title: m.title,
        type: 'Movie',
        image: m.poster_path,
        genres: m.genre_ids,
        tmdb_id: m.tmdb_id,
      })),
      cinemas: cinemas.map((c) => ({
        id: c.id,
        title: c.name,
        type: 'Cinema',
        subtitle: c.location_address,
        image_path: c.image_path,
      })),
      faqs: faqs.map((faq) => ({
        id: faq.id,
        title: faq.question,
        type: 'FAQ',
        subtitle: faq.category,
        answer: faq.answer,
        category: faq.category,
      })),
    };
  }
}
