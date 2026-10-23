/**
 * ============================================================================
 * MODUL          : Database Connection Pool (db.js)
 * REFERENSI      : DPPL-01 Bab 2.4 (Hal. 50) & SKPL Bab 4.7
 * PENGEMBANG     : 1. Abisar Fathir (103112400068) - Konfigurasi MySQL
 *                  2. Ariel Ahnaf Kusuma (103112400050) - Integrasi Driver mysql2
 * DESKRIPSI      : Modul koneksi basis data MySQL menggunakan mysql2/promise
 *                  yang membaca konfigurasi environment dari file .env.local
 * ============================================================================
 */

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_tiket_pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
