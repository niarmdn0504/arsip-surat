// ============================================
// API HELPER - Arsip Surat Sekolah
// ============================================

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : window.location.origin + '/api';

// Ambil token dari localStorage
const getToken = () => localStorage.getItem('token');
const getUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};

// Redirect ke login jika belum login
const requireAuth = () => {
  if (!getToken()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
};

// Redirect ke dashboard jika sudah login
const redirectIfLoggedIn = () => {
  if (getToken()) {
    window.location.href = '/pages/dashboard.html';
  }
};

// Fetch helper dengan auto auth header
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const method = options.method || 'GET';
    let url = `${API_URL}${endpoint}`;
    if (method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    }

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = '/pages/login.html';
      return null;
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API Error:', err);
    showToast('Koneksi ke server gagal. Coba lagi.', 'error');
    return null;
  }
};

// Upload file (multipart form)
const apiUpload = async (endpoint, formData) => {
  const token = getToken();
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('Upload Error:', err);
    return null;
  }
};

// ============================================
// TOAST NOTIFICATION
// ============================================
const createToastContainer = () => {
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
  document.body.appendChild(c);
  return c;
};

const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm shadow-lg 
    ${colors[type]} transform translate-x-full transition-transform duration-300 z-[9999]`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full');
  });

  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// ============================================
// MODAL CONFIRM HAPUS
// ============================================
const confirmDelete = (message) => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </div>
        <h3 class="text-center font-semibold text-gray-800 mb-2">Konfirmasi Hapus</h3>
        <p class="text-center text-gray-500 text-sm mb-6">${message}</p>
        <div class="flex gap-3">
          <button id="btn-cancel-delete" class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition">Batal</button>
          <button id="btn-confirm-delete" class="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition">Hapus</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('btn-cancel-delete').onclick = () => { overlay.remove(); resolve(false); };
    document.getElementById('btn-confirm-delete').onclick = () => { overlay.remove(); resolve(true); };
  });
};

// ============================================
// FORMAT HELPERS
// ============================================
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const badgeJenis = (jenis) => {
  return jenis === 'masuk'
    ? `<span class="badge-masuk">📥 Masuk</span>`
    : `<span class="badge-keluar">📤 Keluar</span>`;
};

const badgeKategori = (kategori) => {
  const map = {
    'undangan': 'bg-purple-100 text-purple-700',
    'keputusan': 'bg-blue-100 text-blue-700',
    'edaran': 'bg-orange-100 text-orange-700',
    'pemberitahuan': 'bg-teal-100 text-teal-700',
    'permohonan': 'bg-pink-100 text-pink-700',
    'umum': 'bg-gray-100 text-gray-600'
  };
  const cls = map[kategori] || map['umum'];
  return `<span class="px-2 py-0.5 rounded-lg text-xs font-medium ${cls}">${kategori}</span>`;
};

// Set info user di navbar
const setUserInfo = () => {
  const user = getUser();
  if (!user) return;
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');
  const avatarEl = document.getElementById('user-avatar');
  if (nameEl) nameEl.textContent = user.nama;
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Guru';
  if (avatarEl) avatarEl.textContent = user.nama?.charAt(0).toUpperCase() || 'U';
};

// Logout
let _loggingOut = false;
const logout = async () => {
  if (_loggingOut) return;
  _loggingOut = true;
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (err) {}
  localStorage.clear();
  window.location.href = '/pages/login.html';
};
window.logout = logout;

// Tangkap klik tombol Keluar di mana saja agar pasti bekerja
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button, a');
  if (!btn) return;
  const onclickAttr = btn.getAttribute('onclick') || '';
  // Hanya tangkap jika onclick="logout()" ATAU teks persis "Keluar" / "Logout"
  // Jangan tangkap badge "📤 Keluar" atau nav item lain
  const txtTrim = btn.textContent.replace(/\s+/g, ' ').trim();
  const isLogoutBtn =
    onclickAttr === 'logout()' ||
    txtTrim === 'Keluar' ||
    txtTrim === '🚪 Keluar' ||
    txtTrim === 'Logout' ||
    btn.id === 'btn-logout' ||
    btn.classList.contains('btn-logout');
  if (isLogoutBtn) {
    e.preventDefault();
    e.stopPropagation();
    logout();
  }
});
