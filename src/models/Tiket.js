/**
 * ============================================================================
 * MODUL          : Tiket Entity (Tiket.js)
 * REFERENSI      : DPPL-01 CLS-04 & SKPL KF-02 (Manajemen Kategori & Kuota Tiket)
 * PENGEMBANG     : 1. Ariel Ahnaf Kusuma (103112400050) - Logika Kuota Tiket
 *                  2. Abisar Fathir (103112400068) - Skema Tabel TIKET
 * DESKRIPSI      : Skeleton class OOP entitas Tiket dengan private attributes (#),
 *                  getter/setter, dan signature method pengecekan ketersediaan kuota.
 * ============================================================================
 */

export class Tiket {
  #id;
  #tier;
  #harga;
  #sisa_kuota;

  /**
   * Konstruktor Entitas Tiket
   * @param {number|null} id
   * @param {string} tier - Contoh: 'Early Bird', 'Batch 1', 'VIP'
   * @param {number} harga
   * @param {number} sisa_kuota
   */
  constructor(id = null, tier = '', harga = 0, sisa_kuota = 0) {
    this.#id = id;
    this.#tier = tier;
    this.#harga = harga;
    this.#sisa_kuota = sisa_kuota;
  }

  // --- GETTER & SETTER ---
  get id() {
    return this.#id;
  }

  set id(value) {
    this.#id = value;
  }

  get tier() {
    return this.#tier;
  }

  set tier(value) {
    this.#tier = value;
  }

  get harga() {
    return this.#harga;
  }

  set harga(value) {
    this.#harga = value;
  }

  get sisa_kuota() {
    return this.#sisa_kuota;
  }

  set sisa_kuota(value) {
    this.#sisa_kuota = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Memeriksa apakah kuota tiket masih mencukupi untuk jumlah pembelian tertentu
   * @param {number} tierId
   * @param {number} qty
   */
  async checkQuota(tierId, qty) {
    // Method signature kosong sesuai ketentuan skeleton class
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
