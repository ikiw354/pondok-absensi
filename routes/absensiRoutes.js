const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const absensiModel = require('../models/absensiModel');

// ======================
// HALAMAN UTAMA
// ======================
router.get('/', async (req, res) => {

  const tanggal =
    req.query.tanggal ||
    new Date().toISOString().split('T')[0];

  const santri = await absensiModel.getAllSantri();
  const kegiatan = await absensiModel.getAllKegiatan();
  const absensi = await absensiModel.getAbsensiByTanggal(tanggal);

  res.render('index', {
    santri,
    kegiatan,
    absensi,
    tanggal
  });
});


// ======================
// ABSENSI MASSAL
// ======================
router.post('/absen/massal', async (req, res) => {
  try {

    const { kegiatan_id } = req.body;
    const santri = await absensiModel.getAllSantri();

    for (const s of santri) {
      const status = req.body[`status_${s.id}`];

      await absensiModel.saveAbsensiMassal({
        santri_id: s.id,
        kegiatan_id,
        status
      });
    }

    return res.redirect('/');

  } catch (error) {
    console.error(error);
    res.status(500).send('Gagal simpan absensi massal');
  }
});


// ======================
// ABSENSI SINGLE (opsional)
// ======================
router.post('/absen', async (req, res) => {

  const { kegiatan_id } = req.body;
  const santri = await absensiModel.getAllSantri();

  for (const s of santri) {
    const status = req.body[`status_${s.id}`];

    await absensiModel.saveAbsensiMassal({
      santri_id: s.id,
      kegiatan_id,
      status
    });
  }

  res.redirect('/');
});


// ======================
// PDF LAPORAN MINGGUAN (PRO + REKAP SANTRI)
// ======================
router.get('/laporan/mingguan', async (req, res) => {

  try {

    const result = await absensiModel.getLaporanMingguan();

    const doc = new PDFDocument({ margin: 40 });

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
    const target = 5;

    // ================= HEADER =================
    doc
      .fontSize(18)
      .text('LAPORAN ABSENSI MINGGUAN (PRO)', {
        align: 'center',
        underline: true
      });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .text(
        `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`,
        { align: 'center' }
      );

    doc.moveDown(2);

    // ================= REKAP GLOBAL =================
    doc
      .fontSize(11)
      .text(`Total Data        : ${total}`)
      .text(`Hadir             : ${hadir}`)
      .text(`Izin              : ${izin}`)
      .text(`Sakit             : ${sakit}`)
      .text(`Alfa              : ${alfa}`)
      .text(`Target Kegiatan   : ${target}`);

    doc.moveDown(2);

    // ================= TABLE HEADER =================
    const tableTop = doc.y;

    doc
      .fontSize(10)
      .fillColor('black')
      .text('No', 40, tableTop)
      .text('Nama', 70, tableTop)
      .text('Kegiatan', 200, tableTop)
      .text('Status', 340, tableTop)
      .text('Tanggal', 420, tableTop);

    doc
      .moveTo(40, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.moveDown(2);

    // ================= DATA ABSENSI =================
    let rowY = doc.y;

      result.forEach((item, index) => {

        // otomatis page baru kalau penuh
        if (rowY > 720) {

          doc.addPage();

          rowY = 50;

          // header tabel ulang
          doc
            .fontSize(10)
            .fillColor('black')
            .text('No', 40, rowY)
            .text('Nama', 70, rowY)
            .text('Kegiatan', 200, rowY)
            .text('Status', 340, rowY)
            .text('Tanggal', 420, rowY);

          doc
            .moveTo(40, rowY + 15)
            .lineTo(550, rowY + 15)
            .stroke();

          rowY += 30;
        }

        let color = 'black';

        if (item.status === 'Hadir') color = 'green';
        else if (item.status === 'Izin') color = 'orange';
        else if (item.status === 'Sakit') color = 'blue';
        else color = 'red';

        doc
          .fillColor('black')
          .fontSize(10)
          .text(index + 1, 40, rowY)
          .text(item.santri, 70, rowY, { width: 120 })
          .text(item.kegiatan, 200, rowY, { width: 120 });

        doc
          .fillColor(color)
          .text(item.status, 340, rowY);

        doc
          .fillColor('black')
          .text(
            new Date(item.tanggal).toLocaleDateString('id-ID'),
            420,
            rowY
          );

        // tinggi row fix
        rowY += 30;
      });

    // ================= HALAMAN BARU: REKAP PER SANTRI =================
    doc.addPage();

    doc
      .fontSize(16)
      .text('REKAP PER SANTRI', {
        align: 'center',
        underline: true
      });

    doc.moveDown(2);

    let no = 1;

    for (const nama in rekapSantri) {

      const d = rekapSantri[nama];

      doc
        .fontSize(11)
        .fillColor('black')
        .text(`${no}. ${nama}`);

      doc
        .fontSize(10)
        .fillColor('green')
        .text(`   Hadir : ${d.Hadir}`);

      doc
        .fillColor('orange')
        .text(`   Izin  : ${d.Izin}`);

      doc
        .fillColor('blue')
        .text(`   Sakit : ${d.Sakit}`);

      doc
        .fillColor('red')
        .text(`   Alfa  : ${d.Alfa}`);

      doc.moveDown();
      no++;
    }

    doc.end();

    stream.on('finish', () => {
      res.download(filePath, 'laporan-mingguan-pro.pdf');
    });

  } catch (error) {
    console.log(error);
    res.send('Terjadi error saat membuat PDF');
  }
});

module.exports = router;