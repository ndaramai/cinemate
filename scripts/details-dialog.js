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

// Movie Details Dialog Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Cache DOM elements
  const movieDialog = document.getElementById('movieDialog');
  const modalClose = document.getElementById('modalClose');
  
  // Current movie being displayed
  let currentMovieId = null;
  
  // Close dialog when X is clicked
  if (modalClose) {
    modalClose.addEventListener('click', function() {
      closeMovieDialog();
    });
  }

  // Close dialog when clicking outside of modal content
  window.addEventListener('click', function(e) {
    if (e.target === movieDialog) {
      closeMovieDialog();
    }
  });

  // Escape key to close dialog
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && movieDialog && movieDialog.style.display === 'block') {
      closeMovieDialog();
    }
  });

  // Function to close the movie dialog
  function closeMovieDialog() {
    if (movieDialog) {
      movieDialog.style.display = 'none';
      
      // Re-enable body scrolling
      document.body.style.overflow = '';
      
      // Reset current movie
      currentMovieId = null;
    }
  }
  
  // Helper function to create a toast notification
  window.showToast = function(message) {
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
  };
});