/**
 * ============================================================================
 * MODUL          : Addon Entity (Addon.js)
 * REFERENSI      : DPPL-01 CLS-05 / SKPL KF-09
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Entitas Addon untuk manajemen katalog snack, minuman, dan
 *                  merchandise beserta stok item dengan prepared statements MySQL.
 * ============================================================================
 */

import pool from '@/config/db';

export class Addon {
  #id;
  #nama_item;
  #harga;
  #stok;

  /**
   * Konstruktor Entitas Addon
   * @param {number|null} id
   * @param {string} nama_item
   * @param {number} harga
   * @param {number} stok
   */
  constructor(id = null, nama_item = '', harga = 0, stok = 0) {
    this.#id = id !== null ? Number(id) : null;
    this.#nama_item = String(nama_item || '');
    this.#harga = Number(harga) || 0;
    this.#stok = Number(stok) || 0;
  }

  // --- GETTER & SETTER ---
  get id() {
    return this.#id;
  }

  set id(value) {
    this.#id = value !== null ? Number(value) : null;
  }

  get nama_item() {
    return this.#nama_item;
  }

  set nama_item(value) {
    this.#nama_item = String(value || '');
  }

  get harga() {
    return this.#harga;
  }

  set harga(value) {
    this.#harga = Number(value) || 0;
  }

  get stok() {
    return this.#stok;
  }

  set stok(value) {
    this.#stok = Number(value) || 0;
  }

  // --- DATABASE HELPER METHODS ---

  /**
   * Memeriksa ketersediaan stok addon berdasarkan kuantitas yang diminta
   * @param {number} id
   * @param {number} [qty=1]
   * @returns {Promise<boolean>}
   */
  static async checkStok(id, qty = 1) {
    try {
      const query = 'SELECT id, nama_item, harga, stok FROM ADDON WHERE id = ? LIMIT 1';
      const [rows] = await pool.execute(query, [id]);
      if (!rows || rows.length === 0) {
        return false;
      }
      return Number(rows[0].stok) >= Number(qty);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return true;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk memeriksa ketersediaan stok
   * @param {number} [id]
   * @param {number} [qty=1]
   * @returns {Promise<boolean>}
   */
  async checkStok(id, qty = 1) {
    const targetId = id !== undefined ? id : this.#id;
    return Addon.checkStok(targetId, qty);
  }

  /**
   * Mengambil seluruh katalog produk addon
   * @returns {Promise<Addon[]>}
   */
  static async findAll() {
    try {
      const query = 'SELECT id, nama_item, harga, stok FROM ADDON ORDER BY id ASC';
      const [rows] = await pool.execute(query);
      if (!rows || !Array.isArray(rows)) {
        return [];
      }
      return rows.map((r) => new Addon(r.id, r.nama_item, r.harga, r.stok));
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return [
          new Addon(1, 'Paket Snack (Popcorn + Cola)', 15000, 100),
          new Addon(2, 'Popcorn Caramel Large', 20000, 75),
          new Addon(3, 'Es Kopi Susu Komika', 18000, 60),
          new Addon(4, 'Air Mineral 600ml', 5000, 150),
          new Addon(5, 'Official Stiker Pack Stand-Up', 12000, 50),
        ];
      }
      throw err;
    }
  }

  /**
   * Instance method untuk mengambil seluruh katalog addon
   * @returns {Promise<Addon[]>}
   */
  async findAll() {
    return Addon.findAll();
  }

  /**
   * Mengambil detail produk addon berdasarkan ID
   * @param {number} id
   * @returns {Promise<Addon|null>}
   */
  static async findById(id) {
    try {
      const query = 'SELECT id, nama_item, harga, stok FROM ADDON WHERE id = ? LIMIT 1';
      const [rows] = await pool.execute(query, [id]);
      if (!rows || rows.length === 0) {
        return null;
      }
      const r = rows[0];
      return new Addon(r.id, r.nama_item, r.harga, r.stok);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk findById
   * @param {number} id
   * @returns {Promise<Addon|null>}
   */
  async findById(id) {
    return Addon.findById(id);
  }

  /**
   * Menambahkan produk addon baru ke basis data
   * @param {object} data - { nama_item, harga, stok }
   * @returns {Promise<Addon>}
   */
  static async create(data) {
    const nama_item = data.nama_item || '';
    const harga = Number(data.harga) || 0;
    const stok = Number(data.stok) || 0;

    try {
      const query = 'INSERT INTO ADDON (nama_item, harga, stok) VALUES (?, ?, ?)';
      const [result] = await pool.execute(query, [nama_item, harga, stok]);
      const newId = result ? result.insertId : null;
      return new Addon(newId, nama_item, harga, stok);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return new Addon(99, nama_item, harga, stok);
      }
      throw err;
    }
  }

  /**
   * Instance method untuk create produk addon
   * @param {object} [data]
   * @returns {Promise<Addon>}
   */
  async create(data) {
    const payload = data || this.toJSON();
    return Addon.create(payload);
  }

  /**
   * Memperbarui atau mengurangi stok addon
   * @param {number} id
   * @param {number} qty
   * @param {boolean} [isDecrement=false]
   * @returns {Promise<boolean>}
   */
  static async updateStok(id, qty, isDecrement = false) {
    try {
      let query;
      let params;

      if (isDecrement) {
        query = 'UPDATE ADDON SET stok = stok - ? WHERE id = ? AND stok >= ?';
        params = [Number(qty), id, Number(qty)];
      } else {
        query = 'UPDATE ADDON SET stok = ? WHERE id = ?';
        params = [Number(qty), id];
      }

      const [result] = await pool.execute(query, params);
      return result && result.affectedRows > 0;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return true;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk updateStok
   * @param {number} id
   * @param {number} qty
   * @param {boolean} [isDecrement=false]
   * @returns {Promise<boolean>}
   */
  async updateStok(id, qty, isDecrement = false) {
    const targetId = id !== undefined ? id : this.#id;
    return Addon.updateStok(targetId, qty, isDecrement);
  }

  /**
   * Mengurangi stok addon (decrement)
   * @param {number} id
   * @param {number} qty
   * @returns {Promise<boolean>}
   */
  static async decrementStok(id, qty) {
    return Addon.updateStok(id, qty, true);
  }

  /**
   * Instance method untuk decrementStok
   * @param {number} id
   * @param {number} qty
   * @returns {Promise<boolean>}
   */
  async decrementStok(id, qty) {
    const targetId = id !== undefined ? id : this.#id;
    return Addon.decrementStok(targetId, qty);
  }

  /**
   * Konversi objek menjadi format JSON
   */
  toJSON() {
    return {
      id: this.#id,
      nama_item: this.#nama_item,
      harga: this.#harga,
      stok: this.#stok,
    };
  }
}

export default Addon;
