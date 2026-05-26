# 🏫 Arsip Surat Sekolah
Website arsip surat modern untuk sekolah. Deploy gratis di Vercel.

---

## ⚡ CARA SETUP CEPAT (4 Langkah)

### LANGKAH 1 — Setup Supabase
1. Buka **supabase.com** → buat akun → New Project
2. Buka **SQL Editor** → copy-paste isi `database.sql` → Run
3. Buka **Authentication > Users > Add User**:
   - Email: `admin@sekolah.sch.id`
   - Password: `Admin@123`
   - Centang Auto Confirm
4. Salin UUID user → jalankan SQL ini:
```sql
INSERT INTO public.users (id, nama, email, role, jabatan)
VALUES ('UUID_DARI_STEP_3', 'Administrator', 'admin@sekolah.sch.id', 'admin', 'Administrator');
```
5. Buka **Settings > API** → salin:
   - Project URL
   - anon public key
   - service_role key

### LANGKAH 2 — Isi Config Frontend
Buka file `setup.js`, isi:
```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';   // Project URL
const SUPABASE_ANON_KEY = 'eyJhbGci...';             // anon public key
```
Lalu jalankan:
```bash
node setup.js
```

### LANGKAH 3 — Isi Config Backend
```bash
cd backend
cp .env.example .env
```
Edit `.env`:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=string_acak_panjang_minimal_32_karakter
NODE_ENV=production
```

### LANGKAH 4 — Deploy ke Vercel
1. Push ke GitHub
2. Buka **vercel.com** → New Project → Import repo
3. Tambah Environment Variables (sama dengan isi .env)
4. Deploy!

---

## 🌐 ENVIRONMENT VARIABLES DI VERCEL
Wajib diisi di Vercel Dashboard > Settings > Environment Variables:

| Nama | Nilai |
|------|-------|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_KEY` | service_role key |
| `JWT_SECRET` | string acak panjang |
| `NODE_ENV` | `production` |

---

## 👤 Login Default
Email: `admin@sekolah.sch.id`
Password: `Admin@123`
**Ganti password setelah login pertama!**

---

## ❓ FAQ

**Q: Supabase pause sendiri?**
A: Aktifkan ping otomatis di cron-job.org setiap 3 hari ke URL `/api/health`

**Q: Upload PDF gagal?**
A: Pastikan bucket `surat-files` sudah dibuat (ada di database.sql)

**Q: Login berhasil tapi langsung keluar?**
A: JWT_SECRET belum diisi atau salah di Vercel
