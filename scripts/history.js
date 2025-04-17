// History Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const historyContainer = document.getElementById('history-container');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const lastModification = document.getElementById('last-modification');
  const historyFilter = document.getElementById('history-filter');

  // Set last modification date
  if (lastModification) {
    lastModification.textContent = document.lastModified;
  }

  // Constants
  const MAX_HISTORY_ITEMS = 50; // Maximum items to store
  const DISPLAY_LIMIT = 10; // Number of items to display per page
  const ACTION_ICONS = {
    'search': '🔍',
    'watchlist_add': '➕',
    'watchlist_remove': '➖',
    'watched': '✓',
    'unwatched': '✗',
    'details_view': '👁️',
    'where_to_watch': '🎬'
  };

  // Initialize page
  initHistoryPage();

  /**
   * Initialize the history page
   */
  function initHistoryPage() {
    displayHistory();
    setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Clear history button
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', clearHistory);
    }

    // Filter dropdown
    if (historyFilter) {
      historyFilter.addEventListener('change', function() {
        displayHistory(this.value);
      });
    }

    // Pagination buttons (will be set up when displaying history)
  }

  /**
   * Display the user's history
   * @param {string} filter - Optional filter to apply
   * @param {number} page - Page number to display
   */
  function displayHistory(filter = 'all', page = 1) {
    if (!historyContainer) return;
    
    // Get history from localStorage
    const historyItems = getHistoryItems();
    
    // Apply filter if needed
    let filteredItems = historyItems;
    if (filter && filter !== 'all') {
      filteredItems = historyItems.filter(item => item.action === filter);
    }
    
    // Clear container
    historyContainer.innerHTML = '';
    
    // Check if we have any history
    if (filteredItems.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-history">
          <p>No history found.</p>
          <p>Your activity will be recorded here as you use CineMate.</p>
        </div>
      `;
      return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredItems.length / DISPLAY_LIMIT);
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * DISPLAY_LIMIT;
    const endIndex = Math.min(startIndex + DISPLAY_LIMIT, filteredItems.length);
    
    // Create a container for the history items
    const historyList = document.createElement('div');
    historyList.className = 'history-list';
    
    // Group history items by date
    const groupedItems = groupByDate(filteredItems.slice(startIndex, endIndex));
    
    // Create each date group
    Object.entries(groupedItems).forEach(([date, items]) => {
      const dateGroup = document.createElement('div');
      dateGroup.className = 'history-date-group';
      
      const dateHeading = document.createElement('h3');
      dateHeading.className = 'date-heading';
      dateHeading.textContent = formatDateHeading(date);
      dateGroup.appendChild(dateHeading);
      
      // Create list for this date
      const dateList = document.createElement('ul');
      dateList.className = 'history-items';
      
      // Add each history item for this date
      items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = `history-item ${item.action}`;
        
        // Format time
        const time = new Date(item.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        // Create action icon
        const actionIcon = ACTION_ICONS[item.action] || '•';
        
        // Build the item HTML
        listItem.innerHTML = `
          <div class="history-item-icon">${actionIcon}</div>
          <div class="history-item-content">
            <div class="history-item-title">${item.title || 'Unknown'}</div>
            <div class="history-item-details">
              <span class="history-item-action">${formatAction(item.action)}</span>
              <span class="history-item-time">${time}</span>
            </div>
            ${item.details ? `<div class="history-item-extra">${item.details}</div>` : ''}
          </div>
        `;
        
        // Make the item clickable if it has an associated movie
        if (item.movieId) {
          listItem.classList.add('clickable');
          listItem.addEventListener('click', () => {
            navigateToMovie(item.movieId, item.action);
          });
        }
        
        dateList.appendChild(listItem);
      });
      
      dateGroup.appendChild(dateList);
      historyList.appendChild(dateGroup);
    });
    
    historyContainer.appendChild(historyList);
    
    // Add pagination if needed
    if (totalPages > 1) {
      const pagination = createPagination(currentPage, totalPages, filter);
      historyContainer.appendChild(pagination);
    }
  }

  /**
   * Group history items by date
   * @param {Array} items - History items to group
   * @return {Object} Grouped items by date
   */
  function groupByDate(items) {
    const grouped = {};
    
    items.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    return grouped;
  }

  /**
   * Format date heading
   * @param {string} dateString - ISO date string
   * @return {string} Formatted date heading
   */
  function formatDateHeading(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today, yesterday, or another date
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      // Format as month day, year (e.g., April 16, 2025)
      return date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  /**
   * Format action text
   * @param {string} action - Action type
   * @return {string} Formatted action text
   */
  function formatAction(action) {
    const actions = {
      'search': 'Search',
      'watchlist_add': 'Added to Watchlist',
      'watchlist_remove': 'Removed from Watchlist',
      'watched': 'Marked as Watched',
      'unwatched': 'Marked as Unwatched',
      'details_view': 'Viewed Details',
      'where_to_watch': 'Checked Where to Watch'
    };
    
    return actions[action] || action;
  }

  /**
   * Create pagination controls
   * @param {number} currentPage - Current page number
   * @param {number} totalPages - Total number of pages
   * @param {string} filter - Current filter
   * @return {HTMLElement} Pagination element
   */
  function createPagination(currentPage, totalPages, filter) {
    const pagination = document.createElement('div');
    pagination.className = 'history-pagination';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn prev';
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    
    if (currentPage > 1) {
      prevBtn.addEventListener('click', () => {
        displayHistory(filter, currentPage - 1);
      });
    }
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn next';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    
    if (currentPage < totalPages) {
      nextBtn.addEventListener('click', () => {
        displayHistory(filter, currentPage + 1);
      });
    }
    
    pagination.appendChild(prevBtn);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextBtn);
    
    return pagination;
  }

  /**
   * Navigate to a movie based on action
   * @param {number} movieId - Movie ID
   * @param {string} action - Action type
   */
  function navigateToMovie(movieId, action) {
    if (action === 'where_to_watch') {
      window.location.href = `where-to-watch.html?id=${movieId}`;
    } else {
      // For other actions, just view movie details
      // First try to get movie data from sessionStorage
      const movie = JSON.parse(sessionStorage.getItem('currentMovie') || '{}');
      
      if (movie && movie.id === movieId) {
        window.location.href = `where-to-watch.html?id=${movieId}`;
      } else {
        // We need to fetch the movie first - this will be handled on the target page
        window.location.href = `where-to-watch.html?id=${movieId}`;
      }
    }
  }

  /**
   * Get history items from localStorage
   * @return {Array} History items
   */
  function getHistoryItems() {
    return JSON.parse(localStorage.getItem('cinemate-history') || '[]');
  }

  /**
   * Clear history
   */
  function clearHistory() {
    if (confirm('Are you sure you want to clear your history? This cannot be undone.')) {
      localStorage.setItem('cinemate-history', '[]');
      displayHistory();
      showToast('History cleared');
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

/**
 * Add item to history - this function is accessed globally
 * @param {Object} item - History item to add
 * @param {string} item.action - Action type
 * @param {string} item.title - Title of the item
 * @param {number} [item.movieId] - Optional movie ID
 * @param {string} [item.details] - Optional additional details
 */
function addToHistory(item) {
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
}   