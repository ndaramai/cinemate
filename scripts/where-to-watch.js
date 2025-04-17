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

    trackDetailsView(movie);
    trackWhereToWatch(movie);
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

// Where to Watch Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // TMDb configuration
    const TMDB_KEY = '4c84ecd36279188e533841ba4c85cf17';
    const TMDB_BASE = 'https://api.themoviedb.org/3';
    const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
    const LOGO_BASE = 'https://image.tmdb.org/t/p/original';
    const DEFAULT_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster';
    
    // DOM Elements
    const movieTitle = document.querySelector('.movie-title');
    const movieMeta = document.querySelector('.movie-meta');
    const movieOverview = document.querySelector('.movie-overview');
    const moviePoster = document.querySelector('.movie-poster');
    const regionSelector = document.getElementById('region');
    const streamProvidersSection = document.getElementById('stream-providers');
    const rentProvidersSection = document.getElementById('rent-providers');
    const buyProvidersSection = document.getElementById('buy-providers');
    const noProvidersMessage = document.getElementById('no-providers');
    const loading = document.querySelector('.loading');
    const lastModification = document.getElementById('last-modification');
    
    // Update last modification date
    if (lastModification) {
      lastModification.textContent = document.lastModified;
    }
    
    // Get movie ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    
    // Current region
    let currentRegion = 'US'; // Default to US
    
    // Initialize the page
    init();
    
    function init() {
      // Check if we have a movie ID
      if (!movieId) {
        handleError('No movie selected. Please go back and select a movie.');
        return;
      }
      
      // Try to get movie data from sessionStorage first
      const storedMovie = sessionStorage.getItem('currentMovie');
      
      if (storedMovie) {
        // Use stored data
        const movie = JSON.parse(storedMovie);
        displayMovieDetails(movie);
        loadWatchProviders(movie.id, currentRegion);
      } else {
        // Fetch movie data from API
        fetchMovieDetails(movieId);
      }
      
      // Set up event listeners
      setupEventListeners();
    }
    
    function setupEventListeners() {
      // Region change event
      if (regionSelector) {
        regionSelector.addEventListener('change', function() {
          currentRegion = this.value;
          loadWatchProviders(movieId, currentRegion);
        });
      }
    }
    
    function fetchMovieDetails(id) {
      // Show loading state
      if (loading) loading.style.display = 'block';
      
      fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(movie => {
          // Display movie details
          displayMovieDetails(movie);
          
          // Load watch providers
          loadWatchProviders(movie.id, currentRegion);
        })
        .catch(error => {
          console.error('Error fetching movie details:', error);
          handleError('Failed to load movie details. Please try again later.');
        });
    }
    
    function displayMovieDetails(movie) {
      // Hide loading state
      if (loading) loading.style.display = 'none';
      
      // Set page title
      document.title = `CineMate — Where to Watch "${movie.title}"`;
      
      // Set movie title
      if (movieTitle) movieTitle.textContent = movie.title;
      
      // Set movie meta (year and rating)
      if (movieMeta) {
        const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
        const rating = movie.vote_average ? `★ ${movie.vote_average.toFixed(1)}/10` : '';
        
        movieMeta.innerHTML = `
          <span class="year">${year}</span>
          ${rating ? `<span class="rating">${rating}</span>` : ''}
        `;
      }
      
      // Set movie overview
      if (movieOverview) movieOverview.textContent = movie.overview || 'No overview available.';
      
      // Set movie poster
      if (moviePoster) {
        const posterUrl = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : DEFAULT_POSTER;
        moviePoster.innerHTML = `<img src="${posterUrl}" alt="${movie.title}" onerror="this.src='${DEFAULT_POSTER}'">`;
      }
    }
    
    function loadWatchProviders(id, region) {
      // Reset providers sections
      resetProvidersSections();
      
      // Show loading
      if (loading) loading.style.display = 'block';
      
      fetch(`${TMDB_BASE}/movie/${id}/watch/providers?api_key=${TMDB_KEY}`)
        .then(response => response.json())
        .then(data => {
          // Hide loading
          if (loading) loading.style.display = 'none';
          
          // Check if we have providers for the selected region
          const regionData = data.results[region];
          
          if (!regionData) {
            showNoProvidersMessage();
            return;
          }
          
          // Populate available regions in selector
          populateRegionSelector(data.results);
          
          // Display streaming providers
          displayProviders(regionData);
        })
        .catch(error => {
          console.error('Error fetching watch providers:', error);
          if (loading) loading.style.display = 'none';
          showNoProvidersMessage();
        });
    }
    
    function resetProvidersSections() {
      // Hide all provider sections
      if (streamProvidersSection) {
        streamProvidersSection.style.display = 'none';
        streamProvidersSection.querySelector('.providers-grid').innerHTML = '';
      }
      
      if (rentProvidersSection) {
        rentProvidersSection.style.display = 'none';
        rentProvidersSection.querySelector('.providers-grid').innerHTML = '';
      }
      
      if (buyProvidersSection) {
        buyProvidersSection.style.display = 'none';
        buyProvidersSection.querySelector('.providers-grid').innerHTML = '';
      }
      
      // Hide no providers message
      if (noProvidersMessage) noProvidersMessage.style.display = 'none';
    }
    
    function populateRegionSelector(regionsData) {
      if (!regionSelector) return;
      
      // Get current selection
      const currentSelection = regionSelector.value;
      
      // Store original options
      const defaultOptions = Array.from(regionSelector.options).filter(option => 
        ['US', 'CA', 'GB', 'AU'].includes(option.value)
      );
      
      // Clear selector
      regionSelector.innerHTML = '';
      
      // Add default options back
      defaultOptions.forEach(option => {
        regionSelector.appendChild(option);
      });
      
      // Get all available regions
      const availableRegions = Object.keys(regionsData);
      
      // Add any additional regions that aren't in defaults
      availableRegions.forEach(region => {
        if (!['US', 'CA', 'GB', 'AU'].includes(region)) {
          const option = document.createElement('option');
          option.value = region;
          option.textContent = getCountryName(region);
          regionSelector.appendChild(option);
        }
      });
      
      // Restore selection
      if (availableRegions.includes(currentSelection)) {
        regionSelector.value = currentSelection;
      } else if (availableRegions.includes('US')) {
        regionSelector.value = 'US';
      } else if (availableRegions.length > 0) {
        regionSelector.value = availableRegions[0];
      }
    }
    
    function displayProviders(regionData) {
      let hasProviders = false;
      
      // Stream providers
      if (regionData.flatrate && regionData.flatrate.length > 0 && streamProvidersSection) {
        const providersGrid = streamProvidersSection.querySelector('.providers-grid');
        providersGrid.innerHTML = '';
        
        regionData.flatrate.forEach(provider => {
          providersGrid.appendChild(createProviderCard(provider));
        });
        
        streamProvidersSection.style.display = 'block';
        hasProviders = true;
      }
      
      // Rent providers
      if (regionData.rent && regionData.rent.length > 0 && rentProvidersSection) {
        const providersGrid = rentProvidersSection.querySelector('.providers-grid');
        providersGrid.innerHTML = '';
        
        regionData.rent.forEach(provider => {
          providersGrid.appendChild(createProviderCard(provider));
        });
        
        rentProvidersSection.style.display = 'block';
        hasProviders = true;
      }
      
      // Buy providers
      if (regionData.buy && regionData.buy.length > 0 && buyProvidersSection) {
        const providersGrid = buyProvidersSection.querySelector('.providers-grid');
        providersGrid.innerHTML = '';
        
        regionData.buy.forEach(provider => {
          providersGrid.appendChild(createProviderCard(provider));
        });
        
        buyProvidersSection.style.display = 'block';
        hasProviders = true;
      }
      
      // If no providers found
      if (!hasProviders) {
        showNoProvidersMessage();
      }
    }
    
    function createProviderCard(provider) {
      const card = document.createElement('div');
      card.className = 'provider-card';
      
      const logoUrl = provider.logo_path ? `${LOGO_BASE}${provider.logo_path}` : DEFAULT_POSTER;
      
      card.innerHTML = `
        <div class="provider-logo">
          <img src="${logoUrl}" alt="${provider.provider_name}" onerror="this.src='${DEFAULT_POSTER}'">
        </div>
        <div class="provider-name">${provider.provider_name}</div>
      `;
      
      // Make the card clickable - Opens the provider in a new tab if we have a link
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        // Instead of directly linking (which we don't have from TMDb),
        // do a Google search for the movie on that platform
        const searchQuery = `${encodeURIComponent(movieTitle.textContent)} watch on ${encodeURIComponent(provider.provider_name)}`;
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
      });
      
      return card;
    }
    
    function showNoProvidersMessage() {
      if (noProvidersMessage) {
        noProvidersMessage.style.display = 'block';
      }
    }
    
    function handleError(message) {
      // Hide loading
      if (loading) loading.style.display = 'none';
      
      // Show error message
      const errorEl = document.createElement('div');
      errorEl.className = 'error';
      errorEl.textContent = message;
      
      const container = document.querySelector('.where-to-watch-section');
      if (container) {
        // Clear container except for back button
        const backButton = container.querySelector('.back-button');
        container.innerHTML = '';
        if (backButton) container.appendChild(backButton);
        
        // Add error message
        container.appendChild(errorEl);
      }
    }
    
    // Helper function to get country name from country code
    function getCountryName(countryCode) {
      const countries = {
        'US': 'United States',
        'CA': 'Canada',
        'GB': 'United Kingdom',
        'AU': 'Australia',
        'FR': 'France',
        'DE': 'Germany',
        'IT': 'Italy',
        'ES': 'Spain',
        'JP': 'Japan',
        'KR': 'South Korea',
        'IN': 'India',
        'BR': 'Brazil',
        'MX': 'Mexico',
        'RU': 'Russia',
        'NL': 'Netherlands',
        'SE': 'Sweden',
        'NO': 'Norway',
        'DK': 'Denmark',
        'FI': 'Finland',
        'IE': 'Ireland',
        'NZ': 'New Zealand',
        'ZA': 'South Africa',
        'AR': 'Argentina',
        'CL': 'Chile',
        'CO': 'Colombia',
        'PE': 'Peru',
        'ID': 'Indonesia',
        'MY': 'Malaysia',
        'PH': 'Philippines',
        'SG': 'Singapore',
        'TH': 'Thailand',
        'VN': 'Vietnam',
        'AE': 'United Arab Emirates',
        'TR': 'Turkey',
        'SA': 'Saudi Arabia',
        'EG': 'Egypt',
        'ZA': 'South Africa',
        'NG': 'Nigeria',
        'MA': 'Morocco',
        'IL': 'Israel',
        'PL': 'Poland',
        'HU': 'Hungary',
        'CZ': 'Czech Republic',
        'GR': 'Greece',
        'PT': 'Portugal',
        'RO': 'Romania',
        'BE': 'Belgium',
        'CH': 'Switzerland',
        'AT': 'Austria'
      };
      
      return countries[countryCode] || countryCode;
    }
  });