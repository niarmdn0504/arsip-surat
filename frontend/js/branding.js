// ============================================
// BRANDING - Sembunyikan page sampai branding ke-load
// ============================================
(function() {
  // Sembunyikan body dulu kalau belum ada data di localStorage
  const saved = localStorage.getItem('sekolah_config');
  if (!saved) {
    const style = document.createElement('style');
    style.id = 'branding-prevent-fouc';
    style.textContent = 'body{opacity:0!important;transition:opacity .2s}';
    document.head.appendChild(style);
  }

  if (saved) {
    try {
      const c = JSON.parse(saved);
      window._savedBranding = c;
    } catch(e) {}
  }
})();

// ============================================
// KONFIGURASI BRANDING SEKOLAH
// Edit file ini saja — otomatis berlaku di semua halaman
// ============================================

const SEKOLAH_CONFIG = {

  // ======================================
  // IDENTITAS SEKOLAH — WAJIB DIISI
  // ======================================
  nama:         'SMA Negeri 1 Contoh',       // Nama lengkap sekolah
  nama_singkat: 'SMAN 1 Contoh',             // Nama singkat (muncul di sidebar)
  tagline:      'Sistem Arsip Surat Digital', // Kalimat di bawah nama
  alamat:       'Jl. Pendidikan No. 1, Kota Contoh',
  tahun_berdiri: '1985',

  // ======================================
  // LOGO SEKOLAH
  // Cara pakai:
  //   Opsi A (Recommended): Upload logo ke folder frontend/assets/
  //              lalu isi: logo: '../assets/logo-sekolah.png'
  //   Opsi B: Pakai URL online: logo: 'https://...'
  //   Opsi C: Kosongkan ('') → tampil emoji 🏫 sebagai fallback
  // ======================================
  logo: '',  // contoh: '../assets/logo-sekolah.png'

  // ======================================
  // WARNA TEMA SEKOLAH
  // Ganti sesuai warna sekolah kamu
  // Format: kode HEX warna
  // ======================================
  warna: {
    utama:       '#1e3a8a',   // Biru tua — warna dominan sidebar
    utama_muda:  '#1e40af',   // Biru sedang — tombol, aksen
    aksen:       '#0e7490',   // Cyan — gradasi
    // Contoh warna lain:
    // Hijau:   utama: '#14532d', utama_muda: '#16a34a', aksen: '#059669'
    // Merah:   utama: '#7f1d1d', utama_muda: '#dc2626', aksen: '#b91c1c'
    // Ungu:    utama: '#3b0764', utama_muda: '#7c3aed', aksen: '#6d28d9'
    // Orange:  utama: '#7c2d12', utama_muda: '#ea580c', aksen: '#d97706'
  },

  // ======================================
  // FOOTER
  // ======================================
  tahun_sistem: new Date().getFullYear(),
  kredit: 'Arsip Surat Digital'

};

// ============================================
// FUNGSI TERAPKAN BRANDING
// Dipanggil otomatis saat halaman dibuka
// ============================================

// Apply branding langsung dari SEKOLAH_CONFIG ke DOM
const _applyBrandingToDOM = () => {
  // 1. Update CSS variable warna
  const root = document.documentElement;
  root.style.setProperty('--primary-dark',  SEKOLAH_CONFIG.warna.utama);
  root.style.setProperty('--primary',       SEKOLAH_CONFIG.warna.utama_muda);
  root.style.setProperty('--primary-light', SEKOLAH_CONFIG.warna.utama_muda);
  root.style.setProperty('--accent',        SEKOLAH_CONFIG.warna.aksen);

  // 2. Update gradient background login (via style tag dinamis)
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
    .nav-item.active {
      background: rgba(255,255,255,0.15) !important;
    }
    .stat-card .stat-value { color: ${SEKOLAH_CONFIG.warna.utama_muda}; }
  `;
  document.head.appendChild(style);

  // 3. Update elemen logo di semua halaman
  _updateLogo();

  // 4. Update nama sekolah di sidebar
  _updateNamaSidebar();

  // 5. Update title browser tab
  document.title = document.title.replace('Arsip Surat Sekolah', SEKOLAH_CONFIG.nama_singkat)
                                  .replace('Sekolah', SEKOLAH_CONFIG.nama_singkat);

  // 6. Update footer copyright
  const footerEls = document.querySelectorAll('.footer-copy, #footer-copy');
  footerEls.forEach(el => {
    el.textContent = `© ${SEKOLAH_CONFIG.tahun_sistem} ${SEKOLAH_CONFIG.nama} · ${SEKOLAH_CONFIG.kredit}`;
  });

  // 7. Update favicon
  _updateFavicon();

  // 8. Tampilkan body (sembunyikan FOUC shield)
  document.body.style.opacity = '1';
};

// Update logo di halaman manapun
const _updateLogo = () => {
  const logoContainers = document.querySelectorAll('.logo-icon, #logo-sekolah, .sidebar-logo-img');

  // Sidebar logo
  const sidebarLogoIcon = document.querySelector('.sidebar-logo .logo-icon');
  if (sidebarLogoIcon) {
    if (SEKOLAH_CONFIG.logo) {
      sidebarLogoIcon.innerHTML = `<img src="${SEKOLAH_CONFIG.logo}" alt="Logo" style="width:32px;height:32px;object-fit:contain;border-radius:6px">`;
    } else {
      sidebarLogoIcon.innerHTML = '🏫';
    }
  }

  // Logo di halaman login
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

  // Nama sekolah di login
  const loginNama = document.getElementById('login-nama-sekolah');
  if (loginNama) loginNama.textContent = SEKOLAH_CONFIG.nama;

  const loginTagline = document.getElementById('login-tagline');
  if (loginTagline) loginTagline.textContent = SEKOLAH_CONFIG.tagline;

  // Nama di navbar header
  const navNama = document.getElementById('nav-nama-sekolah');
  if (navNama) navNama.textContent = SEKOLAH_CONFIG.nama_singkat;
};

// Update favicon dengan logo sekolah
const _updateFavicon = () => {
  const favicon = document.getElementById('favicon');
  if (favicon && SEKOLAH_CONFIG.logo) {
    favicon.href = SEKOLAH_CONFIG.logo;
  }
};

// Update nama di sidebar
const _updateNamaSidebar = () => {
  const namaEl = document.querySelector('.logo-text h2');
  if (namaEl) namaEl.textContent = SEKOLAH_CONFIG.nama_singkat;

  const taglineEl = document.querySelector('.logo-text p');
  if (taglineEl) taglineEl.textContent = SEKOLAH_CONFIG.tagline;
};

// ============================================
// MAIN: terapkanBranding
// 1. Apply dari localStorage (instant)
// 2. Fetch dari API (async), apply setelah selesai
// ============================================
const terapkanBranding = () => {
  // Merge dari localStorage
  if (window._savedBranding) {
    const s = window._savedBranding;
    if (s.nama)         SEKOLAH_CONFIG.nama         = s.nama;
    if (s.nama_singkat) SEKOLAH_CONFIG.nama_singkat = s.nama_singkat;
    if (s.tagline)      SEKOLAH_CONFIG.tagline      = s.tagline;
    if (s.alamat)       SEKOLAH_CONFIG.alamat       = s.alamat;
    if (s.logo)         SEKOLAH_CONFIG.logo         = s.logo;
    if (s.warna) {
      SEKOLAH_CONFIG.warna.utama      = s.warna.utama      || SEKOLAH_CONFIG.warna.utama;
      SEKOLAH_CONFIG.warna.utama_muda = s.warna.utama_muda || SEKOLAH_CONFIG.warna.utama_muda;
      SEKOLAH_CONFIG.warna.aksen      = s.warna.aksen      || SEKOLAH_CONFIG.warna.aksen;
    }
  }
  _applyBrandingToDOM();

  // Fetch dari API jika localStorage kosong (login page, browser baru)
  if (!window._savedBranding && !window._fetchingBranding) {
    window._fetchingBranding = true;
    const _apiBase = (typeof API_URL !== 'undefined')
      ? API_URL
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:3000/api'
          : window.location.origin + '/api');
    fetch(`${_apiBase}/pengaturan?_t=${Date.now()}`)
      .then(r => r.json())
      .then(res => {
        const cfg = res?.data?.data || res?.data || null;
        if (cfg) {
          localStorage.setItem('sekolah_config', JSON.stringify(cfg));
          window._savedBranding = cfg;
          if (cfg.nama)         SEKOLAH_CONFIG.nama         = cfg.nama;
          if (cfg.nama_singkat) SEKOLAH_CONFIG.nama_singkat = cfg.nama_singkat;
          if (cfg.tagline)      SEKOLAH_CONFIG.tagline      = cfg.tagline;
          if (cfg.alamat)       SEKOLAH_CONFIG.alamat       = cfg.alamat;
          if (cfg.logo)         SEKOLAH_CONFIG.logo         = cfg.logo;
          if (cfg.warna) {
            SEKOLAH_CONFIG.warna.utama      = cfg.warna.utama      || SEKOLAH_CONFIG.warna.utama;
            SEKOLAH_CONFIG.warna.utama_muda = cfg.warna.utama_muda || SEKOLAH_CONFIG.warna.utama_muda;
            SEKOLAH_CONFIG.warna.aksen      = cfg.warna.aksen      || SEKOLAH_CONFIG.warna.aksen;
          }
          _applyBrandingToDOM();
        }
      })
      .catch(() => {})
      .finally(() => { window._fetchingBranding = false; });
  }
};

// Panggil saat DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', terapkanBranding);
} else {
  terapkanBranding();
}
