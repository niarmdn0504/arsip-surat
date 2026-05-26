// ============================================
// LAYOUT RENDERER - Sidebar & Navbar
// ============================================

const renderLayout = (activePage = 'dashboard') => {
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/pages/dashboard.html' },
    { id: 'surat', label: 'Semua Surat', icon: '📋', href: '/pages/surat.html' },
    { id: 'surat-masuk', label: 'Surat Masuk', icon: '📥', href: '/pages/surat.html?jenis=masuk' },
    { id: 'surat-keluar', label: 'Surat Keluar', icon: '📤', href: '/pages/surat.html?jenis=keluar' },
  ];

  const adminItems = isAdmin ? [
    { id: 'users', label: 'Data Pengguna', icon: '👥', href: '/pages/users.html' },
  ] : [];

  const pageTitles = {
    dashboard: { title: 'Dashboard', sub: 'Ringkasan Arsip Surat' },
    surat: { title: 'Arsip Surat', sub: 'Kelola semua surat' },
    'surat-masuk': { title: 'Surat Masuk', sub: 'Daftar surat masuk' },
    'surat-keluar': { title: 'Surat Keluar', sub: 'Daftar surat keluar' },
    users: { title: 'Data Pengguna', sub: 'Kelola akun guru dan admin' },
  };

  const pageInfo = pageTitles[activePage] || { title: 'Arsip Surat', sub: '' };

  const navHtml = [...navItems, ...adminItems].map(item => `
    <a href="${item.href}" class="nav-item ${activePage === item.id ? 'active' : ''}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="app-layout">
      <!-- Sidebar Overlay Mobile -->
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>

      <!-- SIDEBAR -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="flex items-center gap-3">
            <div class="logo-icon">🏫</div>
            <div class="logo-text">
              <h2>Arsip Surat</h2>
              <p>Sistem Manajemen Surat</p>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-label">Menu Utama</div>
          ${navHtml}
          ${isAdmin ? '<div class="nav-label" style="margin-top:12px">Administrasi</div>' : ''}
          ${adminItems.map(item => `
            <a href="${item.href}" class="nav-item ${activePage === item.id ? 'active' : ''}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <button onclick="logout()" class="nav-item w-full text-left" style="color: rgba(255,255,255,0.5)">
            <span class="nav-icon">🚪</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <!-- NAVBAR -->
      <header class="navbar" id="navbar">
        <button class="sidebar-toggle" id="sidebar-toggle" onclick="toggleSidebar()">☰</button>
        <div class="flex-1">
          <div class="navbar-title">${pageInfo.title}</div>
          <div class="navbar-sub">${pageInfo.sub}</div>
        </div>
        <div class="user-chip">
          <div class="user-avatar" id="user-avatar">A</div>
          <div class="hidden sm:block">
            <div style="font-size:13px;font-weight:600;color:#0f172a" id="user-name">Loading...</div>
            <div style="font-size:11px;color:#64748b" id="user-role">-</div>
          </div>
        </div>
      </header>
  `);

  // Wrap existing content
  const existingContent = document.querySelector('.page-content-wrapper');
  if (!existingContent) {
    const main = document.createElement('main');
    main.className = 'main-content';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'page-content animate-in';
    // Move page content into main
    while (document.body.children.length > 0) {
      const child = document.body.lastChild;
      if (child.id !== 'sidebar' && child.className !== 'navbar') {
        contentDiv.insertBefore(child, contentDiv.firstChild);
      }
    }
  }

  setUserInfo();
};

// Sidebar toggle functions
const toggleSidebar = () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
};
const closeSidebar = () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
};
