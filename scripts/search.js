// Search functionality for CineMate
document.addEventListener('DOMContentLoaded', function() {
    // TMDb configuration
    const TMDB_KEY = '4c84ecd36279188e533841ba4c85cf17';
    const TMDB_BASE = 'https://api.themoviedb.org/3';
    const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
    const DEFAULT_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster';
    
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchForm = document.querySelector('.search-bar');
    const resultsContainer = document.getElementById('search-results');
    const searchSection = document.querySelector('.search-section');
    const filterToggle = document.getElementById('filter-toggle');
    const filtersContainer = document.getElementById('search-filters');
    const yearFilter = document.getElementById('year-filter');
    const genreFilter = document.getElementById('genre-filter');
    const sortFilter = document.getElementById('sort-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const loadMoreBtn = document.getElementById('load-more');
    const lastModification = document.getElementById('last-modification');
    
    // Application state
    let currentQuery = '';
    let currentPage = 1;
    let totalPages = 0;
    let isLoading = false;
    let searchResults = [];
    let filters = {
      year: '',
      genre: '',
      sort: 'popularity.desc'
    };
    let genresMap = {}; // Will store genre ID to name mapping
    
    // Update last modification date
    if (lastModification) {
      lastModification.textContent = document.lastModified;
    }
    
    // Initialize the page
    initialize();
    
    /**
     * Initialize the search functionality
     */
    function initialize() {
      // Load genres map for filtering
      fetchGenres();
      
      // Set up event listeners
      setupEventListeners();
      
      // Check if we have a query in URL params
      const urlParams = new URLSearchParams(window.location.search);
      const queryParam = urlParams.get('query');
      
      if (queryParam) {
        // Set the search input value
        if (searchInput) searchInput.value = queryParam;
        
        // Perform search
        currentQuery = queryParam;
        performSearch(currentQuery);
      }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
      // Search form submission
      if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
          e.preventDefault();
          submitSearch();
        });
      }
      
      // Search button click
      if (searchButton) {
        searchButton.addEventListener('click', function() {
          submitSearch();
        });
      }
      
      // Search input enter key
      if (searchInput) {
        searchInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            submitSearch();
          }
        });
      }
      
      // Filter toggle
      if (filterToggle) {
        filterToggle.addEventListener('click', function() {
          if (filtersContainer) {
            filtersContainer.classList.toggle('show');
            
            // Update button text
            this.textContent = filtersContainer.classList.contains('show') 
              ? 'Hide Filters' 
              : 'Show Filters';
          }
        });
      }
      
      // Apply filters
      if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
          // Update filters
          if (yearFilter) filters.year = yearFilter.value;
          if (genreFilter) filters.genre = genreFilter.value;
          if (sortFilter) filters.sort = sortFilter.value;
          
          // Reset to first page
          currentPage = 1;
          
          // If we have a search query, perform search again with new filters
          if (currentQuery) {
            performSearch(currentQuery);
          }
        });
      }
      
      // Clear filters
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
          // Reset filters
          filters = {
            year: '',
            genre: '',
            sort: 'popularity.desc'
          };
          
          // Reset form inputs
          if (yearFilter) yearFilter.value = '';
          if (genreFilter) genreFilter.value = '';
          if (sortFilter) sortFilter.value = 'popularity.desc';
          
          // Reset to first page
          currentPage = 1;
          
          // If we have a search query, perform search again with new filters
          if (currentQuery) {
            performSearch(currentQuery);
          }
        });
      }
      
      // Load more results
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
          if (!isLoading && currentPage < totalPages) {
            currentPage++;
            performSearch(currentQuery, true); // append = true
          }
        });
      }
    }
    
    /**
     * Submit search from the form
     */
    function submitSearch() {
      if (!searchInput) return;
      
      const query = searchInput.value.trim();
      if (query) {
        // Track search in history
        if (typeof trackSearch === 'function') {
          trackSearch(query);
        } else if (typeof window.addToHistory === 'function') {
          window.addToHistory({
            action: 'search',
            title: `Search: "${query}"`,
            details: `Searched for "${query}"`
          });
        }
        
        // Update URL with query parameter (for sharing/bookmarking)
        const url = new URL(window.location);
        url.searchParams.set('query', query);
        window.history.pushState({}, '', url);
        
        // Reset to first page
        currentPage = 1;
        
        // Perform search
        currentQuery = query;
        performSearch(query);
      }
    }
    
    /**
     * Perform search against TMDb API
     * @param {string} query - Search query
     * @param {boolean} append - Whether to append results (for pagination)
     */
    function performSearch(query, append = false) {
      if (!query || isLoading) return;
      
      // Show loading state
      isLoading = true;
      if (!append) {
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div class="loading">Searching for movies...</div>';
        }
        if (loadMoreBtn) {
          loadMoreBtn.style.display = 'none';
        }
      } else {
        if (loadMoreBtn) {
          loadMoreBtn.textContent = 'Loading more...';
          loadMoreBtn.disabled = true;
        }
      }
      
      // Check if query looks like a TMDb ID
      if (/^\d+$/.test(query)) {
        // It's numeric, try to fetch by ID first
        fetchMovieById(query, append);
      } else {
        // Regular search by title/keyword
        fetchMoviesByQuery(query, append);
      }
    }
    
    /**
     * Fetch movie by ID
     * @param {string} id - Movie ID
     * @param {boolean} append - Whether to append results
     */
    function fetchMovieById(id, append) {
      fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Movie not found');
          }
          return response.json();
        })
        .then(movie => {
          // Format result for display
          const result = [{
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date,
            overview: movie.overview,
            genre_ids: movie.genres.map(g => g.id)
          }];
          
          // Display result
          displayResults(result, append);
          
          // Set pagination info
          totalPages = 1;
          updatePagination();
        })
        .catch(error => {
          console.log('Failed to fetch by ID, trying regular search:', error);
          // Fall back to regular search
          fetchMoviesByQuery(id, append);
        });
    }
    
    /**
     * Fetch movies by query string
     * @param {string} query - Search query
     * @param {boolean} append - Whether to append results
     */
    function fetchMoviesByQuery(query, append) {
      // Build search URL with filters
      let searchUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`;
      
      // Add year filter if specified
      if (filters.year) {
        searchUrl += `&primary_release_year=${filters.year}`;
      }
      
      // Add genre filter if specified
      if (filters.genre) {
        searchUrl += `&with_genres=${filters.genre}`;
      }
      
      // Fetch search results
      fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
          // Display results
          displayResults(data.results, append);
          
          // Update pagination info
          totalPages = data.total_pages;
          updatePagination();
          
          // If we have results but used filters, sort them
          if (data.results.length > 0 && filters.sort) {
            // We need to make another request for discovery with sorting
            fetchMoviesWithSorting(query, append);
          }
        })
        .catch(error => {
          console.error('Error fetching search results:', error);
          if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="error">Error fetching search results. Please try again.</div>';
          }
          isLoading = false;
        });
    }
    
    /**
     * Fetch movies with sorting (requires discover API)
     * @param {string} query - Search query
     * @param {boolean} append - Whether to append results
     */
    function fetchMoviesWithSorting(query, append) {
      // For sorting, we need to use the discover API
      let discoverUrl = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&page=${currentPage}&sort_by=${filters.sort}`;
      
      // Add year filter if specified
      if (filters.year) {
        discoverUrl += `&primary_release_year=${filters.year}`;
      }
      
      // Add genre filter if specified
      if (filters.genre) {
        discoverUrl += `&with_genres=${filters.genre}`;
      }
      
      // Add keyword search
      discoverUrl += `&with_keywords=${encodeURIComponent(query)}`;
      
      fetch(discoverUrl)
        .then(response => response.json())
        .then(data => {
          // Only use these results if they returned something
          if (data.results && data.results.length > 0) {
            displayResults(data.results, append);
            
            // Update pagination info
            totalPages = data.total_pages;
            updatePagination();
          }
        })
        .catch(error => {
          console.error('Error fetching sorted results:', error);
          // We already displayed unsorted results, so no need to show error
        });
    }
    
    /**
     * Display search results
     * @param {Array} results - Search results
     * @param {boolean} append - Whether to append results
     */
    function displayResults(results, append) {
      if (!resultsContainer) return;
      
      // Reset container if not appending
      if (!append) {
        resultsContainer.innerHTML = '';
        searchResults = [];
      }
      
      // Check if we have results
      if (!results || results.length === 0) {
        if (!append) {
          resultsContainer.innerHTML = '<div class="no-results">No movies found. Try a different search term or filters.</div>';
        }
        isLoading = false;
        return;
      }
      
      // Make search section visible (in case it was hidden)
      if (searchSection) {
        searchSection.style.display = 'block';
      }
      
      // Create results grid if it doesn't exist
      let resultsGrid = resultsContainer.querySelector('.results-grid');
      if (!resultsGrid) {
        resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';
        resultsContainer.appendChild(resultsGrid);
      }
      
      // Add results to the grid
      results.forEach(movie => {
        // Skip duplicates when appending
        if (append && searchResults.some(r => r.id === movie.id)) {
          return;
        }
        
        // Add to our tracked results
        searchResults.push(movie);
        
        // Create movie card
        const card = createMovieCard(movie);
        resultsGrid.appendChild(card);
      });
      
      // Update loading state
      isLoading = false;
      
      // Scroll to results if we're not appending
      if (!append && searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    /**
     * Create a movie card element
     * @param {Object} movie - Movie data
     * @return {HTMLElement} Movie card element
     */
    function createMovieCard(movie) {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.dataset.id = movie.id;
      
      const posterUrl = movie.poster_path 
        ? `${IMG_BASE}${movie.poster_path}` 
        : DEFAULT_POSTER;
      
      const year = movie.release_date 
        ? new Date(movie.release_date).getFullYear() 
        : 'N/A';
      
      const rating = movie.vote_average
        ? `★ ${movie.vote_average.toFixed(1)}`
        : 'Not rated';
      
      // Get genre names
      const genres = movie.genre_ids
        ? movie.genre_ids.slice(0, 2).map(id => genresMap[id] || '').filter(Boolean).join(', ')
        : '';
      
      card.innerHTML = `
        <div class="movie-poster">
          <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='${DEFAULT_POSTER}'">
        </div>
        <div class="movie-info">
          <h3 title="${movie.title}">${movie.title}</h3>
          <div class="movie-meta">
            <span class="year">${year}</span>
            <span class="rating">${rating}</span>
          </div>
          ${genres ? `<div class="movie-genres">${genres}</div>` : ''}
          <p class="movie-overview">${movie.overview ? truncateText(movie.overview, 120) : 'No overview available.'}</p>
        </div>
        <div class="movie-actions">
          <button class="action-btn details-btn">Details</button>
          <button class="action-btn watchlist-btn">+ Watchlist</button>
        </div>
      `;
      
      // Set up event listeners for the card
      setupCardEventListeners(card, movie);
      
      return card;
    }
    
    /**
     * Set up event listeners for a movie card
     * @param {HTMLElement} card - Movie card element
     * @param {Object} movie - Movie data
     */
    function setupCardEventListeners(card, movie) {
      // Entire card click event (view details)
      card.addEventListener('click', function(e) {
        // Ignore clicks on buttons
        if (e.target.tagName === 'BUTTON') return;
        
        // Track details view in history
        if (typeof trackDetailsView === 'function') {
          trackDetailsView(movie);
        } else if (typeof window.addToHistory === 'function') {
          window.addToHistory({
            action: 'details_view',
            title: movie.title,
            movieId: movie.id,
            details: `Viewed details for "${movie.title}"`
          });
        }
        
        // Open movie details (you can replace this with your own implementation)
        openMovieDetails(movie.id);
      });
      
      // Details button
      const detailsBtn = card.querySelector('.details-btn');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent card click
          
          // Track details view in history
          if (typeof trackDetailsView === 'function') {
            trackDetailsView(movie);
          } else if (typeof window.addToHistory === 'function') {
            window.addToHistory({
              action: 'details_view',
              title: movie.title,
              movieId: movie.id,
              details: `Viewed details for "${movie.title}"`
            });
          }
          
          // Open movie details
          openMovieDetails(movie.id);
        });
      }
      
      // Add to watchlist button
      const watchlistBtn = card.querySelector('.watchlist-btn');
      if (watchlistBtn) {
        watchlistBtn.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent card click
          
          // Toggle watchlist status
          const isInWatchlist = toggleWatchlist(movie);
          
          // Update button text
          this.textContent = isInWatchlist ? '✓ In Watchlist' : '+ Watchlist';
          
          // Add appropriate class
          if (isInWatchlist) {
            this.classList.add('in-watchlist');
          } else {
            this.classList.remove('in-watchlist');
          }
          
          // Show toast notification
          showToast(isInWatchlist 
            ? `Added "${movie.title}" to watchlist` 
            : `Removed "${movie.title}" from watchlist`
          );
        });
        
        // Check initial watchlist status
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        if (watchlist.includes(movie.id)) {
          watchlistBtn.textContent = '✓ In Watchlist';
          watchlistBtn.classList.add('in-watchlist');
        }
      }
    }
    
    /**
     * Open movie details
     * @param {number} movieId - Movie ID
     */
    function openMovieDetails(movieId) {
      // Save current search results in sessionStorage
      sessionStorage.setItem('searchResults', JSON.stringify(searchResults));
      sessionStorage.setItem('searchQuery', currentQuery);
      
      // Redirect to movie details page
      window.location.href = `where-to-watch.html?id=${movieId}`;
    }
    
    /**
     * Toggle movie in watchlist
     * @param {Object} movie - Movie data
     * @return {boolean} Whether the movie is now in the watchlist
     */
    function toggleWatchlist(movie) {
      // Get current watchlist
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      
      // Check if movie is already in watchlist
      const index = watchlist.indexOf(movie.id);
      
      if (index === -1) {
        // Add to watchlist
        watchlist.push(movie.id);
        
        // Track in history
        if (typeof trackAddToWatchlist === 'function') {
          trackAddToWatchlist(movie);
        } else if (typeof window.addToHistory === 'function') {
          window.addToHistory({
            action: 'watchlist_add',
            title: movie.title,
            movieId: movie.id,
            details: `Added "${movie.title}" to watchlist`
          });
        }
        
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        return true;
      } else {
        // Remove from watchlist
        watchlist.splice(index, 1);
        
        // Track in history
        if (typeof trackRemoveFromWatchlist === 'function') {
          trackRemoveFromWatchlist(movie);
        } else if (typeof window.addToHistory === 'function') {
          window.addToHistory({
            action: 'watchlist_remove',
            title: movie.title,
            movieId: movie.id,
            details: `Removed "${movie.title}" from watchlist`
          });
        }
        
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        return false;
      }
    }
    
    /**
     * Update pagination controls
     */
    function updatePagination() {
      if (!loadMoreBtn) return;
      
      if (currentPage < totalPages) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = 'Load More Results';
        loadMoreBtn.disabled = false;
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }
    
    /**
     * Fetch genres for filtering
     */
    function fetchGenres() {
      fetch(`${TMDB_BASE}/genre/movie/list?api_key=${TMDB_KEY}`)
        .then(response => response.json())
        .then(data => {
          // Build genre map
          data.genres.forEach(genre => {
            genresMap[genre.id] = genre.name;
          });
          
          // Populate genre filter dropdown
          if (genreFilter) {
            data.genres.forEach(genre => {
              const option = document.createElement('option');
              option.value = genre.id;
              option.textContent = genre.name;
              genreFilter.appendChild(option);
            });
          }
        })
        .catch(error => {
          console.error('Error fetching genres:', error);
        });
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
    
    /**
     * Truncate text to a certain length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @return {string} Truncated text
     */
    function truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }
  });