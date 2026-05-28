const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: 'Email atau password salah.' });

    const { data: userData, error: userError } = await supabase
      .from('users').select('*').eq('email', email).single();
    if (userError || !userData)
      return res.status(401).json({ error: 'Data user tidak ditemukan.' });

    const token = jwt.sign(
      { id: userData.id, email: userData.email, nama: userData.nama, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Catat activity log
    await supabase.from('activity_log').insert({
      user_id: userData.id, user_nama: userData.nama,
      aksi: 'LOGIN', target_tabel: 'users',
      deskripsi: `${userData.nama} login ke sistem`
    });

    res.json({
      success: true, token,
      user: { id: userData.id, email: userData.email, nama: userData.nama, role: userData.role, nip: userData.nip }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  await supabase.from('activity_log').insert({
    user_id: req.user.id, user_nama: req.user.nama,
    aksi: 'LOGOUT', deskripsi: `${req.user.nama} logout`
  }).catch(() => {});
  res.json({ success: true, message: 'Logout berhasil.' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  res.json({ success: true, user: data || req.user });
});

// PUT /api/auth/ganti-password
router.put('/ganti-password', authMiddleware, async (req, res) => {
  const { password_lama, password_baru } = req.body;
  if (!password_lama || !password_baru)
    return res.status(400).json({ error: 'Password lama dan baru wajib diisi.' });
  if (password_baru.length < 6)
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });

  try {
    // Verifikasi password lama dulu
    const { data: user } = await supabase.from('users').select('email').eq('id', req.user.id).single();
    const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: password_lama });
    if (verifyErr) return res.status(401).json({ error: 'Password lama salah.' });

    // Update password
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password: password_baru });
    if (error) throw error;

    await supabase.from('activity_log').insert({
      user_id: req.user.id, user_nama: req.user.nama,
      aksi: 'GANTI_PASSWORD', deskripsi: 'User mengganti password'
    });

    res.json({ success: true, message: 'Password berhasil diganti.' });
  } catch (err) {
    console.error('Ganti password error:', err);
    res.status(500).json({ error: 'Gagal mengganti password.' });
  }
});

// PUT /api/auth/profil - update profil sendiri
router.put('/profil', authMiddleware, async (req, res) => {
  const { nama, nip, jabatan } = req.body;
  if (!nama) return res.status(400).json({ error: 'Nama wajib diisi.' });

  try {
    const { data, error } = await supabase.from('users')
      .update({ nama, nip, jabatan }).eq('id', req.user.id).select().single();
    if (error) throw error;
    res.json({ success: true, data, message: 'Profil berhasil diupdate.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal update profil.' });
  }
});

module.exports = router;
