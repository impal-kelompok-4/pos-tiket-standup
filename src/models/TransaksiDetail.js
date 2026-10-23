/**
 * ============================================================================
 * MODUL          : TransaksiDetail Entity (TransaksiDetail.js)
 * REFERENSI      : DPPL-01 CLS-03 & SKPL KF-03 (Rincian Item Transaksi Penjualan)
 * PENGEMBANG     : 1. Ariel Ahnaf Kusuma (103112400050) - Kalkulasi Detail Item
 *                  2. Dimas Ramadhani (103112400065) - Relasi Data Detail Transaksi
 * DESKRIPSI      : Skeleton class OOP entitas TransaksiDetail dengan private attributes (#),
 *                  getter/setter, dan signature method kalkulasi subtotal.
 * ============================================================================
 */

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
    this.#id_detail = id_detail;
    this.#no_invoice = no_invoice;
    this.#id_tiket = id_tiket;
    this.#id_addon = id_addon;
    this.#kuantitas = kuantitas;
    this.#subtotal = subtotal;
  }

  // --- GETTER & SETTER ---
  get id_detail() {
    return this.#id_detail;
  }

  set id_detail(value) {
    this.#id_detail = value;
  }

  get no_invoice() {
    return this.#no_invoice;
  }

  set no_invoice(value) {
    this.#no_invoice = value;
  }

  get id_tiket() {
    return this.#id_tiket;
  }

  set id_tiket(value) {
    this.#id_tiket = value;
  }

  get id_addon() {
    return this.#id_addon;
  }

  set id_addon(value) {
    this.#id_addon = value;
  }

  get kuantitas() {
    return this.#kuantitas;
  }

  set kuantitas(value) {
    this.#kuantitas = value;
  }

  get subtotal() {
    return this.#subtotal;
  }

  set subtotal(value) {
    this.#subtotal = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Menghitung subtotal rincian item berdasarkan harga dan kuantitas
   */
  calculateSubtotal() {
    // Method signature kosong sesuai ketentuan skeleton class
  }

  /**
   * Menyimpan baris rincian transaksi ke basis data
   */
  async saveDetail() {
    // Method signature kosong sesuai ketentuan skeleton class
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
