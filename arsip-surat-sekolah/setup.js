/**
 * SETUP SCRIPT - Jalankan SEKALI saat pertama setup
 * Mengisi otomatis SUPABASE_URL dan SUPABASE_ANON_KEY ke semua file HTML
 *
 * Cara pakai:
 * 1. Isi nilai di bawah ini
 * 2. Jalankan: node setup.js
 * 3. Semua file HTML otomatis terupdate
 * 4. Lanjut deploy ke Vercel!
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// WAJIB DIISI - ambil dari Supabase > Settings > API
// ==========================================
const SUPABASE_URL     = 'https://cjgqmdymyybuldbypryf.supabase.co';   // <-- ganti ini
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZ3FtZHlteXlidWxkYnlwcnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTE2NTAsImV4cCI6MjA5NTM2NzY1MH0.YKMIf1LcCJxGQzEc3RexMqybtB-Ma-8XCpbv9NP3-VY';         // <-- ganti ini
// ==========================================

if (SUPABASE_URL.includes('xxxxxxxxxx') || SUPABASE_ANON_KEY.includes('eyJhbGciOiJIUzI1NiIs...')) {
  console.error('\n❌ ERROR: Isi dulu SUPABASE_URL dan SUPABASE_ANON_KEY di file setup.js!\n');
  process.exit(1);
}

const pagesDir = path.join(__dirname, 'frontend/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let updated = 0;
files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('SUPABASE_URL_KAMU') || content.includes('SUPABASE_ANON_KEY_KAMU')) {
    content = content
      .replace(/SUPABASE_URL_KAMU/g, SUPABASE_URL)
      .replace(/SUPABASE_ANON_KEY_KAMU/g, SUPABASE_ANON_KEY);
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${file}`);
    updated++;
  }
});

console.log(updated ? `\n🎉 ${updated} file berhasil diupdate! Siap deploy ke Vercel.\n` : '\n⚠️  Sudah pernah dijalankan sebelumnya.\n');
