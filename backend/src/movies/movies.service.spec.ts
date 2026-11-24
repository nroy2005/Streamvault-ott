import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Movie } from './movie.schema';
import { MoviesService, wordPrefixPattern } from './movies.service';

const setup = (...totals: number[]) => {
  const query = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn(async () => []) };
  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  const countDocuments = jest.fn();
  totals.forEach((t) => countDocuments.mockResolvedValueOnce(t));
  const model = { find: jest.fn(() => query), countDocuments, findById: jest.fn(async () => null) };
  return { query, model, service: new MoviesService(model as unknown as Model<Movie>) };
};

describe('MoviesService.findAll', () => {
  it('without a search term, filters by genre and sorts by rating', async () => {
    const { query, model, service } = setup(5);
    await service.findAll({ search: '   ', genre: 'Drama', page: 3, limit: 10 });
    expect(model.find).toHaveBeenCalledTimes(1);
    expect(model.find).toHaveBeenCalledWith({ genres: 'Drama' });
    expect(query.sort).toHaveBeenCalledWith({ rating: -1 });
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(query.limit).toHaveBeenCalledWith(10);
  });

  it('uses full-text search ranked by relevance when it finds matches', async () => {
    const { query, model, service } = setup(2);
    const result = await service.findAll({ search: ' dark knight ', genre: 'Action', page: 1, limit: 20 });
    expect(model.find).toHaveBeenCalledTimes(1);
    expect(model.find).toHaveBeenCalledWith({ genres: 'Action', $text: { $search: 'dark knight' } });
    expect(query.sort).toHaveBeenCalledWith({ score: { $meta: 'textScore' }, rating: -1 });
    expect(result.total).toBe(2);
  });

  it('falls back to a case-insensitive word-prefix regex when full-text finds nothing', async () => {
    const { query, model, service } = setup(0, 4);
    const result = await service.findAll({ search: 'aveng', genre: 'Action', page: 1, limit: 20 });
    const prefix = { $regex: wordPrefixPattern('aveng'), $options: 'i' };
    expect(model.find).toHaveBeenLastCalledWith({ genres: 'Action', $or: [{ title: prefix }, { genres: prefix }] });
    expect(query.sort).toHaveBeenLastCalledWith({ rating: -1 });
    expect(result.total).toBe(4);
  });
});

describe('MoviesService.findOne', () => {
  it('throws NotFound for a missing movie', async () => {
    const { service } = setup();
    await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('wordPrefixPattern', () => {
  // Same semantics as MongoDB's UTF-8 PCRE with $options 'i'.
  const matches = (term: string, title: string) => new RegExp(wordPrefixPattern(term), 'iu').test(title);

  it('matches the start of any word, case-insensitively', () => {
    expect(matches('aveng', 'Avengers: Endgame')).toBe(true);
    expect(matches('END', 'Avengers: Endgame')).toBe(true);
    expect(matches('man', 'Spider-Man: No Way Home')).toBe(true);
    expect(matches('dark kni', 'The Dark Knight')).toBe(true);
  });

  it('does not match in the middle of a word', () => {
    expect(matches('man', 'Batman')).toBe(false);
  });

  it('treats regex metacharacters literally', () => {
    expect(matches('(500', '(500) Days of Summer')).toBe(true);
    expect(matches('.*', 'Up')).toBe(false);
    expect(matches('a+b', 'aab')).toBe(false);
    expect(() => wordPrefixPattern('[unclosed')).not.toThrow();
    expect(matches('[unclosed', 'A [unclosed bracket')).toBe(true);
  });
});
