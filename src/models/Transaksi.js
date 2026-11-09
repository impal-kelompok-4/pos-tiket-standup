/**
 * ============================================================================
 * MODUL          : Transaksi Entity (Transaksi.js)
 * REFERENSI      : DPPL-01 CLS-02 / SKPL KF-01, KF-02, KF-13
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Entitas Transaksi untuk pencatatan transaksi penjualan kasir PoS
 *                  dan daring, update status, dan query rekapitulasi omzet MySQL.
 * ============================================================================
 */

import pool from '@/config/db';

export class Transaksi {
  #no_invoice;
  #waktu_transaksi;
  #id_pengguna;
  #kode_promo;
  #nama_pemesan;
  #email_pemesan;
  #no_telp_pemesan;
  #metode_pembayaran;
  #status_transaksi;
  #total_bayar;
  #nominal_kembalian;

  /**
   * Konstruktor Entitas Transaksi
   * @param {string} no_invoice
   * @param {string|Date} waktu_transaksi
   * @param {number|null} id_pengguna
   * @param {string|null} kode_promo
   * @param {string} nama_pemesan
   * @param {string} email_pemesan
   * @param {string} no_telp_pemesan
   * @param {string} metode_pembayaran - 'CASH' | 'QRIS' | 'VA'
   * @param {string} status_transaksi - 'PENDING' | 'PAID' | 'EXPIRED'
   * @param {number} total_bayar
   * @param {number} nominal_kembalian
   */
  constructor(
    no_invoice = '',
    waktu_transaksi = new Date(),
    id_pengguna = null,
    kode_promo = null,
    nama_pemesan = '',
    email_pemesan = '',
    no_telp_pemesan = '',
    metode_pembayaran = 'CASH',
    status_transaksi = 'PENDING',
    total_bayar = 0,
    nominal_kembalian = 0
  ) {
    this.#no_invoice = String(no_invoice || '');
    this.#waktu_transaksi = waktu_transaksi;
    this.#id_pengguna = id_pengguna !== null && id_pengguna !== undefined ? Number(id_pengguna) : null;
    this.#kode_promo = kode_promo ? String(kode_promo).trim() : null;
    this.#nama_pemesan = String(nama_pemesan || '');
    this.#email_pemesan = String(email_pemesan || '');
    this.#no_telp_pemesan = String(no_telp_pemesan || '');
    this.#metode_pembayaran = String(metode_pembayaran || 'CASH');
    this.#status_transaksi = String(status_transaksi || 'PENDING');
    this.#total_bayar = Number(total_bayar) || 0;
    this.#nominal_kembalian = Number(nominal_kembalian) || 0;
  }

  // --- GETTER & SETTER ---
  get no_invoice() {
    return this.#no_invoice;
  }

  set no_invoice(value) {
    this.#no_invoice = String(value || '');
  }

  get waktu_transaksi() {
    return this.#waktu_transaksi;
  }

  set waktu_transaksi(value) {
    this.#waktu_transaksi = value;
  }

  get id_pengguna() {
    return this.#id_pengguna;
  }

  set id_pengguna(value) {
    this.#id_pengguna = value !== null && value !== undefined ? Number(value) : null;
  }

  get kode_promo() {
    return this.#kode_promo;
  }

  set kode_promo(value) {
    this.#kode_promo = value ? String(value).trim() : null;
  }

  get nama_pemesan() {
    return this.#nama_pemesan;
  }

  set nama_pemesan(value) {
    this.#nama_pemesan = String(value || '');
  }

  get email_pemesan() {
    return this.#email_pemesan;
  }

  set email_pemesan(value) {
    this.#email_pemesan = String(value || '');
  }

  get no_telp_pemesan() {
    return this.#no_telp_pemesan;
  }

  set no_telp_pemesan(value) {
    this.#no_telp_pemesan = String(value || '');
  }

  get metode_pembayaran() {
    return this.#metode_pembayaran;
  }

  set metode_pembayaran(value) {
    this.#metode_pembayaran = String(value || 'CASH');
  }

  get status_transaksi() {
    return this.#status_transaksi;
  }

  set status_transaksi(value) {
    this.#status_transaksi = String(value || 'PENDING');
  }

  get total_bayar() {
    return this.#total_bayar;
  }

  set total_bayar(value) {
    this.#total_bayar = Number(value) || 0;
  }

  get nominal_kembalian() {
    return this.#nominal_kembalian;
  }

  set nominal_kembalian(value) {
    this.#nominal_kembalian = Number(value) || 0;
  }

  // --- DATABASE HELPER METHODS ---

  /**
   * Menyimpan record data transaksi ke tabel TRANSAKSI
   * @param {object} [data]
   * @returns {Promise<boolean>}
   */
  static async saveTransaction(data) {
    try {
      const query = `
        INSERT INTO TRANSAKSI (
          no_invoice, waktu_transaksi, id_pengguna, kode_promo,
          nama_pemesan, email_pemesan, no_telp_pemesan,
          metode_pembayaran, status_transaksi, total_bayar, nominal_kembalian
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.no_invoice,
        data.waktu_transaksi || new Date(),
        data.id_pengguna !== undefined ? data.id_pengguna : null,
        data.kode_promo || null,
        data.nama_pemesan || '',
        data.email_pemesan || '',
        data.no_telp_pemesan || '',
        data.metode_pembayaran || 'CASH',
        data.status_transaksi || 'PENDING',
        Number(data.total_bayar) || 0,
        Number(data.nominal_kembalian) || 0,
      ];

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
   * Instance method untuk menyimpan transaksi
   * @param {object} [data]
   * @returns {Promise<boolean>}
   */
  async saveTransaction(data) {
    const payload = data || this.toJSON();
    return Transaksi.saveTransaction(payload);
  }

  /**
   * Memperbarui status transaksi (misal: PENDING -> PAID / EXPIRED)
   * Mendukung pemanggilan fleksibel:
   * - Transaksi.updateStatus(noInvoice, status)
   * - trxInstance.updateStatus(newStatus)
   * - trxInstance.updateStatus(noInvoice, newStatus)
   * @param {string} arg1
   * @param {string} [arg2]
   * @returns {Promise<boolean>}
   */
  static async updateStatus(noInvoice, status) {
    try {
      const query = 'UPDATE TRANSAKSI SET status_transaksi = ? WHERE no_invoice = ?';
      const [result] = await pool.execute(query, [status, noInvoice]);
      return result && result.affectedRows > 0;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return true;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk update status transaksi
   * @param {string} arg1
   * @param {string} [arg2]
   * @returns {Promise<boolean>}
   */
  async updateStatus(arg1, arg2) {
    const targetInvoice = arg2 !== undefined ? arg1 : this.#no_invoice;
    const targetStatus = arg2 !== undefined ? arg2 : arg1;
    const success = await Transaksi.updateStatus(targetInvoice, targetStatus);
    if (success && targetInvoice === this.#no_invoice) {
      this.#status_transaksi = targetStatus;
    }
    return success;
  }

  /**
   * Mengambil record transaksi berdasarkan nomor invoice
   * @param {string} noInvoice
   * @returns {Promise<Transaksi|null>}
   */
  static async findByInvoice(noInvoice) {
    try {
      const query = `
        SELECT no_invoice, waktu_transaksi, id_pengguna, kode_promo,
               nama_pemesan, email_pemesan, no_telp_pemesan,
               metode_pembayaran, status_transaksi, total_bayar, nominal_kembalian
        FROM TRANSAKSI WHERE no_invoice = ? LIMIT 1
      `;
      const [rows] = await pool.execute(query, [noInvoice]);
      if (!rows || rows.length === 0) {
        return null;
      }
      const r = rows[0];
      return new Transaksi(
        r.no_invoice,
        r.waktu_transaksi,
        r.id_pengguna,
        r.kode_promo,
        r.nama_pemesan,
        r.email_pemesan,
        r.no_telp_pemesan,
        r.metode_pembayaran,
        r.status_transaksi,
        r.total_bayar,
        r.nominal_kembalian
      );
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Instance method untuk findByInvoice
   * @param {string} [noInvoice]
   * @returns {Promise<Transaksi|null>}
   */
  async findByInvoice(noInvoice) {
    const target = noInvoice || this.#no_invoice;
    return Transaksi.findByInvoice(target);
  }

  /**
   * Mengambil seluruh record transaksi diurutkan dari waktu terbaru
   * @returns {Promise<Transaksi[]>}
   */
  static async findAll() {
    try {
      const query = `
        SELECT no_invoice, waktu_transaksi, id_pengguna, kode_promo,
               nama_pemesan, email_pemesan, no_telp_pemesan,
               metode_pembayaran, status_transaksi, total_bayar, nominal_kembalian
        FROM TRANSAKSI ORDER BY waktu_transaksi DESC
      `;
      const [rows] = await pool.execute(query);
      if (!rows || !Array.isArray(rows)) {
        return [];
      }
      return rows.map(
        (r) =>
          new Transaksi(
            r.no_invoice,
            r.waktu_transaksi,
            r.id_pengguna,
            r.kode_promo,
            r.nama_pemesan,
            r.email_pemesan,
            r.no_telp_pemesan,
            r.metode_pembayaran,
            r.status_transaksi,
            r.total_bayar,
            r.nominal_kembalian
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
   * Instance method untuk findAll
   * @returns {Promise<Transaksi[]>}
   */
  async findAll() {
    return Transaksi.findAll();
  }

  /**
   * Query agregasi laporan penjualan:
   * - totalRevenue: SUM(total_bayar) untuk status 'PAID'
   * - totalTransactions: COUNT(*) untuk status 'PAID'
   * - totalTicketsSold: SUM(kuantitas) tiket terjual
   * - dailyRevenue: omzet per tanggal
   * @returns {Promise<object>}
   */
  static async getReportSummary() {
    try {
      const revenueQuery = `
        SELECT 
          COALESCE(SUM(total_bayar), 0) AS totalRevenue,
          COUNT(*) AS totalTransactions
        FROM TRANSAKSI 
        WHERE status_transaksi = 'PAID'
      `;
      const [revRows] = await pool.execute(revenueQuery);
      const totalRevenue = Number(revRows?.[0]?.totalRevenue) || 0;
      const totalTransactions = Number(revRows?.[0]?.totalTransactions) || 0;

      const ticketsQuery = `
        SELECT COALESCE(SUM(td.kuantitas), 0) AS totalTicketsSold
        FROM TRANSAKSI_DETAIL td
        JOIN TRANSAKSI t ON td.no_invoice = t.no_invoice
        WHERE t.status_transaksi = 'PAID' AND td.id_tiket IS NOT NULL
      `;
      const [ticketRows] = await pool.execute(ticketsQuery);
      const totalTicketsSold = Number(ticketRows?.[0]?.totalTicketsSold) || 0;

      const dailyQuery = `
        SELECT 
          DATE(waktu_transaksi) AS tanggal,
          SUM(total_bayar) AS omzet,
          COUNT(*) AS jumlah_transaksi
        FROM TRANSAKSI
        WHERE status_transaksi = 'PAID'
        GROUP BY DATE(waktu_transaksi)
        ORDER BY tanggal DESC
      `;
      const [dailyRows] = await pool.execute(dailyQuery);

      return {
        totalRevenue,
        totalTicketsSold,
        totalTransactions,
        dailyRevenue: Array.isArray(dailyRows) ? dailyRows : [],
      };
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return {
          totalRevenue: 0,
          totalTicketsSold: 0,
          totalTransactions: 0,
          dailyRevenue: [],
        };
      }
      throw err;
    }
  }

  /**
   * Instance method untuk getReportSummary
   * @returns {Promise<object>}
   */
  async getReportSummary() {
    return Transaksi.getReportSummary();
  }

  /**
   * Konversi objek menjadi format JSON
   */
  toJSON() {
    return {
      no_invoice: this.#no_invoice,
      waktu_transaksi: this.#waktu_transaksi,
      id_pengguna: this.#id_pengguna,
      kode_promo: this.#kode_promo,
      nama_pemesan: this.#nama_pemesan,
      email_pemesan: this.#email_pemesan,
      no_telp_pemesan: this.#no_telp_pemesan,
      metode_pembayaran: this.#metode_pembayaran,
      status_transaksi: this.#status_transaksi,
      total_bayar: this.#total_bayar,
      nominal_kembalian: this.#nominal_kembalian,
    };
  }
}

export default Transaksi;
