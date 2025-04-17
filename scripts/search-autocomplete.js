// Search Autocomplete functionality for CineMate
document.addEventListener('DOMContentLoaded', function() {
    // TMDb configuration
    const TMDB_KEY = '4c84ecd36279188e533841ba4c85cf17';
    const TMDB_BASE = 'https://api.themoviedb.org/3';
    const IMG_BASE = 'https://image.tmdb.org/t/p/w92'; // Small images for autocomplete
    const DEFAULT_POSTER = 'https://via.placeholder.com/92x138?text=No+Poster';
    
    // DOM Elements
    const searchInput = document.querySelector('.search-bar input');
    const searchForm = document.querySelector('.search-bar');
    
    // Autocomplete state
    let debounceTimer;
    let lastQuery = '';
    let autocompleteResults = [];
    let selectedIndex = -1;
    let autocompleteVisible = false;
    
    // Only proceed if we have the search input
    if (searchInput) {
      setupAutocomplete();
    }
    
    /**
     * Set up autocomplete functionality
     */
    function setupAutocomplete() {
      // Create autocomplete container
      const autocompleteContainer = document.createElement('div');
      autocompleteContainer.className = 'autocomplete-container';
      autocompleteContainer.style.display = 'none'; // Hide initially
      
      // Insert after search input
      searchForm.appendChild(autocompleteContainer);
      
      // Set up event listeners
      searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Clear previous timer
        clearTimeout(debounceTimer);
        
        // Hide autocomplete if query is empty
        if (!query) {
          hideAutocomplete();
          return;
        }
        
        // Debounce input to avoid too many API calls
        debounceTimer = setTimeout(() => {
          // Only fetch if query has changed
          if (query !== lastQuery) {
            lastQuery = query;
            fetchAutocompleteSuggestions(query);
          }
        }, 300); // 300ms debounce
      });
      
      // Handle keyboard navigation
      searchInput.addEventListener('keydown', function(e) {
        if (!autocompleteVisible) return;
        
        switch(e.key) {
          case 'ArrowDown':
            e.preventDefault();
            navigateAutocomplete(1);
            break;
          case 'ArrowUp':
            e.preventDefault();
            navigateAutocomplete(-1);
            break;
          case 'Enter':
            if (selectedIndex >= 0) {
              e.preventDefault();
              selectAutocompleteItem(selectedIndex);
            }
            break;
          case 'Escape':
            hideAutocomplete();
            break;
        }
      });
      
      // Hide autocomplete when clicking outside
      document.addEventListener('click', function(e) {
        if (!searchForm.contains(e.target)) {
          hideAutocomplete();
        }
      });
    }
    
    /**
     * Fetch autocomplete suggestions from TMDb
     * @param {string} query - Search query
     */
    function fetchAutocompleteSuggestions(query) {
      // Search URL for autocomplete
      const searchUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
      
      // Show loading indicator in autocomplete
      showLoadingAutocomplete();
      
      fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
          if (data.results && data.results.length > 0) {
            // Limit to top 8 results
            autocompleteResults = data.results.slice(0, 8);
            displayAutocompleteSuggestions(autocompleteResults);
          } else {
            showNoResultsAutocomplete();
          }
        })
        .catch(error => {
          console.error('Error fetching autocomplete suggestions:', error);
          showErrorAutocomplete();
        });
    }
    
    /**
     * Display autocomplete suggestions
     * @param {Array} results - Search results
     */
    function displayAutocompleteSuggestions(results) {
      const autocompleteContainer = document.querySelector('.autocomplete-container');
      if (!autocompleteContainer) return;
      
      // Clear previous results
      autocompleteContainer.innerHTML = '';
      
      // Create list of suggestions
      const suggestionsList = document.createElement('ul');
      suggestionsList.className = 'autocomplete-list';
      
      // Create list items for each suggestion
      results.forEach((movie, index) => {
        const item = document.createElement('li');
        item.className = 'autocomplete-item';
        item.dataset.index = index;
        
        const year = movie.release_date 
          ? new Date(movie.release_date).getFullYear() 
          : '';
        
        const posterUrl = movie.poster_path 
          ? `${IMG_BASE}${movie.poster_path}` 
          : DEFAULT_POSTER;
        
        item.innerHTML = `
          <div class="autocomplete-poster">
            <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='${DEFAULT_POSTER}'">
          </div>
          <div class="autocomplete-info">
            <div class="autocomplete-title">${movie.title}</div>
            ${year ? `<div class="autocomplete-year">${year}</div>` : ''}
          </div>
        `;
        
        // Add click event
        item.addEventListener('click', function() {
          selectAutocompleteItem(index);
        });
        
        // Add mouseover event
        item.addEventListener('mouseover', function() {
          setSelectedItem(index);
        });
        
        suggestionsList.appendChild(item);
      });
      
      // Add to container
      autocompleteContainer.appendChild(suggestionsList);
      
      // Show the container
      autocompleteContainer.style.display = 'block';
      autocompleteVisible = true;
      
      // Reset selected index
      selectedIndex = -1;
    }
    
    /**
     * Navigate through autocomplete items
     * @param {number} direction - 1 for down, -1 for up
     */
    function navigateAutocomplete(direction) {
      const totalItems = autocompleteResults.length;
      if (totalItems === 0) return;
      
      // Calculate new index
      let newIndex = selectedIndex + direction;
      
      // Wrap around
      if (newIndex < 0) newIndex = totalItems - 1;
      if (newIndex >= totalItems) newIndex = 0;
      
      // Update selected item
      setSelectedItem(newIndex);
    }
    
    /**
     * Set the selected autocomplete item
     * @param {number} index - Index of the item
     */
    function setSelectedItem(index) {
      selectedIndex = index;
      
      // Remove selection from all items
      const items = document.querySelectorAll('.autocomplete-item');
      items.forEach(item => item.classList.remove('selected'));
      
      // Add selection to current item
      if (index >= 0 && index < items.length) {
        items[index].classList.add('selected');
        // Ensure it's visible (scroll if needed)
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
    
    /**
     * Select an autocomplete item
     * @param {number} index - Index of the item
     */
    function selectAutocompleteItem(index) {
      if (index < 0 || index >= autocompleteResults.length) return;
      
      const selectedMovie = autocompleteResults[index];
      
      // Fill search input with selected title
      if (searchInput) {
        searchInput.value = selectedMovie.title;
      }
      
      // Hide autocomplete
      hideAutocomplete();
      
      // Trigger search with this movie
      const searchButton = document.querySelector('.search-bar button');
      if (searchButton) {
        searchButton.click();
      }
    }
    
    /**
     * Show loading indicator in autocomplete
     */
    function showLoadingAutocomplete() {
      const autocompleteContainer = document.querySelector('.autocomplete-container');
      if (!autocompleteContainer) return;
      
      autocompleteContainer.innerHTML = '<div class="autocomplete-loading">Loading suggestions...</div>';
      autocompleteContainer.style.display = 'block';
      autocompleteVisible = true;
    }
    
    /**
     * Show no results message in autocomplete
     */
    function showNoResultsAutocomplete() {
      const autocompleteContainer = document.querySelector('.autocomplete-container');
      if (!autocompleteContainer) return;
      
      autocompleteContainer.innerHTML = '<div class="autocomplete-message">No matching movies found</div>';
      autocompleteContainer.style.display = 'block';
      autocompleteVisible = true;
    }
    
    /**
     * Show error message in autocomplete
     */
    function showErrorAutocomplete() {
      const autocompleteContainer = document.querySelector('.autocomplete-container');
      if (!autocompleteContainer) return;
      
      autocompleteContainer.innerHTML = '<div class="autocomplete-error">Error loading suggestions</div>';
      autocompleteContainer.style.display = 'block';
      autocompleteVisible = true;
    }
    
    /**
     * Hide autocomplete container
     */
    function hideAutocomplete() {
      const autocompleteContainer = document.querySelector('.autocomplete-container');
      if (autocompleteContainer) {
        autocompleteContainer.style.display = 'none';
        autocompleteVisible = false;
      }
      
      // Reset state
      selectedIndex = -1;
    }
  });