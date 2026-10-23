/**
 * ============================================================================
 * MODUL          : Pengguna Entity (Pengguna.js)
 * REFERENSI      : DPPL-01 CLS-01 & SKPL KF-01 (Autentikasi Pengguna)
 * PENGEMBANG     : 1. Ariel Ahnaf Kusuma (103112400050) - Logika Autentikasi
 *                  2. Abisar Fathir (103112400068) - Query Entitas PENGGUNA
 * DESKRIPSI      : Skeleton class OOP entitas Pengguna dengan private attributes (#),
 *                  getter/setter, method login() untuk validasi kredensial ke MySQL,
 *                  dan signature method logout().
 * ============================================================================
 */

import pool from '@/config/db';

export class Pengguna {
  #id;
  #username;
  #password_hash;
  #role;

  /**
   * Konstruktor Entitas Pengguna
   * @param {number|null} id
   * @param {string} username
   * @param {string} password_hash
   * @param {string} role - 'admin' | 'kasir' | 'gate' | 'customer'
   */
  constructor(id = null, username = '', password_hash = '', role = '') {
    this.#id = id;
    this.#username = username;
    this.#password_hash = password_hash;
    this.#role = role;
  }

  // --- GETTER & SETTER ---
  get id() {
    return this.#id;
  }

  set id(value) {
    this.#id = value;
  }

  get username() {
    return this.#username;
  }

  set username(value) {
    this.#username = value;
  }

  get password_hash() {
    return this.#password_hash;
  }

  set password_hash(value) {
    this.#password_hash = value;
  }

  get role() {
    return this.#role;
  }

  set role(value) {
    this.#role = value;
  }

  // --- METHODS ---

  /**
   * Memvalidasi kredensial username & password terhadap tabel PENGGUNA di basis data
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Pengguna|null>} Objek Pengguna jika valid, null jika gagal
   */
  static async login(username, password) {
    const query = 'SELECT id, username, password_hash, role FROM PENGGUNA WHERE username = ? LIMIT 1';
    const [rows] = await pool.execute(query, [username]);

    if (!rows || rows.length === 0) {
      return null;
    }

    const userData = rows[0];

    // Catatan: Verifikasi password plain/hash sesuai skema simulasi data seeding Tugas ImPal
    if (userData.password_hash !== password) {
      return null;
    }

    return new Pengguna(
      userData.id,
      userData.username,
      userData.password_hash,
      userData.role
    );
  }

  /**
   * Method signature instance login
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Pengguna|null>}
   */
  async login(username, password) {
    return Pengguna.login(username, password);
  }

  /**
   * Method signature logout
   */
  logout() {
    // Signature kosong untuk implementasi sesi logout
  }

  /**
   * Konversi objek menjadi format JSON aman (tanpa password_hash)
   */
  toJSON() {
    return {
      id: this.#id,
      username: this.#username,
      role: this.#role,
    };
  }
}

export default Pengguna;
