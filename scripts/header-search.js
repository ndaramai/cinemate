// Global header search functionality with autocomplete integration
// Add this script to all pages to enable search from any page

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    
    // Set up event listeners if we have the search elements
    if (searchInput && searchButton) {
      // Search button click
      searchButton.addEventListener('click', function() {
        performSearch();
      });
      
      // Search input enter key
      searchInput.addEventListener('keydown', function(e) {
        // Only handle Enter if not handled by autocomplete
        // The autocomplete script will handle Enter key when an autocomplete item is selected
        if (e.key === 'Enter' && !e.defaultPrevented) {
          performSearch();
        }
      });
      
      // Check for URL params (for current page)
      const urlParams = new URLSearchParams(window.location.search);
      const queryParam = urlParams.get('query');
      
      // Set input value if we have a query parameter
      if (queryParam && searchInput.value === '') {
        searchInput.value = queryParam;
      }
    }
    
    /**
     * Perform search and redirect to search page
     */
    function performSearch() {
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
        
        // Redirect to search page with query parameter
        const currentPage = window.location.pathname;
        
        // Only redirect if we're not already on the search page
        if (!currentPage.includes('search.html')) {
          window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        } else {
          // We're already on the search page - let the page handle it
          // Just trigger the search event if possible
          const searchEvent = new CustomEvent('performSearch', { detail: { query } });
          document.dispatchEvent(searchEvent);
        }
      }
    }
    
    // Listen for custom events from autocomplete
    document.addEventListener('searchAutocomplete', function(e) {
      if (e.detail && e.detail.query) {
        searchInput.value = e.detail.query;
        performSearch();
      }
    });
  });