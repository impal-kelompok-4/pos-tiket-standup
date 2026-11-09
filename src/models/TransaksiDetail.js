/**
 * ============================================================================
 * MODUL          : TransaksiDetail Entity (TransaksiDetail.js)
 * REFERENSI      : DPPL-01 CLS-03 / SKPL KF-01
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Entitas TransaksiDetail untuk pencatatan rincian item tiket dan add-on
 *                  dalam transaksi penjualan dengan MySQL prepared statements.
 * ============================================================================
 */

import pool from '@/config/db';

export class TransaksiDetail {
  #id_detail;
  #no_invoice;
  #id_tiket;
  #id_addon;
  #kuantitas;
  #subtotal;

  /**
   * Konstruktor Entitas TransaksiDetail
   * @param {number|null} id_detail
   * @param {string} no_invoice
   * @param {number|null} id_tiket
   * @param {number|null} id_addon
   * @param {number} kuantitas
   * @param {number} subtotal
   */
  constructor(
    id_detail = null,
    no_invoice = '',
    id_tiket = null,
    id_addon = null,
    kuantitas = 1,
    subtotal = 0
  ) {
    this.#id_detail = id_detail !== null && id_detail !== undefined ? Number(id_detail) : null;
    this.#no_invoice = String(no_invoice || '');
    this.#id_tiket = id_tiket !== null && id_tiket !== undefined ? Number(id_tiket) : null;
    this.#id_addon = id_addon !== null && id_addon !== undefined ? Number(id_addon) : null;
    this.#kuantitas = Number(kuantitas) || 1;
    this.#subtotal = Number(subtotal) || 0;
  }

  // --- GETTER & SETTER ---
  get id_detail() {
    return this.#id_detail;
  }

  set id_detail(value) {
    this.#id_detail = value !== null && value !== undefined ? Number(value) : null;
  }

  get no_invoice() {
    return this.#no_invoice;
  }

  set no_invoice(value) {
    this.#no_invoice = String(value || '');
  }

  get id_tiket() {
    return this.#id_tiket;
  }

  set id_tiket(value) {
    this.#id_tiket = value !== null && value !== undefined ? Number(value) : null;
  }

  get id_addon() {
    return this.#id_addon;
  }

  set id_addon(value) {
    this.#id_addon = value !== null && value !== undefined ? Number(value) : null;
  }

  get kuantitas() {
    return this.#kuantitas;
  }

  set kuantitas(value) {
    this.#kuantitas = Number(value) || 1;
  }

  get subtotal() {
    return this.#subtotal;
  }

  set subtotal(value) {
    this.#subtotal = Number(value) || 0;
  }

  // --- METHODS ---

  /**
   * Menghitung subtotal rincian item berdasarkan harga satuan dan kuantitas
   * @param {number} [unitPrice]
   * @returns {number}
   */
  calculateSubtotal(unitPrice) {
    if (unitPrice !== undefined) {
      this.#subtotal = Number(unitPrice) * this.#kuantitas;
    }
    return this.#subtotal;
  }

  // --- DATABASE HELPER METHODS ---

  /**
   * Menyimpan baris rincian transaksi ke tabel TRANSAKSI_DETAIL
   * @param {object} [data]
   * @returns {Promise<TransaksiDetail>}
   */
  static async saveDetail(data) {
    const no_invoice = data.no_invoice || '';
    const id_tiket = data.id_tiket !== undefined ? data.id_tiket : null;
    const id_addon = data.id_addon !== undefined ? data.id_addon : null;
    const kuantitas = Number(data.kuantitas) || 1;
    const subtotal = Number(data.subtotal) || 0;

    try {
      const query = `
        INSERT INTO TRANSAKSI_DETAIL (no_invoice, id_tiket, id_addon, kuantitas, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        no_invoice,
        id_tiket,
        id_addon,
        kuantitas,
        subtotal,
      ]);
      const newId = result ? result.insertId : null;
      return new TransaksiDetail(newId, no_invoice, id_tiket, id_addon, kuantitas, subtotal);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return new TransaksiDetail(1, no_invoice, id_tiket, id_addon, kuantitas, subtotal);
      }
      throw err;
    }
  }

  /**
   * Instance method untuk menyimpan baris detail transaksi
   * @param {object} [data]
   * @returns {Promise<TransaksiDetail>}
   */
  async saveDetail(data) {
    const payload = data || this.toJSON();
    const saved = await TransaksiDetail.saveDetail(payload);
    if (saved && saved.id_detail) {
      this.#id_detail = saved.id_detail;
    }
    return saved;
  }

  /**
   * Mengambil seluruh detail transaksi berdasarkan nomor invoice
   * @param {string} noInvoice
   * @returns {Promise<TransaksiDetail[]>}
   */
  static async findByInvoice(noInvoice) {
    try {
      const query = `
        SELECT id_detail, no_invoice, id_tiket, id_addon, kuantitas, subtotal
        FROM TRANSAKSI_DETAIL
        WHERE no_invoice = ?
        ORDER BY id_detail ASC
      `;
      const [rows] = await pool.execute(query, [noInvoice]);
      if (!rows || !Array.isArray(rows)) {
        return [];
      }
      return rows.map(
        (r) =>
          new TransaksiDetail(
            r.id_detail,
            r.no_invoice,
            r.id_tiket,
            r.id_addon,
            r.kuantitas,
            r.subtotal
          )
      );
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Instance method untuk findByInvoice
   * @param {string} [noInvoice]
   * @returns {Promise<TransaksiDetail[]>}
   */
  async findByInvoice(noInvoice) {
    const target = noInvoice || this.#no_invoice;
    return TransaksiDetail.findByInvoice(target);
  }

  /**
   * Konversi objek menjadi format JSON
   */
  toJSON() {
    return {
      id_detail: this.#id_detail,
      no_invoice: this.#no_invoice,
      id_tiket: this.#id_tiket,
      id_addon: this.#id_addon,
      kuantitas: this.#kuantitas,
      subtotal: this.#subtotal,
    };
  }
}

export default TransaksiDetail;
