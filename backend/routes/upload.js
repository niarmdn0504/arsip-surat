const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

router.use(authMiddleware);

// Konfigurasi multer - simpan di memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF yang diizinkan!'), false);
    }
  }
});

// POST /api/upload/pdf - upload PDF ke Supabase Storage
router.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File PDF wajib dipilih.' });
    }

    const timestamp = Date.now();
    const originalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;
    const filePath = `surat/${new Date().getFullYear()}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('surat-files')
      .upload(filePath, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    // Buat signed URL untuk preview
    const { data: signedUrl } = await supabase.storage
      .from('surat-files')
      .createSignedUrl(filePath, 3600);

    res.json({
      success: true,
      file_path: filePath,
      file_url: signedUrl?.signedUrl,
      message: 'File berhasil diupload.'
    });
  } catch (err) {
    console.error('Upload error:', err);
    if (err.message === 'Hanya file PDF yang diizinkan!') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Gagal mengupload file.' });
  }
});

// GET /api/upload/preview/:filePath - dapatkan URL preview
router.get('/preview/*', async (req, res) => {
  try {
    const filePath = req.params[0];

    const { data, error } = await supabase.storage
      .from('surat-files')
      .createSignedUrl(filePath, 3600);

    if (error) throw error;

    res.json({ success: true, url: data.signedUrl });
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: 'Gagal mendapatkan URL preview.' });
  }
});

// DELETE /api/upload/delete - hapus file dari storage
router.delete('/delete', async (req, res) => {
  try {
    const { file_path } = req.body;
    if (!file_path) return res.status(400).json({ error: 'file_path wajib diisi.' });

    const { error } = await supabase.storage
      .from('surat-files')
      .remove([file_path]);

    if (error) throw error;

    res.json({ success: true, message: 'File berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus file.' });
  }
});

// POST /api/upload/pdf-base64 - upload via Base64 to bypass Multer on Vercel
router.post('/pdf-base64', async (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData) return res.status(400).json({ error: 'File data kosong.' });
    
    // fileData format: "data:application/pdf;base64,JVBER..."
    const base64String = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer = Buffer.from(base64String, 'base64');
    
    const timestamp = Date.now();
    const originalName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeName = `${timestamp}_${originalName}`;
    const filePath = `surat/${new Date().getFullYear()}/${safeName}`;

    const { data, error } = await supabase.storage
      .from('surat-files')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    res.json({ success: true, file_path: filePath, message: 'File berhasil diupload.' });
  } catch (err) {
    console.error('Base64 upload error:', err);
    res.status(500).json({ error: 'Gagal mengupload file PDF.' });
  }
});

module.exports = router;
