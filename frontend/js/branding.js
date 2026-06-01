// ============================================
// BRANDING - Pre-render warna (anti-FOUC)
// ============================================
(function() {
  const saved = localStorage.getItem('sekolah_config');
  if (saved) {
    try {
      window._savedBranding = JSON.parse(saved);
    } catch(e) {}
  }

  // Pakai cache lokal dulu, kalau tidak ada pakai default merah
  const _warna = (window._savedBranding && window._savedBranding.warna) || {
    utama: '#7f1d1d',
    utama_muda: '#dc2626',
    aksen: '#b91c1c'
  };
  const _root = document.documentElement;
  _root.style.setProperty('--primary-dark',  _warna.utama);
  _root.style.setProperty('--primary',       _warna.utama_muda);
  _root.style.setProperty('--primary-light', _warna.utama_muda);
  _root.style.setProperty('--accent',        _warna.aksen);

  // Pre-render gradient + transition mulus saat warna berubah
  const _style = document.createElement('style');
  _style.id = 'branding-pre-style';
  _style.textContent = `
    :root { transition: none; }
    body, .sidebar, .navbar, .btn, .gradient-bg, .logo-icon, .badge-masuk, .badge-keluar {
      transition: background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease, background 0.35s ease !important;
    }
    .gradient-bg {
      background: linear-gradient(135deg, ${_warna.utama} 0%, ${_warna.utama_muda} 40%, ${_warna.aksen} 100%) !important;
    }
    .btn-primary, .btn-login {
      background: linear-gradient(135deg, ${_warna.utama}, ${_warna.utama_muda}) !important;
    }
  `;
  document.head.appendChild(_style);
})();

// ============================================
// KONFIGURASI BRANDING SEKOLAH (DEFAULT)
// Ini hanya fallback. Sumber utama = API /pengaturan
// ============================================

const SEKOLAH_CONFIG = {
  nama:         'SDN Palmerah 07 Pagi',
  nama_singkat: 'SDN Palmerah 07',
  tagline:      'Sistem Arsip Surat Digital',
  alamat:       'Jl. Palmerah No. 07, Jakarta Barat',
  tahun_berdiri: '1985',
  logo: '',
  warna: {
    utama:      '#7f1d1d',  // Merah tua
    utama_muda: '#dc2626',  // Merah sedang
    aksen:      '#b91c1c',  // Merah variant
  },
  tahun_sistem: new Date().getFullYear(),
  kredit: 'Arsip Surat Digital'
};

// ============================================
// FUNGSI TERAPKAN BRANDING KE DOM
// ============================================

const _applyBrandingToDOM = () => {
  const root = document.documentElement;
  root.style.setProperty('--primary-dark',  SEKOLAH_CONFIG.warna.utama);
  root.style.setProperty('--primary',       SEKOLAH_CONFIG.warna.utama_muda);
  root.style.setProperty('--primary-light', SEKOLAH_CONFIG.warna.utama_muda);
  root.style.setProperty('--accent',        SEKOLAH_CONFIG.warna.aksen);

  const existingStyle = document.getElementById('branding-style');
  if (existingStyle) existingStyle.remove();
  const style = document.createElement('style');
  style.id = 'branding-style';
  style.textContent = `
    .gradient-bg {
      background: linear-gradient(135deg, ${SEKOLAH_CONFIG.warna.utama} 0%, ${SEKOLAH_CONFIG.warna.utama_muda} 40%, ${SEKOLAH_CONFIG.warna.aksen} 100%) !important;
    }
    .logo-icon {
      background: linear-gradient(135deg, ${SEKOLAH_CONFIG.warna.utama_muda}, ${SEKOLAH_CONFIG.warna.aksen}) !important;
    }
    .btn-primary, .btn-login {
      background: linear-gradient(135deg, ${SEKOLAH_CONFIG.warna.utama}, ${SEKOLAH_CONFIG.warna.utama_muda}) !important;
    }
    .btn-primary:hover, .btn-login:hover:not(:disabled) {
      background: linear-gradient(135deg, ${SEKOLAH_CONFIG.warna.utama}, ${SEKOLAH_CONFIG.warna.utama_muda}) !important;
      filter: brightness(1.1);
    }
    .nav-item.active { background: rgba(255,255,255,0.15) !important; }
    .stat-card .stat-value { color: ${SEKOLAH_CONFIG.warna.utama_muda}; }
    .spinner-dark { border-top-color: ${SEKOLAH_CONFIG.warna.utama_muda} !important; }
    .page-btn.active { background: ${SEKOLAH_CONFIG.warna.utama_muda} !important; border-color: ${SEKOLAH_CONFIG.warna.utama_muda} !important; }
  `;
  document.head.appendChild(style);

  _updateLogo();
  _updateNamaSidebar();
  _updateTitle();
  _updateFooter();
  _updateFavicon();
};

const _updateLogo = () => {
  const sidebarLogoIcon = document.querySelector('.sidebar-logo .logo-icon');
  if (sidebarLogoIcon) {
    sidebarLogoIcon.innerHTML = SEKOLAH_CONFIG.logo
      ? `<img src="${SEKOLAH_CONFIG.logo}" alt="Logo" style="width:32px;height:32px;object-fit:contain;border-radius:6px">`
      : '🏫';
  }
  const loginLogo = document.getElementById('login-logo');
  if (loginLogo) {
    if (SEKOLAH_CONFIG.logo) {
      loginLogo.innerHTML = `<img src="${SEKOLAH_CONFIG.logo}" alt="${SEKOLAH_CONFIG.nama}" style="width:72px;height:72px;object-fit:contain">`;
      loginLogo.style.background = 'white';
      loginLogo.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
      loginLogo.innerHTML = '🏫';
    }
  }
  const loginNama = document.getElementById('login-nama-sekolah');
  if (loginNama) loginNama.textContent = SEKOLAH_CONFIG.nama;
  const loginTagline = document.getElementById('login-tagline');
  if (loginTagline) loginTagline.textContent = SEKOLAH_CONFIG.tagline;
  const navNama = document.getElementById('nav-nama-sekolah');
  if (navNama) navNama.textContent = SEKOLAH_CONFIG.nama_singkat;
};

const _updateFavicon = () => {
  const favicon = document.getElementById('favicon');
  if (favicon && SEKOLAH_CONFIG.logo) favicon.href = SEKOLAH_CONFIG.logo;
};

const _updateNamaSidebar = () => {
  const namaEl = document.querySelector('.logo-text h2');
  if (namaEl) namaEl.textContent = SEKOLAH_CONFIG.nama_singkat;
  const taglineEl = document.querySelector('.logo-text p');
  if (taglineEl) taglineEl.textContent = SEKOLAH_CONFIG.tagline;
};

const _updateTitle = () => {
  if (SEKOLAH_CONFIG.nama_singkat) {
    document.title = document.title
      .replace('Arsip Surat Sekolah', SEKOLAH_CONFIG.nama_singkat)
      .replace('Sekolah', SEKOLAH_CONFIG.nama_singkat);
  }
};

const _updateFooter = () => {
  document.querySelectorAll('.footer-copy, #footer-copy').forEach(el => {
    el.textContent = `© ${SEKOLAH_CONFIG.tahun_sistem} ${SEKOLAH_CONFIG.nama} · ${SEKOLAH_CONFIG.kredit}`;
  });
};

// Merge config dari API ke SEKOLAH_CONFIG
const _mergeConfig = (cfg) => {
  if (!cfg) return;
  if (cfg.nama)         SEKOLAH_CONFIG.nama         = cfg.nama;
  if (cfg.nama_singkat) SEKOLAH_CONFIG.nama_singkat = cfg.nama_singkat;
  if (cfg.tagline)      SEKOLAH_CONFIG.tagline      = cfg.tagline;
  if (cfg.alamat)       SEKOLAH_CONFIG.alamat       = cfg.alamat;
  if (cfg.logo)         SEKOLAH_CONFIG.logo         = cfg.logo;
  if (cfg.warna) {
    if (cfg.warna.utama)      SEKOLAH_CONFIG.warna.utama      = cfg.warna.utama;
    if (cfg.warna.utama_muda) SEKOLAH_CONFIG.warna.utama_muda = cfg.warna.utama_muda;
    if (cfg.warna.aksen)      SEKOLAH_CONFIG.warna.aksen      = cfg.warna.aksen;
  }
};

// ============================================
// MAIN: terapkanBranding (LOCK KE PENGATURAN)
// Selalu fetch dari API agar sync dengan pengaturan admin
// ============================================
const terapkanBranding = async () => {
  // 1. Tampilkan dari cache dulu (instant, anti-FOUC)
  if (window._savedBranding) _mergeConfig(window._savedBranding);
  _applyBrandingToDOM();

  // 2. Selalu fetch dari API di background (LOCK ke pengaturan)
  // Admin ubah di /pengaturan → semua user lain otomatis dapat perubahan
  if (window._fetchingBranding) return;
  window._fetchingBranding = true;

  const _apiBase = (typeof API_URL !== 'undefined')
    ? API_URL
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : window.location.origin + '/api');

  try {
    const res = await fetch(`${_apiBase}/pengaturan?_t=${Date.now()}`, { cache: 'no-store' });
    const json = await res.json();
    const cfg = json?.data?.data || json?.data || null;
    if (cfg) {
      // Simpan ke localStorage sebagai cache
      localStorage.setItem('sekolah_config', JSON.stringify(cfg));
      window._savedBranding = cfg;
      // Merge & apply (dengan animasi transition yang sudah ada)
      _mergeConfig(cfg);
      _applyBrandingToDOM();
    }
  } catch (err) {
    // Offline / API error → pakai cache / default, tidak apa-apa
  } finally {
    window._fetchingBranding = false;
  }
};

// Panggil saat DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', terapkanBranding);
} else {
  terapkanBranding();
}

// ============================================
// LOADING EFFECTS - Top loading bar + skeleton helpers
// ============================================
(function() {
  // Top loading bar (NProgress-like)
  const bar = document.createElement('div');
  bar.id = 'top-loading-bar';
  const c = (window._savedBranding && window._savedBranding.warna) || {};
  bar.style.cssText = `position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,${c.utama_muda||'#dc2626'},${c.utama||'#7f1d1d'});z-index:99999;transition:width 0.3s ease,opacity 0.3s ease;opacity:0;box-shadow:0 2px 8px rgba(220,38,38,0.4)`;
  document.body && document.body.appendChild(bar);
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(bar));
  }

  window.startLoading = () => {
    bar.style.opacity = '1'; bar.style.width = '70%';
    const logo = document.querySelector('.sidebar-logo');
    if (logo) logo.classList.add('loading');
  };
  window.finishLoading = () => {
    bar.style.width = '100%';
    const logo = document.querySelector('.sidebar-logo');
    if (logo) logo.classList.remove('loading');
    setTimeout(() => { bar.style.opacity = '0'; setTimeout(() => bar.style.width = '0', 300); }, 200);
  };

  // Tampilkan loading bar saat klik link navigasi internal
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || !a.href) return;
    if (a.target === '_blank' || a.href.startsWith('javascript:') || a.href.includes('#')) return;
    if (a.origin === window.location.origin) window.startLoading();
  });
})();

// Skeleton row helper
window.skeletonRow = (cols = 6) => {
  let html = '<tr>';
  for (let i = 0; i < cols; i++) {
    const w = [40, 120, 180, 100, 90, 60][i] || 100;
    html += `<td><div class="skeleton" style="height:14px;width:${w}px"></div></td>`;
  }
  return html + '</tr>';
};
