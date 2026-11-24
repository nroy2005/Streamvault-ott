import { Model } from 'mongoose';
import { Movie } from './movie.schema';
import { MoviesService } from './movies.service';

describe('MoviesService.findAll', () => {
  const setup = () => {
    const query = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn(async () => []) };
    query.sort.mockReturnValue(query);
    query.skip.mockReturnValue(query);
    const model = { find: jest.fn(() => query), countDocuments: jest.fn(async () => 0) };
    return { query, model, service: new MoviesService(model as unknown as Model<Movie>) };
  };

  it('combines text search and genre, sorting by relevance', async () => {
    const { query, model, service } = setup();
    await service.findAll({ search: '  dark knight ', genre: 'Action', page: 3, limit: 10 });
    expect(model.find).toHaveBeenCalledWith({ genres: 'Action', $text: { $search: 'dark knight' } });
    expect(query.sort).toHaveBeenCalledWith({ score: { $meta: 'textScore' }, rating: -1 });
    expect(query.skip).toHaveBeenCalledWith(20);
  });

  it('ignores blank search and sorts by rating', async () => {
    const { query, model, service } = setup();
    await service.findAll({ search: '   ', page: 1, limit: 20 });
    expect(model.find).toHaveBeenCalledWith({});
    expect(query.sort).toHaveBeenCalledWith({ rating: -1 });
  });
});
