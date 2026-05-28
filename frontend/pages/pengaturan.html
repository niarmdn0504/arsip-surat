const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/pengaturan — ambil pengaturan sekolah (semua user bisa akses)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pengaturan_sekolah')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ success: true, data: data || null });
  } catch (err) {
    console.error('GET pengaturan error:', err);
    res.status(500).json({ error: 'Gagal mengambil pengaturan.' });
  }
});

// POST /api/pengaturan — simpan pengaturan (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nama, nama_singkat, tagline, alamat, logo, warna, _preset } = req.body;

    if (!nama || !nama_singkat) {
      return res.status(400).json({ error: 'Nama sekolah wajib diisi.' });
    }

    const payload = {
      id: 1, // selalu satu row
      nama,
      nama_singkat,
      tagline: tagline || '',
      alamat: alamat || '',
      logo: logo || null,
      warna: warna || null,
      _preset: _preset || 'biru',
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };

    const { data, error } = await supabase
      .from('pengaturan_sekolah')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    // Log aktivitas
    await supabase.from('activity_log').insert({
      user_id: req.user.id,
      user_nama: req.user.nama,
      aksi: 'UPDATE_PENGATURAN',
      target_tabel: 'pengaturan_sekolah',
      deskripsi: `${req.user.nama} mengupdate pengaturan sekolah`
    }).catch(() => {});

    res.json({ success: true, data, message: 'Pengaturan berhasil disimpan.' });
  } catch (err) {
    console.error('POST pengaturan error:', err);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan.' });
  }
});

// DELETE /api/pengaturan/reset — reset ke default (admin only)
router.delete('/reset', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await supabase
      .from('pengaturan_sekolah')
      .delete()
      .eq('id', 1);

    res.json({ success: true, message: 'Pengaturan direset ke default.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal reset pengaturan.' });
  }
});

module.exports = router;
