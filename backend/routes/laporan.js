const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/laporan/export-csv?tahun=2024&jenis=masuk
router.get('/export-csv', async (req, res) => {
  try {
    const { tahun, jenis, kategori } = req.query;

    let query = supabase.from('surat')
      .select('nomor_surat, jenis, kategori, perihal, pengirim, penerima, tanggal_surat, tanggal_terima, keterangan, created_at')
      .order('tanggal_surat', { ascending: false });

    if (tahun) query = query.eq('tahun', parseInt(tahun));
    if (jenis) query = query.eq('jenis', jenis);
    if (kategori) query = query.eq('kategori', kategori);

    const { data, error } = await query;
    if (error) throw error;

    // Buat CSV manual
    const headers = ['No','Nomor Surat','Jenis','Kategori','Perihal','Pengirim','Penerima','Tanggal Surat','Tanggal Terima','Keterangan'];
    const rows = data.map((s, i) => [
      i + 1,
      `"${s.nomor_surat || ''}"`,
      s.jenis,
      s.kategori || '',
      `"${(s.perihal || '').replace(/"/g, '""')}"`,
      `"${s.pengirim || ''}"`,
      `"${s.penerima || ''}"`,
      s.tanggal_surat || '',
      s.tanggal_terima || '',
      `"${(s.keterangan || '').replace(/"/g, '""')}"`
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `arsip-surat${tahun ? '-' + tahun : ''}${jenis ? '-' + jenis : ''}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM untuk Excel bisa baca UTF-8
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Gagal export data.' });
  }
});

// GET /api/laporan/rekap - rekap statistik lengkap
router.get('/rekap', async (req, res) => {
  try {
    const tahun = req.query.tahun || new Date().getFullYear();

    const [
      { count: totalMasuk },
      { count: totalKeluar },
      { data: perKategori },
      { data: perBulan },
      { data: log }
    ] = await Promise.all([
      supabase.from('surat').select('*', { count: 'exact', head: true }).eq('jenis', 'masuk').eq('tahun', tahun),
      supabase.from('surat').select('*', { count: 'exact', head: true }).eq('jenis', 'keluar').eq('tahun', tahun),
      supabase.from('surat').select('kategori').eq('tahun', tahun),
      supabase.from('surat').select('jenis, tanggal_surat').eq('tahun', tahun),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50)
    ]);

    // Hitung per kategori
    const kategoriMap = {};
    (perKategori || []).forEach(s => {
      kategoriMap[s.kategori] = (kategoriMap[s.kategori] || 0) + 1;
    });

    // Hitung per bulan
    const bulanData = Array(12).fill(null).map((_, i) => ({ bulan: i + 1, masuk: 0, keluar: 0 }));
    (perBulan || []).forEach(s => {
      const b = new Date(s.tanggal_surat).getMonth();
      if (s.jenis === 'masuk') bulanData[b].masuk++;
      else bulanData[b].keluar++;
    });

    res.json({
      success: true,
      data: {
        tahun,
        totalMasuk: totalMasuk || 0,
        totalKeluar: totalKeluar || 0,
        total: (totalMasuk || 0) + (totalKeluar || 0),
        perKategori: kategoriMap,
        perBulan: bulanData,
        activityLog: log || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil rekap.' });
  }
});

// GET /api/laporan/activity-log
router.get('/activity-log', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil log.' });
  }
});

module.exports = router;
