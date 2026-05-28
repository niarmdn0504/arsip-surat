const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Semua route surat butuh login
router.use(authMiddleware);

// GET /api/surat - ambil semua surat dengan filter & search
router.get('/', async (req, res) => {
  try {
    // Validasi & sanitasi input
    const jenis = ['masuk','keluar'].includes(req.query.jenis) ? req.query.jenis : null;
    const kategori = ['umum','undangan','keputusan','edaran','pemberitahuan','permohonan'].includes(req.query.kategori) ? req.query.kategori : null;
    const tahun = req.query.tahun ? parseInt(req.query.tahun) : null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    // Sanitasi search: hapus karakter regex berbahaya, batasi 100 char
    const rawSearch = (req.query.search || '').toString();
    const search = rawSearch.replace(/[%_\\]/g, '').trim().substring(0, 100);

    let query = supabase
      .from('surat')
      .select('*, users(nama)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jenis) query = query.eq('jenis', jenis);
    if (kategori) query = query.eq('kategori', kategori);
    if (tahun && !isNaN(tahun)) query = query.eq('tahun', tahun);
    if (search) {
      query = query.or(`nomor_surat.ilike.%${search}%,perihal.ilike.%${search}%,pengirim.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Get surat error:', err);
    res.status(500).json({ error: 'Gagal mengambil data surat.' });
  }
});

// GET /api/surat/dashboard - HARUS sebelum /:id agar tidak konflik
router.get('/dashboard', async (req, res) => {
  try {
    const tahunIni = new Date().getFullYear();

    // Paralel query = lebih cepat
    const [
      { count: totalMasukCount },
      { count: totalKeluarCount },
      { count: totalSurat },
      { data: suratTerbaru },
      { data: statsData }
    ] = await Promise.all([
      supabase.from('surat').select('*', { count: 'exact', head: true }).eq('jenis', 'masuk'),
      supabase.from('surat').select('*', { count: 'exact', head: true }).eq('jenis', 'keluar'),
      supabase.from('surat').select('*', { count: 'exact', head: true }),
      supabase.from('surat').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('surat')
        .select('jenis, tanggal_surat')
        .gte('tanggal_surat', `${tahunIni}-01-01`)
        .lte('tanggal_surat', `${tahunIni}-12-31`)
    ]);

    const stats = Array(12).fill(null).map((_, i) => ({ bulan: i + 1, masuk: 0, keluar: 0 }));
    if (statsData) {
      statsData.forEach(s => {
        const bulan = new Date(s.tanggal_surat).getMonth();
        if (s.jenis === 'masuk') stats[bulan].masuk++;
        else stats[bulan].keluar++;
      });
    }

    res.json({
      success: true,
      data: {
        totalSurat: totalSurat || 0,
        totalMasuk: totalMasukCount || 0,
        totalKeluar: totalKeluarCount || 0,
        suratTerbaru: suratTerbaru || [],
        statistikBulanan: stats
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Gagal mengambil data dashboard.' });
  }
});

// GET /api/surat/:id - detail surat
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('surat')
      .select('*, users(nama, email)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Surat tidak ditemukan.' });
    }

    // Generate signed URL untuk file PDF jika ada
    if (data.file_path) {
      const { data: signedUrl } = await supabase.storage
        .from('surat-files')
        .createSignedUrl(data.file_path, 3600);
      data.file_url = signedUrl?.signedUrl || null;
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Get detail surat error:', err);
    res.status(500).json({ error: 'Gagal mengambil detail surat.' });
  }
});

// POST /api/surat - tambah surat baru
router.post('/', async (req, res) => {
  try {
    const {
      nomor_surat, jenis, kategori, perihal,
      pengirim, penerima, tanggal_surat, tanggal_terima,
      keterangan, file_path
    } = req.body;

    if (!nomor_surat || !jenis || !perihal || !tanggal_surat) {
      return res.status(400).json({ error: 'Nomor surat, jenis, perihal, dan tanggal wajib diisi.' });
    }

    // Validasi jenis
    if (!['masuk','keluar'].includes(jenis)) {
      return res.status(400).json({ error: 'Jenis surat tidak valid.' });
    }

    const { data, error } = await supabase
      .from('surat')
      .insert([{
        nomor_surat: nomor_surat.trim(),
        jenis,
        kategori: kategori || 'umum',
        perihal: perihal.trim(),
        pengirim: (pengirim || '').trim() || '-',
        penerima: (penerima || '').trim() || '-',
        tanggal_surat,
        tanggal_terima: tanggal_terima || null,
        keterangan: (keterangan || '').trim(),
        file_path: file_path || null,
        tahun: new Date(tanggal_surat).getFullYear(),
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;

    // Catat activity log
    await supabase.from('activity_log').insert({
      user_id: req.user.id, user_nama: req.user.nama,
      aksi: 'TAMBAH_SURAT', target_tabel: 'surat', target_id: data.id,
      deskripsi: `Tambah surat: ${data.nomor_surat} - ${data.perihal}`
    }).catch(() => {});

    // Kirim notifikasi ke semua user kecuali pembuat
    if (jenis === 'keluar') {
      const { data: userList } = await supabase.from('users').select('id');
      const notifs = (userList || []).filter(u => u.id !== req.user.id).map(u => ({
        user_id: u.id, surat_id: data.id, tipe: 'surat_keluar',
        judul: 'Surat Keluar Baru',
        pesan: `Surat "${data.perihal}" ke ${data.penerima}`
      }));
      if (notifs.length) supabase.from('notifikasi').insert(notifs).catch(() => {});
    }
    res.status(201).json({ success: true, data, message: 'Surat berhasil ditambahkan.' });
  } catch (err) {
    console.error('Create surat error:', err);
    res.status(500).json({ error: 'Gagal menambahkan surat.' });
  }
});

// PUT /api/surat/:id - edit surat
router.put('/:id', async (req, res) => {
  try {
    const {
      nomor_surat, jenis, kategori, perihal,
      pengirim, penerima, tanggal_surat, tanggal_terima,
      keterangan, file_path
    } = req.body;

    if (jenis && !['masuk','keluar'].includes(jenis)) {
      return res.status(400).json({ error: 'Jenis surat tidak valid.' });
    }

    const updateData = {};
    if (nomor_surat) updateData.nomor_surat = nomor_surat.trim();
    if (jenis) updateData.jenis = jenis;
    if (kategori) updateData.kategori = kategori;
    if (perihal) updateData.perihal = perihal.trim();
    if (pengirim !== undefined) updateData.pengirim = pengirim.trim();
    if (penerima !== undefined) updateData.penerima = penerima.trim();
    if (tanggal_surat) {
      updateData.tanggal_surat = tanggal_surat;
      updateData.tahun = new Date(tanggal_surat).getFullYear();
    }
    if (tanggal_terima !== undefined) updateData.tanggal_terima = tanggal_terima || null;
    if (keterangan !== undefined) updateData.keterangan = keterangan.trim();
    if (file_path !== undefined) updateData.file_path = file_path || null;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('surat')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_log').insert({
      user_id: req.user.id, user_nama: req.user.nama,
      aksi: 'EDIT_SURAT', target_tabel: 'surat', target_id: data.id,
      deskripsi: `Edit surat: ${data.nomor_surat}`
    }).catch(() => {});
    res.json({ success: true, data, message: 'Surat berhasil diupdate.' });
  } catch (err) {
    console.error('Update surat error:', err);
    res.status(500).json({ error: 'Gagal mengupdate surat.' });
  }
});

// DELETE /api/surat/:id - hapus surat (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { data: surat } = await supabase
      .from('surat')
      .select('file_path')
      .eq('id', req.params.id)
      .single();

    if (surat?.file_path) {
      await supabase.storage.from('surat-files').remove([surat.file_path]);
    }

    const { error } = await supabase.from('surat').delete().eq('id', req.params.id);
    if (error) throw error;

    await supabase.from('activity_log').insert({
      user_id: req.user.id, user_nama: req.user.nama,
      aksi: 'HAPUS_SURAT', target_tabel: 'surat', target_id: req.params.id,
      deskripsi: `Hapus surat ID: ${req.params.id}`
    }).catch(() => {});
    res.json({ success: true, message: 'Surat berhasil dihapus.' });
  } catch (err) {
    console.error('Delete surat error:', err);
    res.status(500).json({ error: 'Gagal menghapus surat.' });
  }
});

module.exports = router;
