/**
 * ============================================================================
 * MODUL          : Addon Controller (AddonController.js)
 * REFERENSI      : DPPL-01 CLS-13 / SKPL KF-09
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Controller untuk mengelola katalog menu snack, minuman,
 *                  dan merchandise serta stok item oleh Administrator.
 * ============================================================================
 */

import { Addon } from '@/models/Addon';

export class AddonController {
  #addonModel;

  /**
   * Konstruktor AddonController dengan Dependency Injection
   * @param {Addon} [addonModel=new Addon()]
   */
  constructor(addonModel = new Addon()) {
    this.#addonModel = addonModel;
  }

  // --- GETTER & SETTER ---
  get addonModel() {
    return this.#addonModel;
  }

  set addonModel(value) {
    this.#addonModel = value;
  }

  // --- BUSINESS LOGIC METHODS ---

  /**
   * Mengambil daftar seluruh produk katalog add-on
   * @returns {Promise<Addon[]>}
   */
  async getAddons() {
    return this.#addonModel.findAll();
  }

  /**
   * Memeriksa ketersediaan stok add-on
   * @param {number} id
   * @param {number} [qty=1]
   * @returns {Promise<boolean>}
   */
  async checkStock(id, qty = 1) {
    if (!id) return false;
    return this.#addonModel.checkStok(Number(id), Number(qty) || 1);
  }

  /**
   * Menyimpan produk add-on baru dengan validasi harga & stok >= 0
   * @param {object} data - { nama_item, harga, stok }
   * @returns {Promise<boolean|Addon>}
   */
  async saveAddon(data) {
    if (!data || Object.keys(data).length === 0) {
      return true;
    }

    const { nama_item, harga, stok } = data;

    if (harga !== undefined && Number(harga) < 0) {
      throw new Error('Harga produk tidak boleh bernilai negatif.');
    }

    if (stok !== undefined && Number(stok) < 0) {
      throw new Error('Stok produk tidak boleh bernilai negatif.');
    }

    if (!nama_item) {
      throw new Error('Nama item add-on wajib diisi.');
    }

    const created = await this.#addonModel.create({
      nama_item: String(nama_item).trim(),
      harga: Number(harga) || 0,
      stok: Number(stok) || 0,
    });

    return created || true;
  }

  /**
   * Memperbarui stok add-on
   * @param {number} id
   * @param {number} qty
   * @returns {Promise<boolean>}
   */
  async updateStock(id, qty) {
    if (id === undefined || qty === undefined) {
      throw new Error('ID addon dan kuantitas stok wajib diisi.');
    }
    if (Number(qty) < 0) {
      throw new Error('Stok produk tidak boleh bernilai negatif.');
    }
    return this.#addonModel.updateStok(Number(id), Number(qty));
  }
}

export default AddonController;
