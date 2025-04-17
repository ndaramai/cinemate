// Search Results functionality for CineMate
document.addEventListener('DOMContentLoaded', function() {
    // TMDb configuration
    const TMDB_KEY = '4c84ecd36279188e533841ba4c85cf17';
    const TMDB_BASE = 'https://api.themoviedb.org/3';
    const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
    const DEFAULT_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster';
    
    // DOM Elements
    const queryDisplay = document.getElementById('query-display');
    const resultsContainer = document.getElementById('results-container');
    const sortSelect = document.getElementById('sort-select');
    const loadMoreBtn = document.getElementById('load-more');
    const lastModification = document.getElementById('last-modification');
    const searchInput = document.getElementById('search-input');
    
    // Search state
    let currentQuery = '';
    let currentPage = 1;
    let totalPages = 0;
    let isLoading = false;
    let sortBy = 'popularity.desc';
    
    // Set last modification date
    if (lastModification) {
      lastModification.textContent = document.lastModified;
    }
    
    // Initialize search from URL parameters
    initializeSearch();
    
    // Set up event listeners
    setupEventListeners();
    
    /**
     * Initialize search from URL parameters
     */
    function initializeSearch() {
      // Get query from URL
      const urlParams = new URLSearchParams(window.location.search);
      const queryParam = urlParams.get('query');
      
      if (queryParam) {
        currentQuery = queryParam;
        
        // Display the query
        if (queryDisplay) {
          queryDisplay.textContent = currentQuery;
        }
        
        // Set search input value
        if (searchInput) {
          searchInput.value = currentQuery;
        }
        
        // Perform search
        performSearch(false);
      } else {
        // No query provided
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div class="no-results">Enter a search term to find movies</div>';
        }
        
        if (loadMoreBtn) {
          loadMoreBtn.style.display = 'none';
        }
      }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
      // Sort select change
      if (sortSelect) {
        sortSelect.addEventListener('change', function() {
          sortBy = this.value;
          currentPage = 1; // Reset to first page
          performSearch(false); // Don't append, replace
        });
      }
      
      // Load more button
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
          if (!isLoading && currentPage < totalPages) {
            currentPage++;
            performSearch(true); // Append results
          }
        });
      }
    }
    
    /**
     * Perform search against TMDb API
     * @param {boolean} append - Whether to append results (for pagination)
     */
    function performSearch(append) {
      if (!currentQuery || isLoading) return;
      
      // Update loading state
      isLoading = true;
      
      // Show loading state
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
      
      // Build search URL
      let searchUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
      
      // If the query is numeric and looks like a TMDb ID
      if (/^\d+$/.test(currentQuery)) {
        // Try to fetch by ID first
        fetchMovieById(currentQuery, append);
        return;
      }
      
      // Regular search
      fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
          if (data.results && data.results.length > 0) {
            // Display results
            displayResults(data.results, append);
            
            // Set total pages for pagination
            totalPages = data.total_pages;
            updatePagination();
            
            // If sorting is not by popularity (default), perform another search with discovery API
            if (sortBy !== 'popularity.desc') {
              fetchSortedResults(append);
            }
          } else {
            // No results found
            if (!append) {
              if (resultsContainer) {
                resultsContainer.innerHTML = '<div class="no-results">No movies found. Try a different search term.</div>';
              }
              
              if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
              }
            }
            
            isLoading = false;
          }
        })
        .catch(error => {
          console.error('Error fetching search results:', error);
          
          if (!append) {
            if (resultsContainer) {
              resultsContainer.innerHTML = '<div class="error">Error loading results. Please try again.</div>';
            }
            
            if (loadMoreBtn) {
              loadMoreBtn.style.display = 'none';
            }
          } else {
            if (loadMoreBtn) {
              loadMoreBtn.textContent = 'Load More Results';
              loadMoreBtn.disabled = false;
            }
          }
          
          isLoading = false;
        });
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
          let searchUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
          
          fetch(searchUrl)
            .then(response => response.json())
            .then(data => {
              if (data.results && data.results.length > 0) {
                displayResults(data.results, append);
                totalPages = data.total_pages;
                updatePagination();
              } else {
                if (!append) {
                  if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="no-results">No movies found. Try a different search term.</div>';
                  }
                  
                  if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                  }
                }
              }
              isLoading = false;
            })
            .catch(error => {
              console.error('Error in fallback search:', error);
              isLoading = false;
            });
        });
    }
    
    /**
     * Fetch sorted results using discover API
     * @param {boolean} append - Whether to append results
     */
    function fetchSortedResults(append) {
      let discoverUrl = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&page=${currentPage}&sort_by=${sortBy}`;
      
      // Add query as a keyword search
      discoverUrl += `&with_keywords=${encodeURIComponent(currentQuery)}`;
      
      fetch(discoverUrl)
        .then(response => response.json())
        .then(data => {
          if (data.results && data.results.length > 0) {
            displayResults(data.results, append);
            totalPages = data.total_pages;
            updatePagination();
          }
          isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching sorted results:', error);
          isLoading = false;
        });
    }
    
    /**
     * Display search results
     * @param {Array} results - Search results
     * @param {boolean} append - Whether to append results
     */
    function displayResults(results, append) {
      if (!resultsContainer) return;
      
      // Clear container if not appending
      if (!append) {
        resultsContainer.innerHTML = '';
      } else {
        // Remove loading indicator if present
        const loadingEl = resultsContainer.querySelector('.loading');
        if (loadingEl) {
          loadingEl.remove();
        }
      }
      
      // Create elements for each movie
      results.forEach(movie => {
        const posterUrl = movie.poster_path 
          ? `${IMG_BASE}${movie.poster_path}` 
          : DEFAULT_POSTER;
        
        const year = movie.release_date 
          ? new Date(movie.release_date).getFullYear() 
          : 'N/A';
        
        const rating = movie.vote_average
          ? movie.vote_average.toFixed(1)
          : 'N/A';
        
        // Create movie card
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = movie.id;
        
        card.innerHTML = `
          <div class="movie-poster">
            <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='${DEFAULT_POSTER}'">
          </div>
          <div class="movie-info">
            <h3 title="${movie.title}">${movie.title}</h3>
            <div class="movie-meta">
              <span class="movie-year">${year}</span>
              <span class="movie-rating">★ ${rating}</span>
            </div>
            <div class="movie-actions">
              <button class="action-btn watchlist-btn">+ Watchlist</button>
              <button class="action-btn details-btn">Details</button>
            </div>
          </div>
        `;
        
        // Check if movie is in watchlist
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const watchlistBtn = card.querySelector('.watchlist-btn');
        
        if (watchlist.includes(movie.id)) {
          watchlistBtn.textContent = '✓ Watchlist';
          watchlistBtn.classList.add('in-watchlist');
        }
        
        // Add event listeners
        setupCardEventListeners(card, movie);
        
        // Add to container
        resultsContainer.appendChild(card);
      });
      
      // Update loading state
      isLoading = false;
      
      // Update load more button
      if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Load More Results';
        loadMoreBtn.disabled = false;
      }
    }
    
    /**
     * Set up event listeners for a movie card
     * @param {HTMLElement} card - Movie card element
     * @param {Object} movie - Movie data
     */
    function setupCardEventListeners(card, movie) {
      // Details button
      const detailsBtn = card.querySelector('.details-btn');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent card click
          openMovieDetails(movie.id);
        });
      }
      
      // Watchlist button
      const watchlistBtn = card.querySelector('.watchlist-btn');
      if (watchlistBtn) {
        watchlistBtn.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent card click
          toggleWatchlist(movie, watchlistBtn);
        });
      }
      
      // Card click (view details)
      card.addEventListener('click', function() {
        openMovieDetails(movie.id);
      });
    }
    
    /**
     * Toggle movie in watchlist
     * @param {Object} movie - Movie data
     * @param {HTMLElement} button - Watchlist button
     */
    function toggleWatchlist(movie, button) {
      // Get current watchlist
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      
      // Check if movie is already in watchlist
      const index = watchlist.indexOf(movie.id);
      
      if (index === -1) {
        // Add to watchlist
        watchlist.push(movie.id);
        
        // Update button
        button.textContent = '✓ Watchlist';
        button.classList.add('in-watchlist');
        
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
        button.textContent = '+ Watchlist';
        button.classList.remove('in-watchlist');
        
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
    }
    
    /**
     * Open movie details modal
     * @param {number} movieId - Movie ID
     */
    function openMovieDetails(movieId) {
      // Check if openMovieModal is available (from modal.js)
      if (typeof window.openMovieModal === 'function') {
        // Use the modal function
        window.openMovieModal(movieId);
        
        // Track in history if available
        if (typeof window.addToHistory === 'function') {
          window.addToHistory({
            action: 'details_view',
            title: 'Movie Details',
            movieId: movieId,
            details: `Viewed movie details`
          });
        }
      } else {
        // Fallback to redirect if modal function is not available
        window.location.href = `where-to-watch.html?id=${movieId}`;
      }
    }
    
    /**
     * Update pagination controls
     */
    function updatePagination() {
      if (!loadMoreBtn) return;
      
      if (currentPage < totalPages) {
        loadMoreBtn.style.display = 'inline-block';
      } else {
        loadMoreBtn.style.display = 'none';
      }
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
        document.body.appendChild(toast);
      }
      
      toast.textContent = message;
      toast.style.opacity = '1';
      
      setTimeout(() => {
        toast.style.opacity = '0';
      }, 3000);
    }
  });