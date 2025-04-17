// Simple movie title suggestions with redirect to searchresults.html
document.addEventListener('DOMContentLoaded', function() {
    // TMDb configuration
    const TMDB_KEY = '4c84ecd36279188e533841ba4c85cf17';
    const TMDB_BASE = 'https://api.themoviedb.org/3';
    
    // DOM Elements
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    const searchForm = document.querySelector('.search-bar');
    
    // Only proceed if we have the search input
    if (!searchInput) return;
    
    // Create datalist element for suggestions
    const datalist = document.createElement('datalist');
    datalist.id = 'movie-suggestions';
    
    // Add datalist to document
    document.body.appendChild(datalist);
    
    // Connect input to datalist
    searchInput.setAttribute('list', 'movie-suggestions');
    
    // Set up debounce timer
    let debounceTimer;
    let lastQuery = '';
    
    // Listen for input changes
    searchInput.addEventListener('input', function() {
      const query = this.value.trim();
      
      // Clear previous timer
      clearTimeout(debounceTimer);
      
      // Skip if query is too short or same as last
      if (query.length < 2 || query === lastQuery) return;
      
      // Debounce input
      debounceTimer = setTimeout(() => {
        lastQuery = query;
        fetchMovieTitles(query);
      }, 300); // 300ms debounce
    });
    
    // Add search form submission handler
    if (searchForm) {
      searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
      });
    }
    
    // Add search button click handler
    if (searchButton) {
      searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        performSearch();
      });
    }
    
    // Add search input enter key handler
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
    
    /**
     * Perform search and redirect to searchresults.html
     */
    function performSearch() {
      const query = searchInput.value.trim();
      if (!query) return;
      
      // Track search in history if global tracking is available
      if (typeof window.addToHistory === 'function') {
        window.addToHistory({
          action: 'search',
          title: `Search: "${query}"`,
          details: `Searched for "${query}"`
        });
      }
      
      // Redirect to searchresults.html with query parameter
      window.location.href = `searchresults.html?query=${encodeURIComponent(query)}`;
    }
    
    /**
     * Fetch movie titles from TMDb
     * @param {string} query - Search query
     */
    function fetchMovieTitles(query) {
      // Search URL for titles
      const searchUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
      
      fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
          if (data.results && data.results.length > 0) {
            updateSuggestions(data.results);
          }
        })
        .catch(error => {
          console.error('Error fetching title suggestions:', error);
        });
    }
    
    /**
     * Update datalist with movie title suggestions
     * @param {Array} movies - Movie results from API
     */
    function updateSuggestions(movies) {
      // Clear previous suggestions
      datalist.innerHTML = '';
      
      // Add new suggestions (limit to 10)
      movies.slice(0, 10).forEach(movie => {
        const option = document.createElement('option');
        
        // Add year if available
        const year = movie.release_date 
          ? ` (${new Date(movie.release_date).getFullYear()})` 
          : '';
        
        option.value = movie.title + year;
        datalist.appendChild(option);
      });
    }
  });