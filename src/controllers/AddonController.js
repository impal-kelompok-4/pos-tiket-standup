/**
 * ============================================================================
 * MODUL          : Addon Controller (AddonController.js)
 * REFERENSI      : DPPL-01 CLS-13 & SKPL KF-07 (Manajemen Produk Add-on & Merchandise)
 * PENGEMBANG     : Abisar Fathir (103112400068) - Manajemen Master Addon
 * DESKRIPSI      : Skeleton controller untuk mengelola katalog menu snack, minuman,
 *                  dan merchandise stand-up comedy oleh Administrator.
 * ============================================================================
 */

import { Addon } from '@/models/Addon';

export class AddonController {
  #addonModel;

  /**
   * Konstruktor AddonController
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

  // --- METHOD SIGNATURES ---

  /**
   * Menyimpan atau memperbarui data katalog produk add-on
   * @param {object} data
   * @returns {Promise<boolean>}
   */
  async saveAddon(data) {
    // Signature method: menyimpan item baru ke tabel ADDON
    return true;
  }
}

export default AddonController;
