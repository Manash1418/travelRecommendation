// Global variable to store fetched data
let travelData = null;

// Timezone mapping for recommended destinations (Task 10)
const destinationTimezones = {
  "Sydney, Australia": "Australia/Sydney",
  "Melbourne, Australia": "Australia/Melbourne",
  "Tokyo, Japan": "Asia/Tokyo",
  "Kyoto, Japan": "Asia/Tokyo",
  "Rio de Janeiro, Brazil": "America/Sao_Paulo",
  "São Paulo, Brazil": "America/Sao_Paulo",
  "Angkor Wat, Cambodia": "Asia/Phnom_Penh",
  "Taj Mahal, India": "Asia/Kolkata",
  "Bora Bora, French Polynesia": "Pacific/Tahiti",
  "Copacabana Beach, Brazil": "America/Sao_Paulo"
};

// Fetch data from local JSON database (Task 6)
async function fetchRecommendations() {
  try {
    const response = await fetch('travel_recommendation_api.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    travelData = await response.json();
    console.log("Successfully fetched travel recommendations:", travelData);
  } catch (error) {
    console.error("Error loading travel recommendation data:", error);
  }
}

// Format local time for the given location (Task 10)
function getFormattedTime(placeName) {
  const timezone = destinationTimezones[placeName];
  if (!timezone) return null;

  try {
    const options = { 
      timeZone: timezone, 
      hour12: true, 
      hour: 'numeric', 
      minute: 'numeric', 
      second: 'numeric' 
    };
    return new Date().toLocaleTimeString('en-US', options);
  } catch (error) {
    console.error(`Error formatting time for ${placeName} in timezone ${timezone}:`, error);
    return null;
  }
}

// Display recommendations in the grid container (Task 8)
function renderResults(results) {
  const container = document.getElementById('results-container');
  container.innerHTML = ''; // Clear previous results

  if (results.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: rgba(255, 255, 255, 0.05); border-radius: 15px; border: 1px dashed rgba(255, 255, 255, 0.1);">
        <p style="color: #9ca3af; font-size: 1.1rem; margin-bottom: 0.5rem;">No results found.</p>
        <p style="color: #6b7280; font-size: 0.9rem;">Try searching for "beach", "temple", "country", or specific countries like "Japan", "Brazil", "Australia".</p>
      </div>
    `;
    return;
  }

  results.forEach(place => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    
    // Check if timezone support is available
    const localTime = getFormattedTime(place.name);
    const timeBadgeHTML = localTime ? `
      <div class="time-badge" data-place="${place.name}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>${localTime}</span>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="card-img-container">
        <img src="${place.imageUrl}" alt="${place.name}" loading="lazy">
        ${timeBadgeHTML}
      </div>
      <div class="card-body">
        <h3 class="card-title">${place.name}</h3>
        <p class="card-text">${place.description}</p>
        <button class="btn btn-primary card-btn" onclick="alert('Booking portal is coming soon for ${place.name.replace(/'/g, "\\'")}!')">Visit</button>
      </div>
    `;
    container.appendChild(card);
  });

  // Start real-time clock update interval for visible badges
  startClockUpdates();
}

let clockIntervalId = null;
function startClockUpdates() {
  if (clockIntervalId) clearInterval(clockIntervalId);

  clockIntervalId = setInterval(() => {
    const badges = document.querySelectorAll('.time-badge');
    if (badges.length === 0) {
      clearInterval(clockIntervalId);
      clockIntervalId = null;
      return;
    }
    
    badges.forEach(badge => {
      const placeName = badge.getAttribute('data-place');
      const timeSpan = badge.querySelector('span');
      const newTime = getFormattedTime(placeName);
      if (newTime && timeSpan) {
        timeSpan.textContent = newTime;
      }
    });
  }, 1000);
}

// Search algorithm parsing user keywords (Task 7)
function handleSearch() {
  if (!travelData) {
    console.warn("Travel data not loaded yet.");
    return;
  }

  const searchInput = document.getElementById('search-input');
  const query = searchInput.value.toLowerCase().trim();
  
  if (!query) {
    alert("Please enter a destination or keyword (e.g. beach, temple, Japan) to search.");
    return;
  }

  let results = [];

  // Match keyword beaches (e.g., beach, beaches)
  if (query === 'beach' || query === 'beaches') {
    results = travelData.beaches;
  } 
  // Match keyword temples (e.g., temple, temples)
  else if (query === 'temple' || query === 'temples') {
    results = travelData.temples;
  } 
  // Match keyword countries (e.g., country, countries) - shows all cities in all countries
  else if (query === 'country' || query === 'countries') {
    travelData.countries.forEach(country => {
      results = results.concat(country.cities);
    });
  } 
  // Specific country searches
  else if (query === 'australia') {
    const countryObj = travelData.countries.find(c => c.name.toLowerCase() === 'australia');
    if (countryObj) results = countryObj.cities;
  } 
  else if (query === 'japan') {
    const countryObj = travelData.countries.find(c => c.name.toLowerCase() === 'japan');
    if (countryObj) results = countryObj.cities;
  } 
  else if (query === 'brazil') {
    const countryObj = travelData.countries.find(c => c.name.toLowerCase() === 'brazil');
    if (countryObj) results = countryObj.cities;
  }
  // Fallback: search for match in name or description of everything
  else {
    // Search within beaches
    const matchBeaches = travelData.beaches.filter(
      b => b.name.toLowerCase().includes(query) || b.description.toLowerCase().includes(query)
    );
    // Search within temples
    const matchTemples = travelData.temples.filter(
      t => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
    );
    // Search within country cities
    let matchCities = [];
    travelData.countries.forEach(country => {
      const cities = country.cities.filter(
        c => c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
      );
      matchCities = matchCities.concat(cities);
    });
    
    results = [...matchBeaches, ...matchTemples, ...matchCities];
  }

  renderResults(results);
}

// Clear results function (Task 9)
function handleReset() {
  const searchInput = document.getElementById('search-input');
  searchInput.value = '';
  
  const container = document.getElementById('results-container');
  container.innerHTML = '';

  if (clockIntervalId) {
    clearInterval(clockIntervalId);
    clockIntervalId = null;
  }
  
  console.log("Cleared search query and recommendation results.");
}

// Attach event listeners when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize data fetch
  fetchRecommendations();

  const searchBtn = document.getElementById('btn-search');
  const resetBtn = document.getElementById('btn-reset');
  const searchInput = document.getElementById('search-input');

  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }

  // Allow pressing Enter to trigger search
  if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    });
  }
});
