/**
 * ============================================================================
 * MODUL          : Addon Entity (Addon.js)
 * REFERENSI      : DPPL-01 CLS-13 & SKPL KF-05 (Katalog Produk Add-on & Merchandise)
 * PENGEMBANG     : 1. Ariel Ahnaf Kusuma (103112400050) - Logika Inventori Addon
 *                  2. Abisar Fathir (103112400068) - Skema Tabel ADDON
 * DESKRIPSI      : Skeleton class OOP entitas Addon dengan private attributes (#),
 *                  getter/setter, dan signature method pengecekan ketersediaan stok item.
 * ============================================================================
 */

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
    this.#id = id;
    this.#nama_item = nama_item;
    this.#harga = harga;
    this.#stok = stok;
  }

  // --- GETTER & SETTER ---
  get id() {
    return this.#id;
  }

  set id(value) {
    this.#id = value;
  }

  get nama_item() {
    return this.#nama_item;
  }

  set nama_item(value) {
    this.#nama_item = value;
  }

  get harga() {
    return this.#harga;
  }

  set harga(value) {
    this.#harga = value;
  }

  get stok() {
    return this.#stok;
  }

  set stok(value) {
    this.#stok = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Memeriksa ketersediaan stok addon berdasarkan kuantitas yang diminta
   * @param {number} id
   * @param {number} qty
   */
  async checkStok(id, qty) {
    // Method signature kosong sesuai ketentuan skeleton class
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
