//
/**
 * Initialize the history tracking system
 */
(function() {
    // Define global addToHistory function if not already available
    if (typeof window.addToHistory !== 'function') {
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
        
        // Log for debugging (remove in production)
        console.log('Added to history:', item);
      };
    }
    
    // Track initial page view
    const pageName = document.title.replace('CineMate — ', '');
    window.addToHistory({
      action: 'page_view',
      title: `Visited ${pageName}`,
      details: `Viewed the ${pageName} page`
    });
    
    // Setup global search tracking
    document.addEventListener('DOMContentLoaded', function() {
      const searchInput = document.querySelector('.search-bar input');
      const searchButton = document.querySelector('.search-bar button');
      
      if (searchInput && searchButton) {
        // Track search when button is clicked
        searchButton.addEventListener('click', function() {
          const query = searchInput.value.trim();
          if (query) {
            window.addToHistory({
              action: 'search',
              title: `Search: "${query}"`,
              details: `Searched for "${query}"`
            });
          }
        });
        
        // Track search when Enter key is pressed
        searchInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
              window.addToHistory({
                action: 'search',
                title: `Search: "${query}"`,
                details: `Searched for "${query}"`
              });
            }
          }
        });
      }
    });
  })();
  
  /**
   * Show toast notification
   * @param {string} message - Message to display
   */
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
  
  /**
   * Track when a movie is added to watchlist
   * @param {Object} movie - Movie object
   */
  function trackAddToWatchlist(movie) {
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
    window.addToHistory({
      action: 'search',
      title: `Search: "${query}"`,
      details: `Searched for "${query}"`
    });
  }