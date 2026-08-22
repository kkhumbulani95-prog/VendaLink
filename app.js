const API_BASE = windows.location.hostname === 'localhost ' ? 'http://localhost:3000/api' : '/api';
let currentCategory = 'all';
let openOnlyFlag = false;
let searchQuery = '';
let userCoords = null; // { lat, lng }
let searchTimeout;

// 1. Fetch & Render Vendors
async function loadVendors() {
  const list = document.getElementById('vendor-list');
  list.innerHTML = '<p class="loading">Loading nearby traders…</p>';

  const params = new URLSearchParams();
  if (currentCategory !== 'all') params.set('category', currentCategory);
  if (openOnlyFlag) params.set('openOnly', 'true');
  if (searchQuery) params.set('search', searchQuery);

  try {
    const res = await fetch(`${API_BASE}/vendors?${params.toString()}`);
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    let vendors = await res.json();

    // Distance Calculation & Sorting
    if (userCoords) {
      vendors.forEach(v => {
        v.distance = calculateDistance(userCoords.lat, userCoords.lng, v.Latitude, v.Longitude);
      });
      // Sort by distance (closest first)
      vendors.sort((a, b) => a.distance - b.distance);
    }

    renderVendorCards(vendors);
  } catch (err) {
    console.error('Failed to load vendors:', err);
    list.innerHTML = '<p class="no-results">Couldn\u2019t reach the server. Check your connection.</p>';
  }
}

function renderVendorCards(vendors) {
  const list = document.getElementById('vendor-list');
  list.innerHTML = '';

  if (!vendors.length) {
    list.innerHTML = '<p class="no-results">No traders found for this filter.</p>';
    return;
  }

  vendors.forEach((vendor) => {
    const card = document.createElement('div');
    card.className = 'vendor-card';
    
    const distanceHtml = vendor.distance !== undefined 
      ? `<span class="distance-badge">${vendor.distance.toFixed(1)} km</span>` 
      : '';

    card.innerHTML = `
      <div class="card-header">
        <h3>${escapeHtml(vendor.BusinessName)} ${distanceHtml}</h3>
        <span class="status ${vendor.IsOpen ? 'open' : 'closed'}" id="status-badge-${vendor.VendorID}">
          <span class="status-dot"></span>${vendor.IsOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      <p class="location">${escapeHtml(vendor.LocationDescription || '')}</p>
      <p class="payments">Accepts ${escapeHtml(vendor.PaymentTypes || '')}</p>
      
      <!-- Vendor UI: Status Toggle -->
      <div class="vendor-action-panel">
        <button onclick="toggleVendorStatus(${vendor.VendorID}, ${vendor.IsOpen})">
          Set to ${vendor.IsOpen ? 'Closed' : 'Open'}
        </button>
      </div>

      <button class="details-btn" type="button" data-vendor-id="${vendor.VendorID}">
        View stock &amp; reviews
      </button>
      <div id="details-${vendor.VendorID}" class="item-list hidden"></div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.details-btn').forEach((btn) => {
    btn.addEventListener('click', () => toggleDetails(btn.dataset.vendorId));
  });
}

// 2. Fetch Details (Products AND Reviews)
async function toggleDetails(vendorId) {
  const panel = document.getElementById(`details-${vendorId}`);
  const isHidden = panel.classList.contains('hidden');

  if (!isHidden) {
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');
  if (panel.dataset.loaded) return;

  panel.innerHTML = '<p class="loading">Loading details…</p>';
  try {
    // Fetch products
    const pRes = await fetch(`${API_BASE}/vendors/${vendorId}/products`);
    const products = pRes.ok ? await pRes.json() : [];

    // Fetch reviews (Assuming API handles this, or falls back gracefully)
    const rRes = await fetch(`${API_BASE}/vendors/${vendorId}/reviews`).catch(() => ({ ok: false }));
    const reviews = (rRes && rRes.ok) ? await rRes.json() : [];

    // Build Products HTML
    const productsHtml = products.length
      ? products.map((p) => `
          <div class="item-row ${p.IsAvailable ? '' : 'unavailable'}">
            <span>${escapeHtml(p.ProductName)}</span>
            <span class="price">R${Number(p.Price).toFixed(2)}</span>
          </div>
        `).join('')
      : '<p class="no-results" style="padding: 10px 0;">No items listed today.</p>';

    // Build Reviews HTML
    const reviewsListHtml = reviews.length
      ? reviews.map((r) => `
          <div class="review-item">
            <strong>${'★'.repeat(r.Rating)}${'☆'.repeat(5-r.Rating)}</strong> — ${escapeHtml(r.Comment || '')}
            ${r.IsVerifiedVisit ? ' <span style="color:var(--teal-400)">✓ Verified</span>' : ''}
          </div>
        `).join('')
      : '<p class="no-results" style="padding: 10px 0;">No reviews yet. Be the first!</p>';

    // Build Review Form HTML
    const reviewFormHtml = `
      <form class="review-form" onsubmit="submitReview(event, ${vendorId})">
        <select name="rating" required>
          <option value="" disabled selected>Select Rating</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Okay</option>
          <option value="2">2 - Poor</option>
          <option value="1">1 - Terrible</option>
        </select>
        <textarea name="comment" placeholder="Leave a review..." rows="2" required></textarea>
        <button type="submit">Submit Review</button>
      </form>
    `;

    panel.innerHTML = `
      ${productsHtml}
      <div class="reviews-section">
        <h4>Customer Reviews</h4>
        <div id="reviews-list-${vendorId}">${reviewsListHtml}</div>
        ${reviewFormHtml}
      </div>
    `;
    panel.dataset.loaded = 'true';
  } catch (err) {
    console.error('Failed to load details:', err);
    panel.innerHTML = '<p class="no-results">Couldn\u2019t load details right now.</p>';
  }
}

// 3. API Actions (Status Toggle & Review Submission)
async function toggleVendorStatus(vendorId, currentStatus) {
  const newStatus = !currentStatus;
  try {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen: newStatus })
    });
    if (res.ok) loadVendors(); // Reload list to update UI
    else alert('Failed to update status on server.');
  } catch (err) {
    alert('Network error while updating status.');
  }
}

async function submitReview(event, vendorId) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button');
  const payload = {
    vendorId: parseInt(vendorId),
    rating: parseInt(form.rating.value),
    comment: form.comment.value,
    isVerifiedVisit: false // Currently unset automatically as per docs
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error('Submission failed');
    
    // Optimistic UI update
    const reviewsList = document.getElementById(`reviews-list-${vendorId}`);
    const newReview = document.createElement('div');
    newReview.className = 'review-item';
    newReview.innerHTML = `<strong>${'★'.repeat(payload.rating)}${'☆'.repeat(5-payload.rating)}</strong> — ${escapeHtml(payload.comment)}`;
    
    // Clear "No reviews yet" if present
    if (reviewsList.querySelector('.no-results')) reviewsList.innerHTML = '';
    
    reviewsList.prepend(newReview);
    form.reset();
    submitBtn.textContent = 'Review Added!';
    setTimeout(() => { submitBtn.textContent = 'Submit Review'; submitBtn.disabled = false; }, 2000);

  } catch (err) {
    alert('Failed to submit review. Try again.');
    submitBtn.textContent = 'Submit Review';
    submitBtn.disabled = false;
  }
}

// 4. Utility / UI Handlers
function filterCategory(categoryName, pillEl) {
  currentCategory = categoryName;
  document.querySelectorAll('.cat-pill').forEach((btn) => btn.classList.remove('active'));
  pillEl.classList.add('active');
  loadVendors();
}

function handleSearch(e) {
  searchQuery = e.target.value.trim();
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadVendors, 400); // Debounce API calls
}

function getUserLocation() {
  const btn = document.getElementById('geo-btn');
  if (!navigator.geolocation) {
    alert('Location isn\u2019t available on this device.');
    return;
  }
  
  btn.innerHTML = '<span aria-hidden="true">⌖</span> Locating...';
  
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      btn.classList.add('active');
      btn.innerHTML = '<span aria-hidden="true">⌖</span> Location active';
      loadVendors();
    },
    () => {
      alert('Couldn\u2019t get your location \u2014 showing all traders instead.');
      btn.innerHTML = '<span aria-hidden="true">⌖</span> Use my location';
    }
  );
}

// Haversine distance formula (returns distance in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderCategoryPills() {
  const bar = document.getElementById('category-bar');
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'Fresh Produce', label: 'Fresh Produce' },
    { id: 'Hot Food', label: 'Hot Food' },
    { id: 'Clothing', label: 'Clothing' }
  ];

  bar.innerHTML = categories.map((cat) => `
    <button type="button" class="cat-pill${cat.id === 'all' ? ' active' : ''}" data-category="${cat.id}">
      ${cat.label}
    </button>
  `).join('');

  bar.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.addEventListener('click', () => filterCategory(btn.dataset.category, btn));
  });
}

// Event Listeners
document.getElementById('geo-btn').addEventListener('click', getUserLocation);
document.getElementById('open-only').addEventListener('change', (e) => {
  openOnlyFlag = e.target.checked;
  loadVendors();
});
document.getElementById('search-box').addEventListener('input', handleSearch);
document.getElementById('vendor-mode-checkbox').addEventListener('change', (e) => {
  document.body.classList.toggle('vendor-mode', e.target.checked);
});

// Init
renderCategoryPills();
loadVendors();
