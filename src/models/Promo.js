/**
 * ============================================================================
 * MODUL          : Promo Entity (Promo.js)
 * REFERENSI      : DPPL-01 CLS-14 & SKPL KF-06 (Manajemen Voucher & Diskon)
 * PENGEMBANG     : 1. Ariel Ahnaf Kusuma (103112400050) - Logika Bisnis Promo
 *                  2. Abisar Fathir (103112400068) - Skema Tabel PROMO
 * DESKRIPSI      : Skeleton class OOP entitas Promo dengan private attributes (#),
 *                  getter/setter, dan signature method validasi kuota promo.
 * ============================================================================
 */

export class Promo {
  #kode_promo;
  #nominal_potongan;
  #kuota_promo;
  #tanggal_kadaluarsa;

  /**
   * Konstruktor Entitas Promo
   * @param {string} kode_promo
   * @param {number} nominal_potongan
   * @param {number} kuota_promo
   * @param {string|Date} tanggal_kadaluarsa
   */
  constructor(kode_promo = '', nominal_potongan = 0, kuota_promo = 0, tanggal_kadaluarsa = '') {
    this.#kode_promo = kode_promo;
    this.#nominal_potongan = nominal_potongan;
    this.#kuota_promo = kuota_promo;
    this.#tanggal_kadaluarsa = tanggal_kadaluarsa;
  }

  // --- GETTER & SETTER ---
  get kode_promo() {
    return this.#kode_promo;
  }

  set kode_promo(value) {
    this.#kode_promo = value;
  }

  get nominal_potongan() {
    return this.#nominal_potongan;
  }

  set nominal_potongan(value) {
    this.#nominal_potongan = value;
  }

  get kuota_promo() {
    return this.#kuota_promo;
  }

  set kuota_promo(value) {
    this.#kuota_promo = value;
  }

  get tanggal_kadaluarsa() {
    return this.#tanggal_kadaluarsa;
  }

  set tanggal_kadaluarsa(value) {
    this.#tanggal_kadaluarsa = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Validasi keaktifan dan sisa kuota kode promo
   * @param {string} kode
   */
  async validatePromo(kode) {
    // Method signature kosong sesuai ketentuan skeleton class
  }

  /**
   * Konversi objek menjadi format JSON
   */
  toJSON() {
    return {
      kode_promo: this.#kode_promo,
      nominal_potongan: this.#nominal_potongan,
      kuota_promo: this.#kuota_promo,
      tanggal_kadaluarsa: this.#tanggal_kadaluarsa,
    };
  }
}

export default Promo;
