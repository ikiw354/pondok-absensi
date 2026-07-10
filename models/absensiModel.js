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
      a.santri_id,
      a.kegiatan_id,
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
      a.santri_id,
      a.kegiatan_id,
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

const addSantri = async (nama) => {
  const result = await pool.query(
    'INSERT INTO santri (nama) VALUES ($1) RETURNING *',
    [nama]
  );
  return result.rows[0];
};

const updateSantri = async (id, nama) => {
  const result = await pool.query(
    'UPDATE santri SET nama = $1 WHERE id = $2 RETURNING *',
    [nama, id]
  );
  return result.rows[0];
};

const deleteSantri = async (id) => {
  const result = await pool.query(
    'DELETE FROM santri WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

const addKegiatan = async (nama) => {
  const result = await pool.query(
    'INSERT INTO kegiatan (nama) VALUES ($1) RETURNING *',
    [nama]
  );
  return result.rows[0];
};

const updateKegiatan = async (id, nama) => {
  const result = await pool.query(
    'UPDATE kegiatan SET nama = $1 WHERE id = $2 RETURNING *',
    [nama, id]
  );
  return result.rows[0];
};

const deleteKegiatan = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM absensi WHERE kegiatan_id = $1', [id]);
    const result = await client.query('DELETE FROM kegiatan WHERE id = $1 RETURNING *', [id]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateAbsensi = async (id, status, kegiatan_id, tanggal) => {
  const result = await pool.query(
    'UPDATE absensi SET status = $1, kegiatan_id = $2, tanggal = $3 WHERE id = $4 RETURNING *',
    [status, kegiatan_id, tanggal, id]
  );
  return result.rows[0];
};

const deleteAbsensi = async (id) => {
  const result = await pool.query(
    'DELETE FROM absensi WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

module.exports = {
  getAllSantri,
  getAllKegiatan,
  saveAbsensi,
  saveAbsensiMassal,
  getTodayAbsensi,
  getAbsensiByTanggal,
  getLaporanMingguan,
  addSantri,
  updateSantri,
  deleteSantri,
  addKegiatan,
  updateKegiatan,
  deleteKegiatan,
  updateAbsensi,
  deleteAbsensi
};