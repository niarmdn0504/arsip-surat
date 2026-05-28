const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/users - semua user (admin only)
router.get('/', adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, email, role, nip, jabatan, created_at')
      .order('nama');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user.' });
  }
});

// GET /api/users/:id - detail user
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, email, role, nip, jabatan, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'User tidak ditemukan.' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user.' });
  }
});

// POST /api/users - tambah user baru (admin only)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { nama, email, password, role, nip, jabatan } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }

    // Buat user di Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // Simpan ke tabel users
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: authUser.user.id,
        nama,
        email,
        role: role || 'guru',
        nip: nip || '',
        jabatan: jabatan || ''
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data, message: 'User berhasil ditambahkan.' });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: err.message || 'Gagal menambahkan user.' });
  }
});

// PUT /api/users/:id - edit user
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { nama, role, nip, jabatan } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ nama, role, nip, jabatan })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data, message: 'User berhasil diupdate.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate user.' });
  }
});

// DELETE /api/users/:id - hapus user (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    // Hapus dari auth
    await supabase.auth.admin.deleteUser(req.params.id);

    // Hapus dari tabel
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus user.' });
  }
});

module.exports = router;
