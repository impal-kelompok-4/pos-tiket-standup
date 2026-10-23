/**
 * ============================================================================
 * MODUL          : Promo Controller (PromoController.js)
 * REFERENSI      : DPPL-01 CLS-14 & SKPL KF-04 (Manajemen & Penerapan Kode Promo)
 * PENGEMBANG     : Abisar Fathir (103112400068) - Manajemen Master Promo & Validasi Diskon
 * DESKRIPSI      : Skeleton controller untuk mengelola pembuatan kode promo baru
 *                  serta validasi kelayakan kode diskon pada kasir maupun checkout.
 * ============================================================================
 */

import { Promo } from '@/models/Promo';

export class PromoController {
  #promoModel;

  /**
   * Konstruktor PromoController
   * @param {Promo} [promoModel=new Promo()]
   */
  constructor(promoModel = new Promo()) {
    this.#promoModel = promoModel;
  }

  // --- GETTER & SETTER ---
  get promoModel() {
    return this.#promoModel;
  }

  set promoModel(value) {
    this.#promoModel = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Membuat atau menyimpan voucher promo baru
   * @param {object} data
   * @returns {Promise<boolean>}
   */
  async createPromo(data) {
    // Signature method: menyimpan voucher baru ke tabel PROMO
    return true;
  }

  /**
   * Memvalidasi dan menerapkan kode promo pada transaksi
   * @param {string} kode
   * @returns {Promise<object>}
   */
  async applyPromo(kode) {
    // Signature method: validasi tanggal kadaluarsa dan sisa kuota promo
    return {
      valid: true,
      discount: 0,
    };
  }
}

export default PromoController;
