const API_BASE = windows.location.hostname === 'localhost ' ? 'http://localhost:3000/api' : '/api';

let currentVendor = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const statusPanel = document.getElementById('status-panel');
const currentStatusText = document.getElementById('current-status-text');
const toggleStatusBtn = document.getElementById('toggle-status-btn');
const vendorNameLabel = document.getElementById('vendor-name');
const stockList = document.getElementById('stock-list');

// Profile Form Elements
const profileForm = document.getElementById('profile-form');
const updateGpsBtn = document.getElementById('update-gps-btn');
const gpsStatus = document.getElementById('gps-status');

// --- Helper: Get Auth Headers ---
function getAuthHeaders() {
  const token = localStorage.getItem('vendorToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// --- 1. Check Authentication on Page Load ---
window.addEventListener('load', () => {
  const token = localStorage.getItem('vendorToken');
  const vendorId = localStorage.getItem('vendorId');

  if (token && vendorId) {
    // Already logged in from signup
    showDashboard();
  } else if (authSection.classList.contains('hidden')) {
    // Page tried to show dashboard without token
    logout();
  }
});

// --- 2. Login Form Submission ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('phone').value.trim(); // Using phone field for email
  const password = document.getElementById('pin').value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!email || !password) {
    alert('Email and password are required');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store auth info
    localStorage.setItem('vendorToken', data.token);
    localStorage.setItem('vendorId', data.vendor.vendorId);
    localStorage.setItem('businessName', data.vendor.businessName);

    showDashboard();
  } catch (err) {
    console.error('Login error:', err);
    alert(err.message || 'Login failed. Please check your credentials.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});

// --- 3. Logout ---
logoutBtn.addEventListener('click', logout);

function logout() {
  localStorage.removeItem('vendorToken');
  localStorage.removeItem('vendorId');
  localStorage.removeItem('businessName');
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  document.getElementById('login-form').reset();
}

// --- 4. Show Dashboard and Load Data ---
function showDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  loadDashboardData();
}

// --- 5. Load Dashboard Data ---
async function loadDashboardData() {
  const vendorId = localStorage.getItem('vendorId');
  
  if (!vendorId) {
    logout();
    return;
  }

  try {
    // Fetch vendor profile
    const headers = getAuthHeaders();
    const vRes = await fetch(`${API_BASE}/auth/me`, {
      headers
    });

    if (!vRes.ok) {
      if (vRes.status === 401) {
        logout();
        return;
      }
      throw new Error('Failed to load vendor profile');
    }

    const vendor = await vRes.json();
    currentVendor = vendor;

    // Update UI
    vendorNameLabel.textContent = currentVendor.BusinessName;
    updateStatusUI(currentVendor.IsOpen);

    // Populate Profile Form
    document.getElementById('prof-business').value = currentVendor.BusinessName || '';
    document.getElementById('prof-owner').value = currentVendor.OwnerName || '';
    document.getElementById('prof-phone').value = currentVendor.PhoneNumber || '';
    document.getElementById('prof-payments').value = currentVendor.PaymentTypes || '';
    document.getElementById('prof-location').value = currentVendor.LocationDescription || '';
    gpsStatus.textContent = `Current GPS: ${parseFloat(currentVendor.Latitude).toFixed(5)}, ${parseFloat(currentVendor.Longitude).toFixed(5)}`;

    // Fetch products
    const pRes = await fetch(`${API_BASE}/products`, {
      headers
    });

    if (!pRes.ok) throw new Error('Failed to load products');

    const products = await pRes.json();

    stockList.innerHTML = products.length
      ? products.map(p => `
          <div class="item-row ${p.IsAvailable ? '' : 'unavailable'}" style="padding: 8px 0; opacity: ${p.IsAvailable ? '1' : '0.6'};">
            <span style="font-size: 14px;">${escapeHtml(p.ProductName)}</span>
            <span class="price">R${Number(p.Price).toFixed(2)}</span>
          </div>
        `).join('')
      : '<p class="no-results">No items listed. Create your first product in the backend.</p>';

  } catch (err) {
    console.error('Error loading dashboard:', err);
    stockList.innerHTML = '<p class="no-results">Could not load data. Please log in again.</p>';
  }
}

// --- 6. Profile Update ---
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentVendor) {
    alert('Vendor data not loaded');
    return;
  }

  const vendorId = localStorage.getItem('vendorId');
  const submitBtn = document.getElementById('save-profile-btn');

  const updatedData = {
    businessName: document.getElementById('prof-business').value.trim(),
    ownerName: document.getElementById('prof-owner').value.trim(),
    phoneNumber: document.getElementById('prof-phone').value.trim(),
    paymentTypes: document.getElementById('prof-payments').value.trim(),
    locationDescription: document.getElementById('prof-location').value.trim(),
    latitude: currentVendor.Latitude,
    longitude: currentVendor.Longitude
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedData)
    });

    if (!res.ok) throw new Error('Failed to save profile');

    // Update local state
    currentVendor.BusinessName = updatedData.businessName;
    currentVendor.OwnerName = updatedData.ownerName;
    currentVendor.PhoneNumber = updatedData.phoneNumber;
    currentVendor.PaymentTypes = updatedData.paymentTypes;
    currentVendor.LocationDescription = updatedData.locationDescription;

    submitBtn.textContent = '✓ Saved Successfully!';
    submitBtn.style.background = 'var(--teal-400)';
    vendorNameLabel.textContent = updatedData.businessName;

    setTimeout(() => {
      submitBtn.textContent = 'Save Profile Info';
      submitBtn.style.background = 'var(--teal-600)';
      submitBtn.disabled = false;
    }, 2500);

  } catch (error) {
    console.error('Save error:', error);
    alert(error.message || 'Error saving profile');
    submitBtn.textContent = 'Save Profile Info';
    submitBtn.disabled = false;
  }
});

// --- 7. Update GPS Location ---
updateGpsBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  gpsStatus.textContent = 'Fetching location...';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentVendor.Latitude = position.coords.latitude;
      currentVendor.Longitude = position.coords.longitude;
      gpsStatus.textContent = `✓ New GPS ready: ${currentVendor.Latitude.toFixed(5)}, ${currentVendor.Longitude.toFixed(5)}`;
      gpsStatus.style.color = 'var(--teal-600)';
    },
    (err) => {
      gpsStatus.textContent = 'Failed to get location. Check permissions.';
      gpsStatus.style.color = 'var(--coral-600)';
    }
  );
});

// --- 8. Status Toggle ---
toggleStatusBtn.addEventListener('click', async () => {
  if (!currentVendor) return;

  const vendorId = localStorage.getItem('vendorId');
  const newStatus = !currentVendor.IsOpen;

  toggleStatusBtn.disabled = true;
  toggleStatusBtn.textContent = 'Updating...';

  try {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isOpen: newStatus })
    });

    if (!res.ok) throw new Error('Status update failed');

    currentVendor.IsOpen = newStatus;
    updateStatusUI(newStatus);

  } catch (err) {
    console.error('Status error:', err);
    alert('Failed to update status: ' + err.message);
  } finally {
    toggleStatusBtn.disabled = false;
  }
});

// --- 9. Update Status UI ---
function updateStatusUI(isOpen) {
  if (isOpen) {
    statusPanel.classList.remove('is-closed');
    statusPanel.classList.add('is-open');
    currentStatusText.innerHTML = '<span style="color: var(--teal-600)">🟢 YOU ARE OPEN</span>';
    toggleStatusBtn.textContent = 'Close Stall for the Day';
  } else {
    statusPanel.classList.remove('is-open');
    statusPanel.classList.add('is-closed');
    currentStatusText.innerHTML = '<span style="color: var(--coral-600)">🔴 YOU ARE CLOSED</span>';
    toggleStatusBtn.textContent = 'Open Stall';
  }
}

// --- 10. Utility: Escape HTML ---
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
