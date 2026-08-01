import axios from 'axios';

const TMDB_API_KEY = import.meta.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
  }
});

// APIs para o Catálogo (Fase 1)
export const getTrendingMovies = async (page: number = 1) => {
  const res = await tmdbApi.get('/trending/movie/week', { params: { page } });
  return res.data.results;
};

export const getUpcomingMovies = async (page: number = 1) => {
  const res = await tmdbApi.get('/movie/upcoming', {
    params: { region: 'BR', page }
  });
  return res.data.results;
};

export const getNowPlayingMovies = async (page: number = 1) => {
  const res = await tmdbApi.get('/movie/now_playing', {
    params: { region: 'BR', page }
  });
  return res.data.results;
};

export const getMovieDetails = async (id: number | string) => {
  const res = await tmdbApi.get(`/movie/${id}`, {
    params: { append_to_response: 'credits,videos,watch/providers' }
  });
  return res.data;
};

export const getGenres = async () => {
  try {
    const response = await tmdbApi.get('/genre/movie/list', {
      params: { language: 'pt-BR' }
    });
    return response.data.genres;
  } catch (error) {
    console.error('Erro ao buscar gêneros:', error);
    return [];
  }
};

export const getWatchProviders = async () => {
  try {
    const response = await tmdbApi.get('/watch/providers/movie', {
      params: { language: 'pt-BR', watch_region: 'BR' }
    });
    return response.data.results;
  } catch (error) {
    console.error('Erro ao buscar provedores de streaming:', error);
    return [];
  }
};

export const fetchFilteredMovies = async (page: number = 1, query: string = '', genreIds: number[] = [], year: string = '', watchProvidersIds: number[] = []) => {
  try {
    let endpoint = '/movie/popular';
    let params: any = { language: 'pt-BR', page };

    if (query.trim() !== '') {
      endpoint = '/search/movie';
      params.query = query;
      if (year) params.primary_release_year = year;

      const response = await tmdbApi.get(endpoint, { params });
      let results = response.data.results;

      if (genreIds.length > 0) {
        results = results.filter((movie: any) => movie.genre_ids && movie.genre_ids.some((id: number) => genreIds.includes(id)));
      }
      return results;

    } else if (genreIds.length > 0 || year || watchProvidersIds.length > 0) {
      endpoint = '/discover/movie';
      if (genreIds.length > 0) params.with_genres = genreIds.join('|');
      if (year) params.primary_release_year = year;
      if (watchProvidersIds.length > 0) {
        params.with_watch_providers = watchProvidersIds.join('|');
        params.watch_region = 'BR';
      }

      const response = await tmdbApi.get(endpoint, { params });
      return response.data.results;
    } else {
      const response = await tmdbApi.get(endpoint, { params });
      return response.data.results;
    }
  } catch (error) {
    console.error('Erro ao buscar filmes filtrados:', error);
    return [];
  }
};
