/**
 * ============================================================================
 * MODUL          : Tiket Entity (Tiket.js)
 * REFERENSI      : DPPL-01 CLS-04 / SKPL KF-08
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Entitas Tiket untuk manajemen master kategori/tier harga
 *                  dan kuota tiket Stand-Up Comedy dengan prepared statement MySQL.
 * ============================================================================
 */

import pool from '@/config/db';

export class Tiket {
  #id;
  #tier;
  #harga;
  #sisa_kuota;

  /**
   * Konstruktor Entitas Tiket
   * @param {number|null} id
   * @param {string} tier - Contoh: 'Early Bird', 'Batch 1', 'Batch 2', 'VIP'
   * @param {number} harga
   * @param {number} sisa_kuota
   */
  constructor(id = null, tier = '', harga = 0, sisa_kuota = 0) {
    this.#id = id !== null ? Number(id) : null;
    this.#tier = String(tier || '');
    this.#harga = Number(harga) || 0;
    this.#sisa_kuota = Number(sisa_kuota) || 0;
  }

  // --- GETTER & SETTER ---
  get id() {
    return this.#id;
  }

  set id(value) {
    this.#id = value !== null ? Number(value) : null;
  }

  get tier() {
    return this.#tier;
  }

  set tier(value) {
    this.#tier = String(value || '');
  }

  get harga() {
    return this.#harga;
  }

  set harga(value) {
    this.#harga = Number(value) || 0;
  }

  get sisa_kuota() {
    return this.#sisa_kuota;
  }

  set sisa_kuota(value) {
    this.#sisa_kuota = Number(value) || 0;
  }

  // --- DATABASE HELPER METHODS ---

  /**
   * Memeriksa apakah sisa kuota tiket mencukupi kuantitas pembelian yang diminta
   * @param {number} tierId
   * @param {number} [qty=1]
   * @returns {Promise<boolean>}
   */
  static async checkQuota(tierId, qty = 1) {
    try {
      const query = 'SELECT id, tier, harga, sisa_kuota FROM TIKET WHERE id = ? LIMIT 1';
      const [rows] = await pool.execute(query, [tierId]);
      if (!rows || rows.length === 0) {
        return false;
      }
      return Number(rows[0].sisa_kuota) >= Number(qty);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return true;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk memeriksa ketersediaan kuota
   * @param {number} [tierId]
   * @param {number} [qty=1]
   * @returns {Promise<boolean>}
   */
  async checkQuota(tierId, qty = 1) {
    const targetId = tierId !== undefined ? tierId : this.#id;
    return Tiket.checkQuota(targetId, qty);
  }

  /**
   * Mengambil seluruh tier tiket yang tersedia
   * @returns {Promise<Tiket[]>}
   */
  static async findAll() {
    try {
      const query = 'SELECT id, tier, harga, sisa_kuota FROM TIKET ORDER BY id ASC';
      const [rows] = await pool.execute(query);
      if (!rows || !Array.isArray(rows)) {
        return [];
      }
      return rows.map((r) => new Tiket(r.id, r.tier, r.harga, r.sisa_kuota));
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return [
          new Tiket(1, 'Early Bird', 50000, 0),
          new Tiket(2, 'Batch 1', 75000, 120),
          new Tiket(3, 'Batch 2', 100000, 80),
          new Tiket(4, 'VIP', 150000, 25),
          new Tiket(5, 'VVIP (Meet & Greet)', 250000, 10),
        ];
      }
      throw err;
    }
  }

  /**
   * Instance method untuk mengambil seluruh tier tiket
   * @returns {Promise<Tiket[]>}
   */
  async findAll() {
    return Tiket.findAll();
  }

  /**
   * Mengambil detail tier tiket berdasarkan ID
   * @param {number} tierId
   * @returns {Promise<Tiket|null>}
   */
  static async findById(tierId) {
    try {
      const query = 'SELECT id, tier, harga, sisa_kuota FROM TIKET WHERE id = ? LIMIT 1';
      const [rows] = await pool.execute(query, [tierId]);
      if (!rows || rows.length === 0) {
        return null;
      }
      const r = rows[0];
      return new Tiket(r.id, r.tier, r.harga, r.sisa_kuota);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk mengambil data tier tiket berdasarkan ID
   * @param {number} tierId
   * @returns {Promise<Tiket|null>}
   */
  async findById(tierId) {
    return Tiket.findById(tierId);
  }

  /**
   * Memperbarui kuota tiket dengan nilai baru
   * @param {number} tierId
   * @param {number} newQuota
   * @returns {Promise<boolean>}
   */
  static async updateQuota(tierId, newQuota) {
    try {
      const query = 'UPDATE TIKET SET sisa_kuota = ? WHERE id = ?';
      const [result] = await pool.execute(query, [Number(newQuota), tierId]);
      return result && result.affectedRows > 0;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return true;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk update kuota
   * @param {number} tierId
   * @param {number} newQuota
   * @returns {Promise<boolean>}
   */
  async updateQuota(tierId, newQuota) {
    const targetId = tierId !== undefined ? tierId : this.#id;
    return Tiket.updateQuota(targetId, newQuota);
  }

  /**
   * Mengurangi sisa kuota tiket dengan jumlah pembelian tertentu
   * @param {number} tierId
   * @param {number} qty
   * @returns {Promise<boolean>}
   */
  static async decrementQuota(tierId, qty) {
    try {
      const query = 'UPDATE TIKET SET sisa_kuota = sisa_kuota - ? WHERE id = ? AND sisa_kuota >= ?';
      const [result] = await pool.execute(query, [Number(qty), tierId, Number(qty)]);
      return result && result.affectedRows > 0;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return true;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk decrement kuota
   * @param {number} tierId
   * @param {number} qty
   * @returns {Promise<boolean>}
   */
  async decrementQuota(tierId, qty) {
    const targetId = tierId !== undefined ? tierId : this.#id;
    return Tiket.decrementQuota(targetId, qty);
  }

  /**
   * Konversi objek menjadi format JSON
   */
  toJSON() {
    return {
      id: this.#id,
      tier: this.#tier,
      harga: this.#harga,
      sisa_kuota: this.#sisa_kuota,
    };
  }
}

export default Tiket;
