// Add this code to foryou.js, watchlist.js, details-dialog.js, and where-to-watch.js
// to track user actions across the CineMate application

/**
 * Add history tracking to CineMate
 */
function setupHistoryTracking() {
  // Check if window.addToHistory is already defined (from history.js)
  if (typeof window.addToHistory !== 'function') {
    // Define addToHistory function if not already available
    window.addToHistory = function(item) {
      // Make sure we have all required properties
      if (!item || !item.action || !item.title) return;
      
      // Add timestamp if not provided
      if (!item.timestamp) {
        item.timestamp = new Date().toISOString();
      }
      
      // Get current history
      const history = JSON.parse(localStorage.getItem('cinemate-history') || '[]');
      
      // Add new item at the beginning
      history.unshift(item);
      
      // Limit history size
      const MAX_HISTORY_ITEMS = 50;
      if (history.length > MAX_HISTORY_ITEMS) {
        history.length = MAX_HISTORY_ITEMS;
      }
      
      // Save back to localStorage
      localStorage.setItem('cinemate-history', JSON.stringify(history));
    };
  }
}

/**
 * Track when a movie is added to watchlist
 * @param {Object} movie - Movie object
 */
function trackAddToWatchlist(movie) {
  setupHistoryTracking();
  
  window.addToHistory({
    action: 'watchlist_add',
    title: movie.title,
    movieId: movie.id,
    details: `Added "${movie.title}" to watchlist`
  });
}

/**
 * Track when a movie is removed from watchlist
 * @param {Object} movie - Movie object
 */
function trackRemoveFromWatchlist(movie) {
  setupHistoryTracking();
  
  window.addToHistory({
    action: 'watchlist_remove',
    title: movie.title,
    movieId: movie.id,
    details: `Removed "${movie.title}" from watchlist`
  });
}

/**
 * Track when a movie is marked as watched
 * @param {Object} movie - Movie object
 */
function trackMarkAsWatched(movie) {
  setupHistoryTracking();
  
  window.addToHistory({
    action: 'watched',
    title: movie.title,
    movieId: movie.id,
    details: `Marked "${movie.title}" as watched`
  });
}

/**
 * Track when a movie is unmarked as watched
 * @param {Object} movie - Movie object
 */
function trackUnmarkAsWatched(movie) {
  setupHistoryTracking();
  
  window.addToHistory({
    action: 'unwatched',
    title: movie.title,
    movieId: movie.id,
    details: `Unmarked "${movie.title}" as watched`
  });
}

/**
 * Track when movie details are viewed
 * @param {Object} movie - Movie object
 */
function trackDetailsView(movie) {
  setupHistoryTracking();
  
  window.addToHistory({
    action: 'details_view',
    title: movie.title,
    movieId: movie.id,
    details: `Viewed details for "${movie.title}"`
  });
}

/**
 * Track when where to watch is checked
 * @param {Object} movie - Movie object
 */
function trackWhereToWatch(movie) {
  setupHistoryTracking();
  
  window.addToHistory({
    action: 'where_to_watch',
    title: movie.title,
    movieId: movie.id,
    details: `Checked where to watch "${movie.title}"`
  });
}

/**
 * Track search action
 * @param {string} query - Search query
 */
function trackSearch(query) {
  setupHistoryTracking();
  
  window.addToHistory({
    action: 'search',
    title: `Search: "${query}"`,
    details: `Searched for "${query}"`
  });
}

// Example implementation in foryou.js:
// Update the movie details dialog function:
function openMovieDetails(movieId) {
  // Existing code...
  
  // Get movie details
  fetch(`${TMDB_BASE}/movie/${movieId}?api_key=${TMDB_KEY}`)
    .then(response => response.json())
    .then(movie => {
      // Record this action in history
      trackDetailsView(movie);
      
      // Rest of your existing code...
    });
}

// Example implementation in watchlist.js:
// Update the addToWatchlist function:
function addToWatchlist(movie) {
  // Existing code to add to watchlist...
  
  // Record this action in history
  trackAddToWatchlist(movie);
}

// Example implementation in where-to-watch.js:
// Add this to the init function:
function init() {
  // Existing code...
  
  // Get movie data
  fetch(`${TMDB_BASE}/movie/${movieId}?api_key=${TMDB_KEY}`)
    .then(response => response.json())
    .then(movie => {
      // Record this action in history
      trackWhereToWatch(movie);
      
      // Rest of your existing code...
    });
}
document.addEventListener('DOMContentLoaded', () => {
  // TMDb configuration
  const TMDB_KEY = '4c84ecd36279188e533841ba4c85cf17';
  const TMDB_BASE = 'https://api.themoviedb.org/3';
  const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
  const DEFAULT_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster';

  // DOM Elements
  const lastModification = document.getElementById('last-modification');
  const genreButtons = document.getElementById('genreButtons');
  const moviesGrid = document.getElementById('foryou-movies');
  const preferencesToggle = document.getElementById('preferencesToggle');
  const minRatingInput = document.getElementById('minRating');
  const fromYearInput = document.getElementById('fromYear');
  const toYearInput = document.getElementById('toYear');
  const applyPreferencesBtn = document.getElementById('applyPreferences');
  
  // Movie dialog elements
  const movieDialog = document.getElementById('movieDialog');
  const modalClose = document.getElementById('modalClose');
  const dialogTitle = document.querySelector('.dialog-title');
  const dialogTagline = document.querySelector('.dialog-tagline');
  const dialogRatingRuntime = document.querySelector('.dialog-rating-runtime');
  const dialogPoster = document.querySelector('.dialog-poster');
  const dialogOverview = document.querySelector('.dialog-overview');
  const dialogDescription = document.querySelector('.dialog-description');
  const dialogAddWatchlist = document.getElementById('dialogAddWatchlist');
  const dialogMarkWatched = document.getElementById('dialogMarkWatched');

  // Application state
  let allMovies = [];
  let filteredMovies = [];
  let currentMovieId = null;
  let genresMap = {};
  let preferences = {
    genre: 'All',
    minRating: 0,
    fromYear: 1900,
    toYear: 2100
  };

  // Update last modification date
  if (lastModification) {
    lastModification.textContent = document.lastModified;
  }

  // Utility functions for localStorage
  function readList(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  function writeList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  // Initialize the page
  function init() {
    // Load preferences from localStorage
    loadPreferences();
    
    // Fetch genre data first
    fetch(`${TMDB_BASE}/genre/movie/list?api_key=${TMDB_KEY}`)
      .then(response => response.json())
      .then(data => {
        // Build the genre map
        data.genres.forEach(genre => {
          genresMap[genre.id] = genre.name;
        });
        
        // Fetch movies
        return Promise.all([
          fetch(`${TMDB_BASE}/movie/popular?api_key=${TMDB_KEY}`).then(r => r.json()),
          fetch(`${TMDB_BASE}/movie/top_rated?api_key=${TMDB_KEY}`).then(r => r.json()),
          fetch(`${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&sort_by=vote_average.desc`).then(r => r.json())
        ]);
      })
      .then(([popular, topRated, discover]) => {
        // Combine results and remove duplicates
        const allResults = [...popular.results, ...topRated.results, ...discover.results];
        const uniqueIds = new Set();
        
        allMovies = allResults.filter(movie => {
          if (uniqueIds.has(movie.id)) return false;
          uniqueIds.add(movie.id);
          return true;
        }).map(movie => ({
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          vote_average: movie.vote_average,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null,
          genre_ids: movie.genre_ids,
          genres: movie.genre_ids ? movie.genre_ids.map(id => genresMap[id]).filter(Boolean) : []
        }));
        
        // Apply filters and render
        filterMovies();
      })
      .catch(error => {
        console.error('Error fetching movie data:', error);
        moviesGrid.innerHTML = '<div class="error">Failed to load movies. Please try again later.</div>';
      });
    
    // Set up event listeners
    setupEventListeners();
  }

  // Load user preferences from localStorage
  function loadPreferences() {
    const savedPrefs = localStorage.getItem('cinemate-preferences');
    if (savedPrefs) {
      preferences = JSON.parse(savedPrefs);
      
      // Update UI elements with stored preferences
      minRatingInput.value = preferences.minRating;
      fromYearInput.value = preferences.fromYear;
      toYearInput.value = preferences.toYear;
      
      // Will update the active genre button after buttons are created
    }
  }

  // Save preferences to localStorage
  function savePreferences() {
    localStorage.setItem('cinemate-preferences', JSON.stringify(preferences));
  }

  // Apply filters and update the movie grid
  function filterMovies() {
    filteredMovies = allMovies.filter(movie => {
      // Filter by genre
      if (preferences.genre !== 'All' && !movie.genres.includes(preferences.genre)) {
        return false;
      }
      
      // Filter by rating
      if (movie.vote_average < preferences.minRating) {
        return false;
      }
      
      // Filter by year
      if (movie.year && (movie.year < preferences.fromYear || movie.year > preferences.toYear)) {
        return false;
      }
      
      return true;
    });
    
    renderMovies();
  }

  // Render the filtered movies to the grid
  function renderMovies() {
    moviesGrid.innerHTML = '';
    
    if (filteredMovies.length === 0) {
      moviesGrid.innerHTML = '<div class="no-results">No movies match your preferences. Try adjusting your filters.</div>';
      return;
    }
    
    filteredMovies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.dataset.id = movie.id;
      
      const posterUrl = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : DEFAULT_POSTER;
      const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
      
      card.innerHTML = `
        <div class="movie-poster">
          <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='${DEFAULT_POSTER}'">
        </div>
        <div class="movie-info">
          <h3>${movie.title}</h3>
          <p>${year} | ☆ ${movie.vote_average.toFixed(1)}</p>
        </div>
      `;
      
      moviesGrid.appendChild(card);
    });
  }

  // Open the movie details dialog
  function openMovieDetails(movieId) {
    currentMovieId = movieId;
    
    // Get additional movie details from the API
    fetch(`${TMDB_BASE}/movie/${movieId}?api_key=${TMDB_KEY}`)
      .then(response => response.json())
      .then(movie => {
        // Update dialog content
        dialogTitle.textContent = `${movie.title} (${movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'})`;
        dialogTagline.textContent = movie.tagline || '';
        
        const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
        const genres = movie.genres.map(g => g.name).join(', ');
        dialogRatingRuntime.textContent = `☆ ${movie.vote_average.toFixed(1)}/10 | ${runtime} | ${genres}`;
        
        dialogPoster.innerHTML = movie.poster_path
          ? `<img src="${IMG_BASE}${movie.poster_path}" alt="${movie.title}">`
          : `<img src="${DEFAULT_POSTER}" alt="${movie.title}">`;
        
        dialogOverview.textContent = movie.overview || 'No overview available.';
        
        // Get additional information for full description
        fetch(`${TMDB_BASE}/movie/${movieId}/credits?api_key=${TMDB_KEY}`)
          .then(response => response.json())
          .then(credits => {
            // Create a more detailed description with additional information
            const director = credits.crew.find(person => person.job === 'Director');
            const cast = credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
            const companies = movie.production_companies.length > 0
              ? movie.production_companies.map(c => c.name).join(', ')
              : 'No production companies listed';
            
            let fullDescription = '';
            
            if (director) {
              fullDescription += `Directed by ${director.name}. `;
            }
            
            if (cast) {
              fullDescription += `Starring ${cast}. `;
            }
            
            if (movie.budget > 0) {
              fullDescription += `Budget: $${(movie.budget / 1000000).toFixed(1)} million. `;
            }
            
            if (movie.revenue > 0) {
              fullDescription += `Box office: $${(movie.revenue / 1000000).toFixed(1)} million. `;
            }
            
            fullDescription += `\n\nProduction: ${companies}. `;
            
            if (movie.status) {
              fullDescription += `Status: ${movie.status}. `;
            }
            
            if (movie.release_date) {
              fullDescription += `Release date: ${new Date(movie.release_date).toLocaleDateString()}. `;
            }
            
            // Add website if available
            if (movie.homepage) {
              fullDescription += `\n\nOfficial website: ${movie.homepage}`;
            }
            
            dialogDescription.textContent = fullDescription;
          })
          .catch(error => {
            console.error('Error fetching movie credits:', error);
            dialogDescription.textContent = 'Additional information unavailable.';
          });
        
        // Update button status
        updateDialogButtons();
        
        // Show the dialog
        movieDialog.style.display = 'block';
      })
      .catch(error => {
        console.error('Error fetching movie details:', error);
      });
  }

  // Update watchlist/watched buttons based on localStorage
  function updateDialogButtons() {
    if (!currentMovieId) return;
    
    const watchlist = readList('watchlist');
    const history = readList('history');
    
    // Update watchlist button
    if (watchlist.includes(currentMovieId)) {
      dialogAddWatchlist.textContent = '✓ In Watchlist';
      dialogAddWatchlist.classList.add('button-confirmed');
    } else {
      dialogAddWatchlist.textContent = 'Add to Watchlist';
      dialogAddWatchlist.classList.remove('button-confirmed');
    }
    
    // Update watched button
    if (history.includes(currentMovieId)) {
      dialogMarkWatched.textContent = '✓ Watched';
      dialogMarkWatched.classList.add('button-confirmed');
    } else {
      dialogMarkWatched.textContent = 'Mark as Watched';
      dialogMarkWatched.classList.remove('button-confirmed');
    }
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Genre button clicks
    if (genreButtons) {
      genreButtons.addEventListener('click', e => {
        if (e.target.classList.contains('genre-button')) {
          // Update active class
          const buttons = genreButtons.querySelectorAll('.genre-button');
          buttons.forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
          
          // Update preferences
          preferences.genre = e.target.dataset.category;
          savePreferences();
          filterMovies();
        }
      });
      
      // Set active genre button based on saved preferences
      if (preferences.genre !== 'All') {
        const genreBtn = genreButtons.querySelector(`[data-category="${preferences.genre}"]`);
        if (genreBtn) {
          const buttons = genreButtons.querySelectorAll('.genre-button');
          buttons.forEach(btn => btn.classList.remove('active'));
          genreBtn.classList.add('active');
        }
      }
    }
    
    // Preferences toggle
    if (preferencesToggle) {
      preferencesToggle.addEventListener('click', () => {
        const prefsSection = document.querySelector('.preferences-settings');
        if (prefsSection) {
          const isVisible = prefsSection.style.display === 'block';
          prefsSection.style.display = isVisible ? 'none' : 'block';
          preferencesToggle.textContent = isVisible ? 'My Preferences' : 'Hide Preferences';
        }
      });
    }
    
    // Apply preferences button
    if (applyPreferencesBtn) {
      applyPreferencesBtn.addEventListener('click', () => {
        preferences.minRating = parseFloat(minRatingInput.value) || 0;
        preferences.fromYear = parseInt(fromYearInput.value) || 1900;
        preferences.toYear = parseInt(toYearInput.value) || 2100;
        
        savePreferences();
        filterMovies();
      });
    }
    
    // Close modal
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        movieDialog.style.display = 'none';
        currentMovieId = null;
      });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', e => {
      if (e.target === movieDialog) {
        movieDialog.style.display = 'none';
        currentMovieId = null;
      }
    });
    
    // Add to watchlist button
    if (dialogAddWatchlist) {
      dialogAddWatchlist.addEventListener('click', () => {
        if (!currentMovieId) return;
        
        const watchlist = readList('watchlist');
        if (!watchlist.includes(currentMovieId)) {
          watchlist.push(currentMovieId);
          writeList('watchlist', watchlist);
          updateDialogButtons();
          showToast('Added to watchlist!');
        } else {
          // Remove from watchlist if already there
          const newWatchlist = watchlist.filter(id => id !== currentMovieId);
          writeList('watchlist', newWatchlist);
          updateDialogButtons();
          showToast('Removed from watchlist');
        }
      });
    }
    
    // Mark as watched button
    if (dialogMarkWatched) {
      dialogMarkWatched.addEventListener('click', () => {
        if (!currentMovieId) return;
        
        const history = readList('history');
        if (!history.includes(currentMovieId)) {
          history.push(currentMovieId);
          writeList('history', history);
          updateDialogButtons();
          showToast('Marked as watched!');
        } else {
          // Remove from history if already there
          const newHistory = history.filter(id => id !== currentMovieId);
          writeList('history', newHistory);
          updateDialogButtons();
          showToast('Removed from watched history');
        }
      });
    }
    
    // Movie card click
    moviesGrid.addEventListener('click', (e) => {
      const movieCard = e.target.closest('.movie-card');
      if (movieCard) {
        const movieId = parseInt(movieCard.dataset.id);
        if (movieId) {
          openMovieDetails(movieId);
        }
      }
    });
    
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && movieDialog.style.display === 'block') {
        movieDialog.style.display = 'none';
        currentMovieId = null;
      }
    });
  }
  
  // Show toast notification
  function showToast(message) {
    let toast = document.getElementById('toast-notification');
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(213, 31, 38, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 1500;
        opacity: 0;
        transition: opacity 0.3s ease;
        font-weight: bold;
      `;
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3000);
  }

  // Initialize the page
  init();
});