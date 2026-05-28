const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Project\\arsip-surat-sekolah';
const pagesDir = path.join(baseDir, 'frontend', 'pages');
const jsDir = path.join(baseDir, 'frontend', 'js');

const sidebarHtml = `<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="logo-icon" id="sidebar-logo-icon">🏫</div>
      <div class="logo-text">
        <h2 id="sidebar-nama">Arsip Surat</h2>
        <p>Manajemen Surat Sekolah</p>
      </div>
    </div>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-label">Menu Utama</div>
    <a href="dashboard.html" class="nav-item" id="nav-dashboard"><span class="nav-icon">📊</span> Dashboard</a>
    <a href="surat.html?jenis=masuk" class="nav-item" id="nav-surat-masuk"><span class="nav-icon">📥</span> Surat Masuk</a>
    <a href="surat.html?jenis=keluar" class="nav-item" id="nav-surat-keluar"><span class="nav-icon">📤</span> Surat Keluar</a>
    <div class="nav-label" style="margin-top:12px;display:none" id="admin-section">Administrasi</div>
    <a href="users.html" class="nav-item" id="nav-users" style="display:none"><span class="nav-icon">👥</span> Data Pengguna</a>
    <a href="activity-log.html" class="nav-item" id="nav-log" style="display:none"><span class="nav-icon">📝</span> Log Aktivitas</a>
    <a href="pengaturan.html" class="nav-item" id="nav-pengaturan" style="display:none"><span class="nav-icon">⚙️</span> Pengaturan</a>
  </nav>
  <div class="sidebar-footer">
    <a href="profil.html" class="nav-item" id="nav-profil"><span class="nav-icon">👤</span> Profil Saya</a>
    <button type="button" onclick="logout()" class="nav-item" style="width:100%;border:none;background:none;cursor:pointer;color:rgba(255,255,255,0.7);text-align:left;">
      <span class="nav-icon">🚪</span> Keluar
    </button>
  </div>
</aside>`;

// 1. Fix sidebar in all HTML files
const htmlFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
htmlFiles.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace sidebar
  content = content.replace(/<aside class="sidebar" id="sidebar">[\s\S]*?<\/aside>/, sidebarHtml);
  
  // Add active class based on filename
  if (file === 'dashboard.html') {
    content = content.replace('id="nav-dashboard"', 'id="nav-dashboard" class="nav-item active"');
  } else if (file === 'users.html') {
    content = content.replace('id="nav-users"', 'id="nav-users" class="nav-item active"');
  } else if (file === 'pengaturan.html') {
    content = content.replace('id="nav-pengaturan"', 'id="nav-pengaturan" class="nav-item active"');
  } else if (file === 'profil.html') {
    content = content.replace('id="nav-profil"', 'id="nav-profil" class="nav-item active"');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
});

// 2. Fix pengaturan.html (add branding.js script)
const pengaturanPath = path.join(pagesDir, 'pengaturan.html');
let pengaturanContent = fs.readFileSync(pengaturanPath, 'utf8');
if (!pengaturanContent.includes('<script src="../js/branding.js"></script>')) {
  pengaturanContent = pengaturanContent.replace(
    '<script src="../js/api.js"></script>',
    '<script src="../js/branding.js"></script>\n<script src="../js/api.js"></script>'
  );
  fs.writeFileSync(pengaturanPath, pengaturanContent, 'utf8');
}

// 3. Fix branding.js (favicon & kredit)
const brandingPath = path.join(jsDir, 'branding.js');
let brandingContent = fs.readFileSync(brandingPath, 'utf8');
if (!brandingContent.includes('// 7. Update favicon')) {
  const oldFooter = `  // 6. Update footer copyright\n  const footerEls = document.querySelectorAll('.footer-copy, #footer-copy');\n  footerEls.forEach(el => {\n    el.textContent = \`© \${SEKOLAH_CONFIG.tahun_sistem} \${SEKOLAH_CONFIG.nama} · \${SEKOLAH_CONFIG.kredit}\`;\n  });`;
  const newFooter = `  // 6. Update footer copyright\n  const footerEls = document.querySelectorAll('.footer-copy, #footer-copy');\n  footerEls.forEach(el => {\n    el.textContent = \`© \${SEKOLAH_CONFIG.tahun_sistem} \${SEKOLAH_CONFIG.nama} · \${SEKOLAH_CONFIG.kredit}\`;\n  });\n\n  // 7. Update favicon\n  if (SEKOLAH_CONFIG.logo) {\n    let faviconLink = document.querySelector("link[rel~='icon']");\n    if (!faviconLink) {\n      faviconLink = document.createElement('link');\n      faviconLink.rel = 'icon';\n      document.head.appendChild(faviconLink);\n    }\n    faviconLink.href = SEKOLAH_CONFIG.logo;\n  }`;
  brandingContent = brandingContent.replace(oldFooter, newFooter);
  
  // also make sure kredit exists in SEKOLAH_CONFIG
  if (!brandingContent.includes("kredit: 'Arsip Surat Digital'")) {
    brandingContent = brandingContent.replace(
      "tahun_sistem: new Date().getFullYear(),",
      "tahun_sistem: new Date().getFullYear(),\n  kredit: 'Arsip Surat Digital'"
    );
  }
  fs.writeFileSync(brandingPath, brandingContent, 'utf8');
}

// 4. Fix surat.html (loadNotifikasi & Tailwind classes for Toast)
const suratPath = path.join(pagesDir, 'surat.html');
let suratContent = fs.readFileSync(suratPath, 'utf8');
if (!suratContent.includes('loadNotifikasi();\n    } else {')) {
  suratContent = suratContent.replace(
    'loadSurat(currentPage);\n    } else {',
    'loadSurat(currentPage);\n      loadNotifikasi();\n    } else {'
  );
  // Add hidden div for tailwind JIT (toast colors)
  if (!suratContent.includes('class="hidden bg-green-500 bg-red-500 bg-yellow-500 bg-blue-500"')) {
    suratContent = suratContent.replace(
      '<div id="toast-container"',
      '<div class="hidden bg-green-500 bg-red-500 bg-yellow-500 bg-blue-500"></div>\n<div id="toast-container"'
    );
  }
  fs.writeFileSync(suratPath, suratContent, 'utf8');
}

// 5. Fix surat-detail.html (PDF)
const suratDetailPath = path.join(pagesDir, 'surat-detail.html');
let sdContent = fs.readFileSync(suratDetailPath, 'utf8');
if (sdContent.includes("document.getElementById('pdf-preview').src = surat.file_path;")) {
  sdContent = sdContent.replace(
    "document.getElementById('pdf-preview').src = surat.file_path;",
    "const pdfUrl = `${window.SUPABASE_URL || 'https://cjgqmdymyybuldbypryf.supabase.co'}/storage/v1/object/public/surat-files/${surat.file_path}`;\n      document.getElementById('pdf-preview').src = pdfUrl;"
  );
  sdContent = sdContent.replace(
    "document.getElementById('btn-download').href = surat.file_path;",
    "document.getElementById('btn-download').href = pdfUrl;"
  );
  fs.writeFileSync(suratDetailPath, sdContent, 'utf8');
}

console.log('Fixes applied successfully!');
