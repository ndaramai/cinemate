// scripts/tmdb-api.js
import { TMDB_BEARER } from './api-keys.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Search TMDb for movies matching `query`.
 * Returns an array of movie objects.
 */
export async function searchTmdbMovies(query) {
  const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TMDB_BEARER}`,
      'Accept': 'application/json'
    }
  });
  if (!resp.ok) {
    throw new Error(`TMDb error: ${resp.status}`);
  }
  const data = await resp.json();
  return data.results;  // array of { id, title, release_date, poster_path, ... }
}
