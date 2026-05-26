const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/notifikasi - ambil notifikasi milik user ini
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifikasi')
      .select('*, surat(nomor_surat, perihal)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;

    const belumDibaca = data.filter(n => !n.dibaca).length;
    res.json({ success: true, data, belumDibaca });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil notifikasi.' });
  }
});

// PUT /api/notifikasi/baca-semua - tandai semua sudah dibaca
router.put('/baca-semua', async (req, res) => {
  try {
    const { error } = await supabase.from('notifikasi')
      .update({ dibaca: true })
      .eq('user_id', req.user.id)
      .eq('dibaca', false);
    if (error) throw error;
    res.json({ success: true, message: 'Semua notifikasi sudah dibaca.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal update notifikasi.' });
  }
});

// PUT /api/notifikasi/:id/baca
router.put('/:id/baca', async (req, res) => {
  try {
    await supabase.from('notifikasi')
      .update({ dibaca: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal update.' });
  }
});

// DELETE /api/notifikasi/hapus-semua
router.delete('/hapus-semua', async (req, res) => {
  try {
    await supabase.from('notifikasi').delete().eq('user_id', req.user.id);
    res.json({ success: true, message: 'Semua notifikasi dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus notifikasi.' });
  }
});

module.exports = router;
