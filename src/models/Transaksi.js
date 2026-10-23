/**
 * ============================================================================
 * MODUL          : Transaksi Entity (Transaksi.js)
 * REFERENSI      : DPPL-01 CLS-02 & SKPL KF-03 (Pencatatan Transaksi Penjualan)
 * PENGEMBANG     : 1. Ariel Ahnaf Kusuma (103112400050) - Logika Bisnis Transaksi
 *                  2. Dimas Ramadhani (103112400065) - Struktur Data Invoice & Struk
 * DESKRIPSI      : Skeleton class OOP entitas Transaksi dengan private attributes (#),
 *                  getter/setter, dan signature method saveTransaction serta updateStatus.
 * ============================================================================
 */

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
    this.#no_invoice = no_invoice;
    this.#waktu_transaksi = waktu_transaksi;
    this.#id_pengguna = id_pengguna;
    this.#kode_promo = kode_promo;
    this.#nama_pemesan = nama_pemesan;
    this.#email_pemesan = email_pemesan;
    this.#no_telp_pemesan = no_telp_pemesan;
    this.#metode_pembayaran = metode_pembayaran;
    this.#status_transaksi = status_transaksi;
    this.#total_bayar = total_bayar;
    this.#nominal_kembalian = nominal_kembalian;
  }

  // --- GETTER & SETTER ---
  get no_invoice() {
    return this.#no_invoice;
  }

  set no_invoice(value) {
    this.#no_invoice = value;
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
    this.#id_pengguna = value;
  }

  get kode_promo() {
    return this.#kode_promo;
  }

  set kode_promo(value) {
    this.#kode_promo = value;
  }

  get nama_pemesan() {
    return this.#nama_pemesan;
  }

  set nama_pemesan(value) {
    this.#nama_pemesan = value;
  }

  get email_pemesan() {
    return this.#email_pemesan;
  }

  set email_pemesan(value) {
    this.#email_pemesan = value;
  }

  get no_telp_pemesan() {
    return this.#no_telp_pemesan;
  }

  set no_telp_pemesan(value) {
    this.#no_telp_pemesan = value;
  }

  get metode_pembayaran() {
    return this.#metode_pembayaran;
  }

  set metode_pembayaran(value) {
    this.#metode_pembayaran = value;
  }

  get status_transaksi() {
    return this.#status_transaksi;
  }

  set status_transaksi(value) {
    this.#status_transaksi = value;
  }

  get total_bayar() {
    return this.#total_bayar;
  }

  set total_bayar(value) {
    this.#total_bayar = value;
  }

  get nominal_kembalian() {
    return this.#nominal_kembalian;
  }

  set nominal_kembalian(value) {
    this.#nominal_kembalian = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Menyimpan data transaksi ke tabel TRANSAKSI
   */
  async saveTransaction() {
    // Method signature kosong sesuai ketentuan skeleton class
  }

  /**
   * Memperbarui status transaksi (PENDING -> PAID / EXPIRED)
   * @param {string} newStatus
   */
  async updateStatus(newStatus) {
    // Method signature kosong sesuai ketentuan skeleton class
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
