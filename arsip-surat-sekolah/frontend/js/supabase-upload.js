// ============================================
// SUPABASE DIRECT UPLOAD
// Upload PDF langsung dari browser ke Supabase
// Tidak lewat backend sama sekali → cocok untuk Vercel
// ============================================

// Ambil config dari meta tag di HTML
// (Supaya tidak hardcode di JS yang bisa dilihat semua orang)
const getSupabaseConfig = () => {
  return {
    url: document.querySelector('meta[name="sb-url"]')?.content,
    anonKey: document.querySelector('meta[name="sb-key"]')?.content
  };
};

// Upload PDF langsung ke Supabase Storage dari browser
const uploadPdfDirect = async (file) => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    console.error('Supabase config tidak ditemukan di meta tag');
    return { success: false, error: 'Konfigurasi upload tidak ditemukan.' };
  }

  // Validasi file
  if (!file) return { success: false, error: 'File tidak ditemukan.' };
  if (file.type !== 'application/pdf') return { success: false, error: 'Hanya file PDF yang diizinkan.' };
  if (file.size > 10 * 1024 * 1024) return { success: false, error: 'File terlalu besar. Maksimal 10MB.' };

  // Buat nama file unik
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const tahun = new Date().getFullYear();
  const filePath = `surat/${tahun}/${timestamp}_${safeName}`;

  try {
    // Upload langsung ke Supabase Storage pakai fetch
    const uploadRes = await fetch(
      `${url}/storage/v1/object/surat-files/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/pdf',
          'x-upsert': 'false'
        },
        body: file
      }
    );

    if (!uploadRes.ok) {
      const errData = await uploadRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Upload gagal');
    }

    // Buat signed URL untuk preview (1 jam)
    const signedRes = await fetch(
      `${url}/storage/v1/object/sign/surat-files/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expiresIn: 3600 })
      }
    );

    let signedUrl = null;
    if (signedRes.ok) {
      const signedData = await signedRes.json();
      signedUrl = `${url}/storage/v1${signedData.signedURL}`;
    }

    return {
      success: true,
      file_path: filePath,
      file_url: signedUrl,
      file_name: file.name
    };

  } catch (err) {
    console.error('Upload error:', err);
    return { success: false, error: err.message || 'Gagal mengupload file.' };
  }
};

// Hapus file dari Supabase Storage langsung dari browser
const deletePdfDirect = async (filePath) => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !filePath) return;

  try {
    await fetch(`${url}/storage/v1/object/surat-files/${filePath}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${anonKey}` }
    });
  } catch (err) {
    console.error('Delete file error:', err);
  }
};

// Buat signed URL baru untuk preview (dipanggil saat preview PDF)
const getSignedUrl = async (filePath) => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !filePath) return null;

  try {
    const res = await fetch(
      `${url}/storage/v1/object/sign/surat-files/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expiresIn: 3600 })
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return `${url}/storage/v1${data.signedURL}`;
  } catch {
    return null;
  }
};
