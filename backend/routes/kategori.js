const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/kategori - ambil semua kategori
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kategori_surat')
      .select('*')
      .order('nama');

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('GET kategori error:', err);
    res.status(500).json({ error: 'Gagal mengambil data kategori.' });
  }
});

// POST /api/kategori - tambah kategori baru
router.post('/', async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
    }

    const namaLower = nama.trim().toLowerCase();

    // Cek duplikat
    const { data: existing } = await supabase
      .from('kategori_surat')
      .select('id')
      .ilike('nama', namaLower)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Kategori sudah ada.' });
    }

    const { data, error } = await supabase
      .from('kategori_surat')
      .insert([{ nama: nama.trim() }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data, message: 'Kategori berhasil ditambahkan.' });
  } catch (err) {
    console.error('POST kategori error:', err);
    res.status(500).json({ error: 'Gagal menambahkan kategori.' });
  }
});

// DELETE /api/kategori/:id - hapus kategori
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('kategori_surat')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    console.error('DELETE kategori error:', err);
    res.status(500).json({ error: 'Gagal menghapus kategori.' });
  }
});

module.exports = router;
