-- ============================================
-- ARSIP SURAT SEKOLAH - SQL SETUP SUPABASE
-- Versi Final - Jalankan di Supabase SQL Editor
-- ============================================

-- 1. TABEL USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'guru' CHECK (role IN ('admin', 'guru')),
    nip VARCHAR(30),
    jabatan VARCHAR(100),
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL SURAT
CREATE TABLE IF NOT EXISTS public.surat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_surat VARCHAR(100) NOT NULL,
    jenis VARCHAR(10) NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
    kategori VARCHAR(50) DEFAULT 'umum',
    perihal TEXT NOT NULL,
    pengirim VARCHAR(150),
    penerima VARCHAR(150),
    tanggal_surat DATE NOT NULL,
    tanggal_terima DATE,
    tahun INTEGER,
    keterangan TEXT,
    file_path TEXT,
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'arsip', 'disposisi')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL ACTIVITY LOG (baru)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_nama VARCHAR(100),
    aksi VARCHAR(50) NOT NULL,
    target_tabel VARCHAR(50),
    target_id UUID,
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL NOTIFIKASI (baru)
CREATE TABLE IF NOT EXISTS public.notifikasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    judul VARCHAR(150) NOT NULL,
    pesan TEXT,
    tipe VARCHAR(30) DEFAULT 'info',
    dibaca BOOLEAN DEFAULT FALSE,
    surat_id UUID REFERENCES public.surat(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX untuk performa
-- ============================================
CREATE INDEX IF NOT EXISTS idx_surat_jenis ON public.surat(jenis);
CREATE INDEX IF NOT EXISTS idx_surat_tahun ON public.surat(tahun);
CREATE INDEX IF NOT EXISTS idx_surat_kategori ON public.surat(kategori);
CREATE INDEX IF NOT EXISTS idx_surat_tanggal ON public.surat(tanggal_surat DESC);
CREATE INDEX IF NOT EXISTS idx_surat_nomor ON public.surat(nomor_surat);
CREATE INDEX IF NOT EXISTS idx_surat_status ON public.surat(status);
CREATE INDEX IF NOT EXISTS idx_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_log_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifikasi(user_id, dibaca);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users view own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins all users" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Surat policies
CREATE POLICY "Auth read surat" ON public.surat FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert surat" ON public.surat FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update surat" ON public.surat FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete surat" ON public.surat FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Activity log policies
CREATE POLICY "Auth read log" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Notifikasi policies
CREATE POLICY "User own notif" ON public.notifikasi FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- STORAGE - Bucket PDF
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('surat-files', 'surat-files', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'surat-files');
CREATE POLICY "Auth view" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'surat-files');
CREATE POLICY "Auth delete storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'surat-files');

-- ============================================
-- FUNGSI OTOMATIS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_surat_updated BEFORE UPDATE ON public.surat FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fungsi otomatis kirim notifikasi ke semua user saat surat masuk baru
CREATE OR REPLACE FUNCTION notify_surat_masuk()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.jenis = 'masuk' THEN
        INSERT INTO public.notifikasi (user_id, judul, pesan, tipe, surat_id)
        SELECT id,
            '📥 Surat Masuk Baru',
            'Surat dari ' || NEW.pengirim || ' - ' || NEW.perihal,
            'surat_masuk',
            NEW.id
        FROM public.users
        WHERE id != NEW.created_by;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_surat_masuk
    AFTER INSERT ON public.surat
    FOR EACH ROW EXECUTE FUNCTION notify_surat_masuk();

-- ============================================
-- SETUP ADMIN PERTAMA
-- ============================================
-- Langkah:
-- 1. Buat user di Authentication > Users > Add User
--    Email: admin@sekolah.sch.id | Password: Admin@123
-- 2. Salin UUID-nya, ganti di INSERT bawah ini, lalu Run

-- INSERT INTO public.users (id, nama, email, role, jabatan)
-- VALUES ('UUID_DISINI', 'Administrator', 'admin@sekolah.sch.id', 'admin', 'Administrator Sistem');

-- Cek hasil
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
