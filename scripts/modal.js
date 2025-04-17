// Movie Details Modal Functionality
(function() {
  // TMDb configuration
  const TMDB_KEY = '4c84ecd36279188e533841ba4c85cf17';
  const TMDB_BASE = 'https://api.themoviedb.org/3';
  const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
  const DEFAULT_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster';
  
  // Current movie in modal
  let currentMovie = null;
  
  // Initialize when the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    initializeModal();
  });
  
  /**
   * Initialize the modal functionality
   */
  function initializeModal() {
    // Get modal elements
    const modal = document.getElementById('movie-details-modal');
    const closeBtn = modal ? modal.querySelector('.close-modal') : null;
    
    // Set up close button if modal exists
    if (modal && closeBtn) {
      closeBtn.addEventListener('click', function() {
        closeModal();
      });
      
      // Close modal when clicking outside content
      window.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeModal();
        }
      });
      
      // Close with escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
          closeModal();
        }
      });
    }
    
    // Make global function available
    window.openMovieModal = openMovieModal;
  }
  
  /**
   * Open the movie details modal
   * @param {number} movieId - Movie ID to display
   */
  function openMovieModal(movieId) {
    const modal = document.getElementById('movie-details-modal');
    if (!modal) return;
    
    // Show modal with loading indicator
    modal.style.display = 'block';
    
    // Set modal content to loading state
    modal.querySelector('.modal-body').innerHTML = `
      <div class="modal-loading">
        <div class="spinner"></div>
      </div>
    `;
    
    // Fetch movie details
    fetchMovieDetails(movieId);
  }
  
  /**
   * Close the movie details modal
   */
  function closeModal() {
    const modal = document.getElementById('movie-details-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    // Reset current movie
    currentMovie = null;
  }
  
  /**
   * Fetch movie details from TMDb
   * @param {number} movieId - Movie ID to fetch
   */
  function fetchMovieDetails(movieId) {
    // Fetch basic movie details
    fetch(`${TMDB_BASE}/movie/${movieId}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Movie not found');
        }
        return response.json();
      })
      .then(movie => {
        // Store current movie
        currentMovie = movie;
        
        // Display movie details
        displayMovieDetails(movie);
        
        // Track in history if available
        if (typeof window.addToHistory === 'function') {
          window.addToHistory({
            action: 'details_view',
            title: movie.title,
            movieId: movie.id,
            details: `Viewed details for "${movie.title}"`
          });
        }
      })
      .catch(error => {
        console.error('Error fetching movie details:', error);
        displayError();
      });
  }
  
  /**
   * Display movie details in the modal
   * @param {Object} movie - Movie data
   */
  function displayMovieDetails(movie) {
    const modal = document.getElementById('movie-details-modal');
    if (!modal) return;
    
    // Get US certification if available
    let certification = '';
    if (movie.release_dates && movie.release_dates.results) {
      const usReleases = movie.release_dates.results.find(country => country.iso_3166_1 === 'US');
      if (usReleases && usReleases.release_dates && usReleases.release_dates.length > 0) {
        const certificationReleases = usReleases.release_dates.filter(rd => rd.certification);
        if (certificationReleases.length > 0) {
          certification = certificationReleases[0].certification;
        }
      }
    }
    
    // Format release date
    const releaseDate = movie.release_date ? 
      new Date(movie.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 
      'Unknown';
    
    // Format runtime
    const runtime = movie.runtime ? 
      `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 
      'Unknown';
    
    // Get director
    let director = 'Unknown';
    if (movie.credits && movie.credits.crew) {
      const directors = movie.credits.crew.filter(person => person.job === 'Director');
      if (directors.length > 0) {
        director = directors.map(d => d.name).join(', ');
      }
    }
    
    // Get top cast
    let cast = [];
    if (movie.credits && movie.credits.cast) {
      cast = movie.credits.cast.slice(0, 5).map(actor => actor.name);
    }
    
    // Format budget and revenue
    const formatMoney = (amount) => {
      if (!amount || amount === 0) return 'Not available';
      return '$' + amount.toLocaleString();
    };
    
    // Poster URL
    const posterUrl = movie.poster_path ? 
      `${IMG_BASE}${movie.poster_path}` : 
      DEFAULT_POSTER;
    
    // Create modal content
    const modalContent = `
      <div class="modal-poster">
        <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='${DEFAULT_POSTER}'">
      </div>
      <div class="modal-info">
        <h2 class="modal-title">${movie.title}</h2>
        <div class="modal-meta">
          ${movie.release_date ? `<span class="year">${new Date(movie.release_date).getFullYear()}</span>` : ''}
          ${certification ? `<span class="certification">${certification}</span>` : ''}
          <span class="runtime">${runtime}</span>
          <span class="rating">★ ${movie.vote_average.toFixed(1)}</span>
        </div>
        
        <div class="modal-genres">
          ${movie.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
        </div>
        
        <div class="modal-overview">
          <h3>Overview</h3>
          <p>${movie.overview || 'No overview available.'}</p>
        </div>
        
        <div class="modal-details">
          <h3>Details</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Director</span>
              <span class="detail-value">${director}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Cast</span>
              <span class="detail-value">${cast.length > 0 ? cast.join(', ') : 'Not available'}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Release Date</span>
              <span class="detail-value">${releaseDate}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Original Language</span>
              <span class="detail-value">${getLanguageName(movie.original_language)}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Budget</span>
              <span class="detail-value">${formatMoney(movie.budget)}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Revenue</span>
              <span class="detail-value">${formatMoney(movie.revenue)}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button id="modal-watchlist-btn" class="modal-btn watchlist-btn">Add to Watchlist</button>
          <button id="modal-watch-btn" class="modal-btn watch-btn">Where to Watch</button>
        </div>
      </div>
    `;
    
    // Set modal content
    modal.querySelector('.modal-body').innerHTML = modalContent;
    
    // Check if movie is in watchlist
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const watchlistBtn = document.getElementById('modal-watchlist-btn');
    
    if (watchlistBtn) {
      if (watchlist.includes(movie.id)) {
        watchlistBtn.textContent = 'Remove from Watchlist';
        watchlistBtn.classList.add('in-watchlist');
      }
      
      // Add watchlist button functionality
      watchlistBtn.addEventListener('click', function() {
        toggleWatchlist(movie);
      });
    }
    
    // Add where to watch button functionality
    const watchBtn = document.getElementById('modal-watch-btn');
    if (watchBtn) {
      watchBtn.addEventListener('click', function() {
        // Track in history if available
        if (typeof window.addToHistory === 'function') {
          window.addToHistory({
            action: 'where_to_watch',
            title: movie.title,
            movieId: movie.id,
            details: `Checked where to watch "${movie.title}"`
          });
        }
        
        // Redirect to where-to-watch page
        window.location.href = `where-to-watch.html?id=${movie.id}`;
      });
    }
  }
  
  /**
   * Display error message in modal
   */
  function displayError() {
    const modal = document.getElementById('movie-details-modal');
    if (!modal) return;
    
    modal.querySelector('.modal-body').innerHTML = `
      <div class="modal-error">
        <h3>Error Loading Movie</h3>
        <p>Sorry, we couldn't load the movie details. Please try again later.</p>
        <button class="modal-btn close-error-btn">Close</button>
      </div>
    `;
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.close-error-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
  }
  
  /**
   * Toggle movie in watchlist
   * @param {Object} movie - Movie data
   */
  function toggleWatchlist(movie) {
    // Get current watchlist
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const watchlistBtn = document.getElementById('modal-watchlist-btn');
    
    // Check if movie is already in watchlist
    const index = watchlist.indexOf(movie.id);
    
    if (index === -1) {
      // Add to watchlist
      watchlist.push(movie.id);
      
      // Update button
      if (watchlistBtn) {
        watchlistBtn.textContent = 'Remove from Watchlist';
        watchlistBtn.classList.add('in-watchlist');
      }
      
      // Show toast
      showToast(`Added "${movie.title}" to watchlist`);
      
      // Track in history if available
      if (typeof window.addToHistory === 'function') {
        window.addToHistory({
          action: 'watchlist_add',
          title: movie.title,
          movieId: movie.id,
          details: `Added "${movie.title}" to watchlist`
        });
      }
    } else {
      // Remove from watchlist
      watchlist.splice(index, 1);
      
      // Update button
      if (watchlistBtn) {
        watchlistBtn.textContent = 'Add to Watchlist';
        watchlistBtn.classList.remove('in-watchlist');
      }
      
      // Show toast
      showToast(`Removed "${movie.title}" from watchlist`);
      
      // Track in history if available
      if (typeof window.addToHistory === 'function') {
        window.addToHistory({
          action: 'watchlist_remove',
          title: movie.title,
          movieId: movie.id,
          details: `Removed "${movie.title}" from watchlist`
        });
      }
    }
    
    // Save updated watchlist
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    
    // Update any movie cards on the page
    updateMovieCards(movie.id, index === -1);
  }
  
  /**
   * Update movie cards on the page
   * @param {number} movieId - Movie ID
   * @param {boolean} inWatchlist - Whether movie is in watchlist
   */
  function updateMovieCards(movieId, inWatchlist) {
    // Find all movie cards with this ID
    const cards = document.querySelectorAll(`.movie-card[data-id="${movieId}"]`);
    
    cards.forEach(card => {
      // Find the watchlist button
      const watchlistBtn = card.querySelector('.watchlist-btn');
      if (watchlistBtn) {
        if (inWatchlist) {
          watchlistBtn.textContent = '✓ Watchlist';
          watchlistBtn.classList.add('in-watchlist');
        } else {
          watchlistBtn.textContent = '+ Watchlist';
          watchlistBtn.classList.remove('in-watchlist');
        }
      }
    });
  }
  
  /**
   * Get language name from language code
   * @param {string} langCode - Language code
   * @return {string} Language name
   */
  function getLanguageName(langCode) {
    const languages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'nl': 'Dutch',
      'tr': 'Turkish',
      'pl': 'Polish',
      'id': 'Indonesian',
      'th': 'Thai',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'el': 'Greek',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'vi': 'Vietnamese',
      'uk': 'Ukrainian',
      'fa': 'Persian',
      'he': 'Hebrew'
    };
    
    return languages[langCode] || langCode;
  }
  
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
})();