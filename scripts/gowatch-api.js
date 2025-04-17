// scripts/gowatch-api.js
import { GOWATCH_HOST, GOWATCH_KEY } from './api-keys.js';


export async function lookupGoWatch(tmdbId, country = 'us') {
  const url = `https://${GOWATCH_HOST}/lookup/title/tmdb_id`;
  const form = new URLSearchParams();
  form.append('id', tmdbId);
  form.append('type', 'movie');
  form.append('country', country);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-rapidapi-host': GOWATCH_HOST,
      'x-rapidapi-key': GOWATCH_KEY
    },
    body: form
  });

  if (!resp.ok) {
    throw new Error(`GoWatch error: ${resp.status}`);
  }
  return await resp.json();
}
