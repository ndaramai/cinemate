// scripts/script.js
document.addEventListener('DOMContentLoaded', () => {
  // TMDb configuration
  const TMDB_KEY  = '4c84ecd36279188e533841ba4c85cf17';
  const TMDB_BASE = 'https://api.themoviedb.org/3';
  const IMG_BASE  = 'https://image.tmdb.org/t/p/w500';
  const DEFAULT_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster';

  // Map data-tab → TMDb genre ID
  const GENRE_IDS = {
    action:28, adventure:12, animation:16, comedy:35, crime:80,
    documentary:99, drama:18, family:10751, fantasy:14, history:36,
    horror:27, music:10402, mystery:9648, romance:10749,
    scifi:878, tvmovie:10770, thriller:53, war:10752, western:37
  };

  // Track which genres have been loaded
  const loadedGenres = new Set();
  let featuredSectionActive = false;

  // Utility to read/write lists in localStorage
  function readList(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  function writeList(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  // 1) Footer timestamp
  document.getElementById('last-modification')
          .textContent = document.lastModified;

  // Initialize tab content containers
  const tabs = document.querySelectorAll('.genre-button');
  const panes = document.querySelectorAll('.tab-content');
  
  // Initially hide featured section
  const featuredSection = document.querySelector('.featured-movie-section');
  featuredSection.classList.remove('active');
  featuredSection.style.display = 'none';
  
  // Function to load movies for a specific genre
  function loadGenreMovies(key, gid) {
    if (loadedGenres.has(key)) {
      // If already loaded, just show this tab
      showGenreTab(key);
      return;
    }
    
    const pane = document.getElementById(key);
    
    // Show loading indicator in the active tab
    if (document.querySelector(`.genre-button[data-tab="${key}"]`).classList.contains('active')) {
      pane.innerHTML = '<div class="loading">Loading movies...</div>';
      pane.style.display = 'flex';
    }
    
    fetch(
      `${TMDB_BASE}/discover/movie?` +
      `api_key=${TMDB_KEY}` +
      `&with_genres=${gid}` +
      `&sort_by=vote_average.desc` +
      `&vote_count.gte=100&page=1`
    )
    .then(r => {
      if (!r.ok) throw new Error(`HTTP error! Status: ${r.status}`);
      return r.json();
    })
    .then(data => {
      pane.innerHTML = ''; // Clear loading message
      
      if (!data.results || data.results.length === 0) {
        pane.innerHTML = '<div class="no-results">No movies found for this genre</div>';
        return;
      }

      const moviesToShow = data.results.slice(0, 5);
      
      moviesToShow.forEach(m => {
        // Handle potential missing data
        const releaseYear = m.release_date ? m.release_date.slice(0, 4) : 'N/A';
        const rating = m.vote_average ? m.vote_average.toFixed(1) : 'N/A';
        const posterPath = m.poster_path ? `${IMG_BASE}${m.poster_path}` : DEFAULT_POSTER;
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
          <div class="movie-poster">
            <img src="${posterPath}" alt="${m.title}" onerror="this.src='${DEFAULT_POSTER}'">
          </div>
          <div class="movie-info">
            <h3>${m.title}</h3>
            <p>${releaseYear} | ☆ ${rating}</p>
          </div>`;
        card.addEventListener('click', () => loadFeatured(m.id));
        pane.appendChild(card);
      });

      // If we got less than 5 movies, fill with placeholder cards
      if (moviesToShow.length < 5) {
        const placeholdersNeeded = 5 - moviesToShow.length;
        for (let i = 0; i < placeholdersNeeded; i++) {
          const placeholderCard = document.createElement('div');
          placeholderCard.className = 'movie-card placeholder';
          placeholderCard.innerHTML = `
            <div class="movie-poster">
              <img src="${DEFAULT_POSTER}" alt="Placeholder">
            </div>
            <div class="movie-info">
              <h3>Movie data unavailable</h3>
              <p>N/A | ☆ N/A</p>
            </div>`;
          pane.appendChild(placeholderCard);
        }
      }
      
      // Mark this genre as loaded
      loadedGenres.add(key);
      
      // Add navigation controls for this genre after loading
      addNavigationControls(key);
      
      // If this is the active tab, make sure it's visible
      if (document.querySelector(`.genre-button[data-tab="${key}"]`).classList.contains('active')) {
        showGenreTab(key);
      }
      
      // Make sure scroll shadows are updated for this newly loaded content
      updateScrollShadows();
    })
    .catch(err => {
      console.error(`Failed loading ${key}:`, err);
      pane.innerHTML = `<div class="error">Failed to load ${key} movies. Please try again.</div>`;
      
      // Add 5 placeholder cards on error
      for (let i = 0; i < 10; i++) {
        const placeholderCard = document.createElement('div');
        placeholderCard.className = 'movie-card placeholder';
        placeholderCard.innerHTML = `
          <div class="movie-poster">
            <img src="${DEFAULT_POSTER}" alt="Placeholder">
          </div>
          <div class="movie-info">
            <h3>Movie data unavailable</h3>
            <p>N/A | ☆ N/A</p>
          </div>`;
        pane.appendChild(placeholderCard);
      }
    });
  }
  
  // Function to show a specific genre tab
  function showGenreTab(genreKey) {
    // Hide all panes
    panes.forEach(pane => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });
    
    // Show the selected pane
    const targetPane = document.getElementById(genreKey);
    targetPane.style.display = 'flex';
    targetPane.classList.add('active');
    
    // Update active tab button
    tabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.genre-button[data-tab="${genreKey}"]`).classList.add('active');
    
    // Update scroll shadows
    setTimeout(updateScrollShadows, 100);
  }
  
  // Tab switching
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const genreKey = btn.dataset.tab;
      
      // Load this genre's movies if they haven't been loaded yet
      if (!loadedGenres.has(genreKey)) {
        loadGenreMovies(genreKey, GENRE_IDS[genreKey]);
      } else {
        // If already loaded, just show this tab
        showGenreTab(genreKey);
      }
      
      // Hide featured section when changing tabs unless a movie is selected
      if (!featuredSectionActive) {
        featuredSection.classList.remove('active');
        featuredSection.style.display = 'none';
      }
    });
  });

  // Load the initial active genre (usually Action)
  const initialActiveTab = document.querySelector('.genre-button.active');
  if (initialActiveTab) {
    const initialGenre = initialActiveTab.dataset.tab;
    loadGenreMovies(initialGenre, GENRE_IDS[initialGenre]);
  }

  // Featured section + watchlist/history
  let currentId = null;
  function loadFeatured(id) {
    const featuredPoster = document.getElementById('featuredPoster');
    
    // Show the featured section
    featuredSection.classList.add('active');
    featuredSection.style.display = 'block';
    featuredSectionActive = true;
    
    featuredPoster.innerHTML = '<div class="loading">Loading movie details...</div>';
    
    fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error! Status: ${r.status}`);
        return r.json();
      })
      .then(m => {
        currentId = m.id;
        // populate poster, title, tagline, stats, overview, description
        document.getElementById('featuredPoster').innerHTML =
          m.poster_path
            ? `<img src="${IMG_BASE}${m.poster_path}" alt="${m.title}">`
            : `<img src="${DEFAULT_POSTER}" alt="${m.title}">`;
        
        document.getElementById('featuredTitle').textContent =
          `${m.title} ${m.release_date ? `(${m.release_date.slice(0,4)})` : ''}`;
        
        document.getElementById('featuredTagline').textContent =
          m.tagline || '';
        
        const runtime = m.runtime ? `${m.runtime} min` : 'N/A';
        const genres = m.genres && m.genres.length > 0 ? m.genres.map(g => g.name).join(', ') : 'N/A';
        
        document.getElementById('featuredStats').textContent =
          `☆ ${m.vote_average}/10 | ${runtime} | ${genres}`;
        
        document.getElementById('featuredOverview').textContent =
          m.overview || 'No overview available';
        
        const companies = m.production_companies && m.production_companies.length > 0 
          ? m.production_companies.map(c => c.name).join(', ') 
          : 'No production companies listed';
        
        document.getElementById('featuredDescription').textContent = companies;

        updateButtons();
        
        // Scroll to featured section
        featuredSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(err => {
        console.error('Failed to load movie details:', err);
        document.getElementById('featuredPoster').innerHTML = 
          `<img src="${DEFAULT_POSTER}" alt="Error loading movie">`;
        document.getElementById('featuredTitle').textContent = 'Error loading movie details';
        document.getElementById('featuredTagline').textContent = '';
        document.getElementById('featuredStats').textContent = '';
        document.getElementById('featuredOverview').textContent = 'Failed to load movie information. Please try again or select another movie.';
        document.getElementById('featuredDescription').textContent = '';
      });
  }

  function updateButtons() {
    const watchlist = readList('watchlist');
    const history   = readList('history');
    const inW = watchlist.includes(currentId);
    const inH = history.includes(currentId);

    const bw = document.getElementById('add-watchlist');
    bw.textContent = inW ? '✓ In Watchlist' : 'Add to Watchlist';
    bw.disabled    = inW;

    const mh = document.getElementById('mark-watched');
    mh.textContent = inH ? '✓ Watched' : 'Mark as Watched';
    mh.disabled    = inH;
  }

  document.getElementById('add-watchlist')
    .addEventListener('click', () => {
      if (!currentId) return;
      const list = readList('watchlist');
      if (!list.includes(currentId)) {
        list.push(currentId);
        writeList('watchlist', list);
        updateButtons();
      }
    });

  document.getElementById('mark-watched')
    .addEventListener('click', () => {
      if (!currentId) return;
      const list = readList('history');
      if (!list.includes(currentId)) {
        list.push(currentId);
        writeList('history', list);
        updateButtons();
      }
    });

  // Header search
  document.getElementById('homeSearchBtn')
    .addEventListener('click', () => {
      const q = document.getElementById('homeSearchInput').value.trim();
      if (!q) return;
      
      // Get the current active tab or default to action
      const activeTab = document.querySelector('.genre-button.active');
      const genreKey = activeTab ? activeTab.dataset.tab : 'action';
      const pane = document.getElementById(genreKey);
      
      // Show this pane and hide others
      panes.forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
      });
      pane.style.display = 'flex';
      pane.classList.add('active');
      
      pane.innerHTML = '<div class="loading">Searching...</div>';
      
      fetch(`${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP error! Status: ${r.status}`);
          return r.json();
        })
        .then(data => {
          pane.innerHTML = '';
          
          if (!data.results || data.results.length === 0) {
            pane.innerHTML = `<div class="no-results">No results found for "${q}"</div>`;
            return;
          }

          const moviesToShow = data.results.slice(0, 5);
          
          moviesToShow.forEach(m => {
            // Handle potential missing data
            const releaseYear = m.release_date ? m.release_date.slice(0, 4) : 'N/A';
            const rating = m.vote_average ? m.vote_average.toFixed(1) : 'N/A';
            const posterPath = m.poster_path ? `${IMG_BASE}${m.poster_path}` : DEFAULT_POSTER;
            
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
              <div class="movie-poster">
                <img src="${posterPath}" alt="${m.title}" onerror="this.src='${DEFAULT_POSTER}'">
              </div>
              <div class="movie-info">
                <h3>${m.title}</h3>
                <p>${releaseYear} | ☆ ${rating}</p>
              </div>`;
            card.addEventListener('click', () => loadFeatured(m.id));
            pane.appendChild(card);
          });

          // If we got less than 5 movies, fill with placeholder cards
          if (moviesToShow.length < 5) {
            const placeholdersNeeded = 5 - moviesToShow.length;
            for (let i = 0; i < placeholdersNeeded; i++) {
              const placeholderCard = document.createElement('div');
              placeholderCard.className = 'movie-card placeholder';
              placeholderCard.innerHTML = `
                <div class="movie-poster">
                  <img src="${DEFAULT_POSTER}" alt="Placeholder">
                </div>
                <div class="movie-info">
                  <h3>Movie data unavailable</h3>
                  <p>N/A | ☆ N/A</p>
                </div>`;
              pane.appendChild(placeholderCard);
            }
          }
          
          // Update active tab button
          tabs.forEach(b => b.classList.remove('active'));
          document.querySelector(`[data-tab="${genreKey}"]`).classList.add('active');
          
          // Add navigation controls
          addNavigationControls(genreKey);
          
          // Hide featured section when searching if no specific movie is selected
          featuredSection.classList.remove('active');
          featuredSection.style.display = 'none';
          featuredSectionActive = false;
        })
        .catch(err => {
          console.error('Search failed:', err);
          pane.innerHTML = `<div class="error">Search failed. Please try again.</div>`;
          
          // Add 5 placeholder cards on error
          for (let i = 0; i < 5; i++) {
            const placeholderCard = document.createElement('div');
            placeholderCard.className = 'movie-card placeholder';
            placeholderCard.innerHTML = `
              <div class="movie-poster">
                <img src="${DEFAULT_POSTER}" alt="Placeholder">
              </div>
              <div class="movie-info">
                <h3>Movie data unavailable</h3>
                <p>N/A | ☆ N/A</p>
              </div>`;
            pane.appendChild(placeholderCard);
          }
        });
    });

  // Enter key should trigger search
  document.getElementById('homeSearchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('homeSearchBtn').click();
    }
  });

  // Function to add navigation controls for a genre
  function addNavigationControls(genreKey) {
    const container = document.getElementById(genreKey);
    
    // Skip if no movies in this container or if navigation already added
    if (!container.querySelector('.movie-card') || 
        document.querySelector(`.row-navigation[data-for="${genreKey}"]`)) {
      return;
    }
    
    // Create row navigation container
    const navContainer = document.createElement('div');
    navContainer.className = 'row-navigation';
    navContainer.setAttribute('data-for', genreKey);
    navContainer.innerHTML = `
      <button class="scroll-btn scroll-left" aria-label="Scroll left in ${genreKey}" data-target="${genreKey}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button class="scroll-btn scroll-right" aria-label="Scroll right in ${genreKey}" data-target="${genreKey}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    `;
    
    // Insert navigation before the container
    container.parentNode.insertBefore(navContainer, container);
    
    // Handle scroll button clicks for this genre
    navContainer.querySelectorAll('.scroll-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const targetContainer = document.getElementById(targetId);
        const direction = btn.classList.contains('scroll-left') ? -1 : 1;
        const scrollAmount = 220; // Card width + gap
        
        targetContainer.scrollBy({
          left: direction * scrollAmount,
          behavior: 'smooth'
        });
      });
    });
    
    // Add hover class to container to show/hide arrows
    const navBtns = navContainer.querySelectorAll('.scroll-btn');
    
    // Show buttons on container hover
    container.addEventListener('mouseenter', () => {
      navBtns.forEach(btn => btn.classList.add('visible'));
    });
    
    container.addEventListener('mouseleave', () => {
      navBtns.forEach(btn => btn.classList.remove('visible'));
    });
    
    // Keyboard navigation for focused cards
    container.querySelectorAll('.movie-card').forEach(card => {
      card.setAttribute('tabindex', '0'); // Make cards focusable
      
      card.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = card.nextElementSibling;
          if (next && next.classList.contains('movie-card')) {
            next.focus();
            next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = card.previousElementSibling;
          if (prev && prev.classList.contains('movie-card')) {
            prev.focus();
            prev.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click(); // Trigger the click event on Enter or Space
        }
      });
    });
  }
  
  // Function to update scroll shadows
  function updateScrollShadows() {
    document.querySelectorAll('.tab-content.movies-grid.active').forEach(container => {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      // Add shadow classes based on scroll position
      if (scrollLeft > 10) {
        container.classList.add('shadow-left');
      } else {
        container.classList.remove('shadow-left');
      }
      
      if (scrollLeft < maxScrollLeft - 10) {
        container.classList.add('shadow-right');
      } else {
        container.classList.remove('shadow-right');
      }
    });
  }
  
  // Update shadows when scrolling
  document.querySelectorAll('.tab-content.movies-grid').forEach(container => {
    container.addEventListener('scroll', updateScrollShadows);
  });
  
  // Kick things off by selecting the first Action card (after it's loaded)
  setTimeout(() => {
    const firstCard = document
      .getElementById('action')
      .querySelector('.movie-card');
    if (firstCard) firstCard.click();
  }, 1500);
});