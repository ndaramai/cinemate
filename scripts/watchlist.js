//

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


// Update the addToWatchlist function:
function addToWatchlist(movie) 

{

  trackDetailsView(movie);
  trackWhereToWatch(movie);
  trackAddToWatchlist(movie);
}


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

// Watchlist page functionality
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const watchlistContainer = document.getElementById('watchlist-container');
  const lastModification = document.getElementById('last-modification');
  
  // TMDb API configuration
  const TMDB_KEY = '4c84ecd36279188e533841ba4c85cf17';
  const TMDB_BASE = 'https://api.themoviedb.org/3';
  const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
  const DEFAULT_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster';
  
  // Update last modification date if element exists
  if (lastModification) {
    lastModification.textContent = document.lastModified;
  }

  // Initialize the page
  loadWatchlist();
  
  // Load watchlist from localStorage and display movies
  function loadWatchlist() {
    // Clear existing content
    if (!watchlistContainer) return;
    watchlistContainer.innerHTML = '<div class="loading">Loading your watchlist...</div>';
    
    // Get watchlist IDs from localStorage
    const watchlistIds = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    if (watchlistIds.length === 0) {
      watchlistContainer.innerHTML = `
        <div class="empty-list">
          <p>Your watchlist is empty.</p>
          <p>Add movies from the "For You" page to see them here.</p>
        </div>
      `;
      return;
    }
    
    // Create a container for the movies
    const moviesGrid = document.createElement('div');
    moviesGrid.className = 'movies-grid';
    watchlistContainer.innerHTML = '';
    watchlistContainer.appendChild(moviesGrid);
    
    // Fetch details for each movie
    let loadedCount = 0;
    
    watchlistIds.forEach(movieId => {
      fetch(`${TMDB_BASE}/movie/${movieId}?api_key=${TMDB_KEY}`)
        .then(response => response.json())
        .then(movie => {
          // Add movie card to the grid
          const movieCard = createMovieCard(movie, movieId);
          moviesGrid.appendChild(movieCard);
          
          // Update loading status
          loadedCount++;
          if (loadedCount === watchlistIds.length) {
            // All movies loaded
            const loadingEl = watchlistContainer.querySelector('.loading');
            if (loadingEl) loadingEl.remove();
          }
        })
        .catch(error => {
          console.error(`Error fetching movie ${movieId}:`, error);
          loadedCount++;
          
          // If all attempts are complete, check if we need to show empty state
          if (loadedCount === watchlistIds.length && moviesGrid.children.length === 0) {
            watchlistContainer.innerHTML = `
              <div class="error">
                <p>Failed to load your watchlist. Please try again later.</p>
              </div>
            `;
          }
        });
    });
  }
  
// Create a movie card with improved title display
function createMovieCard(movie, movieId) {
  const card = document.createElement('div');
  card.className = 'watchlist-card';
  card.dataset.id = movieId;
  
  const posterUrl = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : DEFAULT_POSTER;
  const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  
  card.innerHTML = `
    <div class="movie-poster">
      <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='${DEFAULT_POSTER}'">
    </div>
    <div class="movie-info">
      <h3 title="${movie.title}">${movie.title}</h3>
      <p>${year} | ☆ ${rating}</p>
    </div>
    <button class="remove-btn" title="Remove from Watchlist">×</button>
    <button class="watch-now-btn">Watch Now</button>
  `;
  
  // Add click event to the movie card - redirect to where to watch
  card.addEventListener('click', function(e) {
    // Don't trigger if clicking the remove button
    if (e.target.classList.contains('remove-btn')) return;
    if (e.target.classList.contains('watch-now-btn')) return; // Handle in separate listener
    
    // Redirect to where to watch page
    redirectToWhereToWatch(movie);
  });
  
  // Add click event to the remove button
  const removeBtn = card.querySelector('.remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent card click
      removeFromWatchlist(movieId);
    });
  }
  
  // Add click event to the watch now button
  const watchNowBtn = card.querySelector('.watch-now-btn');
  if (watchNowBtn) {
    watchNowBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent card click
      redirectToWhereToWatch(movie);
    });
  }
  
  return card;
}
  
  // Redirect to the "where to watch" page
  function redirectToWhereToWatch(movie) {
    // First check if the movie has watch providers data
    fetch(`${TMDB_BASE}/movie/${movie.id}/watch/providers?api_key=${TMDB_KEY}`)
      .then(response => response.json())
      .then(data => {
        // Store provider data in sessionStorage for use on the watch page
        sessionStorage.setItem('currentMovie', JSON.stringify({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          providers: data.results
        }));
        
        // Redirect to watch page
        window.location.href = `where-to-watch.html?id=${movie.id}`;
      })
      .catch(error => {
        console.error('Error fetching watch providers:', error);
        // Still redirect even if we couldn't get providers
        window.location.href = `where-to-watch.html?id=${movie.id}`;
      });
  }
  
  // Remove a movie from the watchlist
  function removeFromWatchlist(movieId) {
    // Get current watchlist
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    // Remove the movie
    const newWatchlist = watchlist.filter(id => id !== movieId);
    
    // Save updated watchlist
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    
    // Show confirmation toast
    showToast('Movie removed from watchlist');
    
    // Find and remove the card with animation
    const card = document.querySelector(`.watchlist-card[data-id="${movieId}"]`);
    if (card) {
      card.style.transition = 'opacity 0.3s, transform 0.3s';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        card.remove();
        
        // Check if watchlist is now empty
        const moviesGrid = document.querySelector('.movies-grid');
        if (moviesGrid && moviesGrid.children.length === 0) {
          loadWatchlist(); // Reload to show empty state
        }
      }, 300);
    }
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
});