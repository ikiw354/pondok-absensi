const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const absensiModel = require('../models/absensiModel');

// ======================
// HALAMAN UTAMA (DASHBOARD)
// ======================
router.get('/', async (req, res) => {
  try {
    const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];

    const santri = await absensiModel.getAllSantri();
    const kegiatan = await absensiModel.getAllKegiatan();
    const absensi = await absensiModel.getAbsensiByTanggal(tanggal);

    res.render('index', {
      santri,
      kegiatan,
      absensi,
      tanggal
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Terjadi kesalahan saat memuat data dashboard');
  }
});

// ======================
// ABSENSI MASSAL
// ======================
router.post('/absen/massal', async (req, res) => {
  try {
    const { kegiatan_id } = req.body;
    if (!kegiatan_id) {
      return res.status(400).json({ success: false, error: 'Pilih kegiatan terlebih dahulu' });
    }

    const santri = await absensiModel.getAllSantri();

    for (const s of santri) {
      const status = req.body[`status_${s.id}`] || 'Hadir'; // Default to Hadir if not specified
      await absensiModel.saveAbsensiMassal({
        santri_id: s.id,
        kegiatan_id,
        status
      });
    }

    // Check if the request expects JSON
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Absensi massal berhasil disimpan' });
    }
    return res.redirect('/');
  } catch (error) {
    console.error('Error in absensi massal:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, error: 'Gagal simpan absensi massal' });
    }
    res.status(500).send('Gagal simpan absensi massal');
  }
});

// ======================
// CRUD SANTRI (API Endpoints)
// ======================
router.post('/santri', async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama || nama.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nama santri tidak boleh kosong' });
    }
    const newSantri = await absensiModel.addSantri(nama.trim());
    return res.json({ success: true, message: 'Santri berhasil ditambahkan', data: newSantri });
  } catch (error) {
    console.error('Error adding santri:', error);
    return res.status(500).json({ success: false, error: 'Gagal menambahkan santri' });
  }
});

router.put('/santri/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;
    if (!nama || nama.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nama santri tidak boleh kosong' });
    }
    const updated = await absensiModel.updateSantri(id, nama.trim());
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Santri tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Santri berhasil diubah', data: updated });
  } catch (error) {
    console.error('Error updating santri:', error);
    return res.status(500).json({ success: false, error: 'Gagal mengubah nama santri' });
  }
});

router.delete('/santri/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await absensiModel.deleteSantri(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Santri tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Santri berhasil dihapus', data: deleted });
  } catch (error) {
    console.error('Error deleting santri:', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus santri' });
  }
});

// ======================
// CRUD KEGIATAN (API Endpoints)
// ======================
router.post('/kegiatan', async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama || nama.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nama kegiatan tidak boleh kosong' });
    }
    const newKegiatan = await absensiModel.addKegiatan(nama.trim());
    return res.json({ success: true, message: 'Kegiatan berhasil ditambahkan', data: newKegiatan });
  } catch (error) {
    console.error('Error adding kegiatan:', error);
    return res.status(500).json({ success: false, error: 'Gagal menambahkan kegiatan' });
  }
});

router.put('/kegiatan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;
    if (!nama || nama.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nama kegiatan tidak boleh kosong' });
    }
    const updated = await absensiModel.updateKegiatan(id, nama.trim());
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Kegiatan tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Kegiatan berhasil diubah', data: updated });
  } catch (error) {
    console.error('Error updating kegiatan:', error);
    return res.status(500).json({ success: false, error: 'Gagal mengubah nama kegiatan' });
  }
});

router.delete('/kegiatan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await absensiModel.deleteKegiatan(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Kegiatan tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Kegiatan berhasil dihapus', data: deleted });
  } catch (error) {
    console.error('Error deleting kegiatan:', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus kegiatan' });
  }
});

// ======================
// CRUD ABSENSI INDIVIDUAL (API Endpoints)
// ======================
router.put('/absen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, kegiatan_id, tanggal } = req.body;
    if (!status || !kegiatan_id || !tanggal) {
      return res.status(400).json({ success: false, error: 'Data tidak lengkap' });
    }
    const updated = await absensiModel.updateAbsensi(id, status, kegiatan_id, tanggal);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Data absensi tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Data absensi berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Error updating absensi:', error);
    return res.status(500).json({ success: false, error: 'Gagal memperbarui data absensi' });
  }
});

router.delete('/absen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await absensiModel.deleteAbsensi(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Data absensi tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Data absensi berhasil dihapus', data: deleted });
  } catch (error) {
    console.error('Error deleting absensi:', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus data absensi' });
  }
});

// ======================
// PDF LAPORAN MINGGUAN (PREMIUM & TERTATA RAPI)
// ======================
router.get('/laporan/mingguan', async (req, res) => {
  try {
    const result = await absensiModel.getLaporanMingguan();

    // Create document with page buffering to draw footer/page count at the end
    const doc = new PDFDocument({ margin: 40, bufferPages: true });

    const filePath = path.join(
      __dirname,
      '../public/pdf/laporan-mingguan-pro.pdf'
    );

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ================= REKAP GLOBAL =================
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alfa = 0;

    // ================= REKAP PER SANTRI =================
    const rekapSantri = {};

    result.forEach(r => {
      // global rekap
      if (r.status === 'Hadir') hadir++;
      else if (r.status === 'Izin') izin++;
      else if (r.status === 'Sakit') sakit++;
      else alfa++;

      // per santri rekap
      if (!rekapSantri[r.santri]) {
        rekapSantri[r.santri] = {
          Hadir: 0,
          Izin: 0,
          Sakit: 0,
          Alfa: 0
        };
      }
      rekapSantri[r.santri][r.status]++;
    });

    const total = result.length;

    // ----------------------------------------------------
    // HALAMAN 1: HEADER BANNER, KARTU REKAP & TABEL DETAIL
    // ----------------------------------------------------

    // 1. Gambar Header Banner (Dark Teal)
    doc.rect(40, 40, 532, 75).fill('#0f766e');

    // Teks Header
    doc.fillColor('#ffffff')
       .fontSize(15)
       .font('Helvetica-Bold')
       .text('LAPORAN ABSENSI MINGGUAN SANTRI', 55, 52)
       .fontSize(8.5)
       .font('Helvetica')
       .text('REKAPITULASI KEHADIRAN PONDOK PESANTREN', 55, 72)
       .fontSize(8)
       .text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 55, 87);

    // 2. Gambar Kartu Rekapitulasi (Hadir, Izin, Sakit, Alfa)
    const cardY = 130;
    const cardH = 45;
    const cardW = 120;
    const gap = 17;

    // Kartu Hadir
    doc.fillColor('#f0fdf4').strokeColor('#bbf7d0').rect(40, cardY, cardW, cardH).fillAndStroke();
    doc.fillColor('#16a34a').fontSize(7.5).font('Helvetica-Bold').text('🟢 HADIR', 50, cardY + 8);
    doc.fontSize(15).text(hadir, 50, cardY + 20);

    // Kartu Izin
    doc.fillColor('#fef3c7').strokeColor('#fde68a').rect(40 + cardW + gap, cardY, cardW, cardH).fillAndStroke();
    doc.fillColor('#d97706').fontSize(7.5).font('Helvetica-Bold').text('🟡 IZIN', 40 + cardW + gap + 10, cardY + 8);
    doc.fontSize(15).text(izin, 40 + cardW + gap + 10, cardY + 20);

    // Kartu Sakit
    doc.fillColor('#eff6ff').strokeColor('#bfdbfe').rect(40 + (cardW + gap) * 2, cardY, cardW, cardH).fillAndStroke();
    doc.fillColor('#2563eb').fontSize(7.5).font('Helvetica-Bold').text('🔵 SAKIT', 40 + (cardW + gap) * 2 + 10, cardY + 8);
    doc.fontSize(15).text(sakit, 40 + (cardW + gap) * 2 + 10, cardY + 20);

    // Kartu Alfa
    doc.fillColor('#fef2f2').strokeColor('#fecaca').rect(40 + (cardW + gap) * 3, cardY, cardW, cardH).fillAndStroke();
    doc.fillColor('#dc2626').fontSize(7.5).font('Helvetica-Bold').text('🔴 ALFA', 40 + (cardW + gap) * 3 + 10, cardY + 8);
    doc.fontSize(15).text(alfa, 40 + (cardW + gap) * 3 + 10, cardY + 20);

    // Judul Tabel Riwayat
    doc.fillColor('#1e293b')
       .fontSize(10.5)
       .font('Helvetica-Bold')
       .text('RIWAYAT ABSENSI DETAIL (7 HARI TERAKHIR)', 40, 195);

    // Konfigurasi Kolom Tabel Utama
    const cols = {
      no: { x: 40, w: 30, label: 'No' },
      nama: { x: 75, w: 175, label: 'Nama Santri' },
      kegiatan: { x: 260, w: 125, label: 'Kegiatan' },
      status: { x: 395, w: 75, label: 'Status' },
      tanggal: { x: 480, w: 92, label: 'Tanggal' }
    };

    let currentY = 212;

    const drawTableHeader = (y, isSantriTable = false) => {
      const headerColor = isSantriTable ? '#334155' : '#0f766e';
      doc.rect(40, y, 532, 20).fill(headerColor);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');

      if (isSantriTable) {
        doc.text('No', 45, y + 6)
           .text('Nama Santri', 75, y + 6)
           .text('Hadir', 270, y + 6, { width: 45, align: 'center' })
           .text('Izin', 325, y + 6, { width: 45, align: 'center' })
           .text('Sakit', 380, y + 6, { width: 45, align: 'center' })
           .text('Alfa', 435, y + 6, { width: 45, align: 'center' })
           .text('% Kehadiran', 490, y + 6, { width: 75, align: 'center' });
      } else {
        doc.text(cols.no.label, cols.no.x + 5, y + 6)
           .text(cols.nama.label, cols.nama.x + 5, y + 6)
           .text(cols.kegiatan.label, cols.kegiatan.x + 5, y + 6)
           .text(cols.status.label, cols.status.x + 5, y + 6)
           .text(cols.tanggal.label, cols.tanggal.x + 5, y + 6);
      }
    };

    drawTableHeader(currentY);
    currentY += 20;

    // Loop data absensi
    result.forEach((item, index) => {
      // Deteksi batas halaman (tinggi a4 = 842, batas bawah 720)
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        drawTableHeader(currentY);
        currentY += 20;
      }

      // Baris belang-belang
      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(40, currentY, 532, 20).fill(bgColor);

      // Garis horizontal pemisah
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, currentY + 20).lineTo(572, currentY + 20).stroke();

      doc.fillColor('#334155').fontSize(8).font('Helvetica');
      doc.text(index + 1, cols.no.x + 5, currentY + 6);
      doc.text(item.santri, cols.nama.x + 5, currentY + 6, { width: cols.nama.w - 10, ellipsis: true });
      doc.text(item.kegiatan, cols.kegiatan.x + 5, currentY + 6, { width: cols.kegiatan.w - 10, ellipsis: true });

      // Format warna status
      let statusColor = '#334155';
      let statusIndicator = '';
      if (item.status === 'Hadir') { statusColor = '#16a34a'; statusIndicator = '🟢 '; }
      else if (item.status === 'Izin') { statusColor = '#d97706'; statusIndicator = '🟡 '; }
      else if (item.status === 'Sakit') { statusColor = '#2563eb'; statusIndicator = '🔵 '; }
      else if (item.status === 'Alfa') { statusColor = '#dc2626'; statusIndicator = '🔴 '; }

      doc.fillColor(statusColor).font('Helvetica-Bold').text(statusIndicator + item.status, cols.status.x + 5, currentY + 6);

      doc.fillColor('#334155').font('Helvetica').text(
        new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        cols.tanggal.x + 5,
        currentY + 6
      );

      currentY += 20;
    });

    // ----------------------------------------------------
    // HALAMAN LAIN: REKAP KEHADIRAN PER SANTRI
    // ----------------------------------------------------
    doc.addPage();

    doc.fillColor('#1e293b')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('REKAPITULASI KEHADIRAN PER SANTRI', 40, 50);

    doc.fillColor('#64748b')
       .fontSize(8)
       .font('Helvetica')
       .text('Persentase kehadiran santri dalam rentang waktu laporan mingguan ini.', 40, 68);

    let rekapY = 85;
    drawTableHeader(rekapY, true);
    rekapY += 20;

    let santriIdx = 0;
    for (const name in rekapSantri) {
      if (rekapY > 700) {
        doc.addPage();
        rekapY = 50;
        drawTableHeader(rekapY, true);
        rekapY += 20;
      }

      const d = rekapSantri[name];
      const sTotal = d.Hadir + d.Izin + d.Sakit + d.Alfa;
      const rate = sTotal > 0 ? (d.Hadir / sTotal) * 100 : 0;

      const bgColor = santriIdx % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(40, rekapY, 532, 20).fill(bgColor);
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, rekapY + 20).lineTo(572, rekapY + 20).stroke();

      doc.fillColor('#334155').fontSize(8).font('Helvetica');
      doc.text(santriIdx + 1, 45, rekapY + 6)
         .text(name, 75, rekapY + 6, { width: 180, ellipsis: true });

      doc.text(d.Hadir, 270, rekapY + 6, { width: 45, align: 'center' })
         .text(d.Izin, 325, rekapY + 6, { width: 45, align: 'center' })
         .text(d.Sakit, 380, rekapY + 6, { width: 45, align: 'center' })
         .text(d.Alfa, 435, rekapY + 6, { width: 45, align: 'center' });

      let rateColor = '#dc2626';
      if (rate >= 90) rateColor = '#16a34a';
      else if (rate >= 75) rateColor = '#d97706';

      doc.fillColor(rateColor)
         .font('Helvetica-Bold')
         .text(`${rate.toFixed(1)}%`, 490, rekapY + 6, { width: 75, align: 'center' });

      rekapY += 20;
      santriIdx++;
    }

    // ====================================================
    // MENGGAMBAR FOOTER DAN HEADER DI SEMUA HALAMAN BUFFERED
    // ====================================================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Garis dan teks footer
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, 745).lineTo(572, 745).stroke();
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica');
      doc.text('Laporan Absensi Harian Santri | Pondok Pesantren', 40, 753);
      doc.text(`Halaman ${i + 1} dari ${pages.count}`, 40, 753, { align: 'right', width: 532 });

      // Header di halaman selain halaman pertama
      if (i > 0) {
        doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica');
        doc.text('Laporan Absensi Mingguan', 40, 23);
        doc.text(`Pondok Pesantren`, 40, 23, { align: 'right', width: 532 });
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, 32).lineTo(572, 32).stroke();
      }
    }

    doc.end();

    stream.on('finish', () => {
      res.download(filePath, 'laporan-mingguan-pro.pdf');
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Terjadi error saat membuat PDF');
  }
});

module.exports = router;