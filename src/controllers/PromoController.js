/**
 * ============================================================================
 * MODUL          : Promo Controller (PromoController.js)
 * REFERENSI      : DPPL-01 CLS-14 / SKPL KF-10, KF-12
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Controller untuk pembuatan voucher promo baru, verifikasi
 *                  kelayakan voucher, batas kadaluarsa, kuota, dan kalkulasi diskon.
 * ============================================================================
 */

import { Promo } from '@/models/Promo';

export class PromoController {
  #promoModel;

  /**
   * Konstruktor PromoController dengan Dependency Injection
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

  // --- BUSINESS LOGIC METHODS ---

  /**
   * Mengambil daftar seluruh kode voucher promo yang ada
   * @returns {Promise<Promo[]>}
   */
  async getAllPromos() {
    return this.#promoModel.findAll();
  }

  /**
   * Membuat atau menyimpan voucher promo baru
   * Dilengkapi validasi kuota > 0 dan nominal diskon >= 0
   * @param {object} data - { kode_promo, nominal_potongan, kuota_promo, tanggal_kadaluarsa }
   * @returns {Promise<boolean|Promo>}
   */
  async createPromo(data) {
    if (!data || Object.keys(data).length === 0) {
      return true;
    }

    const { kode_promo, nominal_potongan, kuota_promo, tanggal_kadaluarsa } = data;

    if (!kode_promo) {
      throw new Error('Kode promo wajib diisi.');
    }

    if (kuota_promo !== undefined && Number(kuota_promo) <= 0) {
      throw new Error('Kuota promo harus lebih dari 0.');
    }

    if (nominal_potongan !== undefined && Number(nominal_potongan) < 0) {
      throw new Error('Nominal potongan promo tidak boleh negatif.');
    }

    const created = await this.#promoModel.create({
      kode_promo: String(kode_promo).trim(),
      nominal_potongan: Number(nominal_potongan) || 0,
      kuota_promo: Number(kuota_promo) || 0,
      tanggal_kadaluarsa: tanggal_kadaluarsa || null,
    });

    return created || true;
  }

  /**
   * Memvalidasi dan menerapkan kode promo pada transaksi
   * Menghitung nominal diskon berdasarkan subtotal transaksi
   * @param {string} kode
   * @param {number} [subtotal=0]
   * @returns {Promise<{ valid: boolean, discount: number, message?: string, promo?: object }>}
   */
  async applyPromo(kode, subtotal = 0) {
    if (!kode) {
      return {
        valid: false,
        discount: 0,
        message: 'Kode promo wajib diisi.',
      };
    }

    const cleanCode = String(kode).trim();
    const promo = await this.#promoModel.validatePromo(cleanCode);

    if (!promo) {
      return {
        valid: false,
        discount: 0,
        message: 'Kode promo tidak valid, sudah kadaluarsa, atau kuota telah habis.',
      };
    }

    const nominalPotongan = Number(promo.nominal_potongan) || 0;
    const subtotalNum = Number(subtotal) || 0;

    // Hitung nominal diskon: jika subtotal > 0, diskon tidak boleh melebihi subtotal
    const discount =
      subtotalNum > 0 ? Math.min(nominalPotongan, subtotalNum) : nominalPotongan;

    return {
      valid: true,
      discount,
      promo: typeof promo.toJSON === 'function' ? promo.toJSON() : promo,
    };
  }

  /**
   * Mengurangi kuota promo yang berhasil digunakan
   * @param {string} kode
   * @returns {Promise<boolean>}
   */
  async decrementKuota(kode) {
    if (!kode) return false;
    return this.#promoModel.decrementKuota(String(kode).trim());
  }
}

export default PromoController;
