const pool = require('../config/db');

const getAllSantri = async () => {

  const result = await pool.query(
    'SELECT * FROM santri ORDER BY nama ASC'
  );

  return result.rows;
};

const getAllKegiatan = async () => {

  const result = await pool.query(
    'SELECT * FROM kegiatan ORDER BY id ASC'
  );

  return result.rows;
};

const saveAbsensi = async (data) => {

  const {
    santri_id,
    kegiatan_id,
    status
  } = data;

  await pool.query(
    `INSERT INTO absensi
    (santri_id, kegiatan_id, status)
    VALUES ($1, $2, $3)`,
    [santri_id, kegiatan_id, status]
  );
};

const saveAbsensiMassal = async (data) => {

  const {
    santri_id,
    kegiatan_id,
    status
  } = data;

  await pool.query(
    `INSERT INTO absensi
    (santri_id, kegiatan_id, status)
    VALUES ($1, $2, $3)`,
    [santri_id, kegiatan_id, status]
  );
};

const getTodayAbsensi = async () => {

  const result = await pool.query(`
    SELECT
      a.id,
      s.nama AS santri,
      k.nama AS kegiatan,
      a.status,
      a.tanggal
    FROM absensi a
    JOIN santri s
      ON s.id = a.santri_id
    JOIN kegiatan k
      ON k.id = a.kegiatan_id
    WHERE a.tanggal = CURRENT_DATE
    ORDER BY a.id DESC
  `);

  return result.rows;
};

const getAbsensiByTanggal = async (tanggal) => {

  const result = await pool.query(`
    SELECT
      a.id,
      s.nama AS santri,
      k.nama AS kegiatan,
      a.status,
      a.tanggal
    FROM absensi a
    JOIN santri s
      ON s.id = a.santri_id
    JOIN kegiatan k
      ON k.id = a.kegiatan_id
    WHERE a.tanggal = $1
    ORDER BY a.id DESC
  `, [tanggal]);

  return result.rows;
};

const getLaporanMingguan = async () => {

  const result = await pool.query(`
    SELECT
      s.nama AS santri,
      k.nama AS kegiatan,
      a.status,
      a.tanggal
    FROM absensi a
    JOIN santri s
      ON s.id = a.santri_id
    JOIN kegiatan k
      ON k.id = a.kegiatan_id
    WHERE a.tanggal >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY a.tanggal DESC
  `);

  return result.rows;
};

module.exports = {
  getAllSantri,
  getAllKegiatan,
  saveAbsensi,
  saveAbsensiMassal,
  getTodayAbsensi,
  getAbsensiByTanggal,
  getLaporanMingguan
};