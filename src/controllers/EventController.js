/**
 * ============================================================================
 * MODUL          : Event Controller (EventController.js)
 * REFERENSI      : DPPL-01 CLS-12 / SKPL KF-08
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Controller untuk manajemen master tier tiket, kuota acara,
 *                  dan verifikasi ketersediaan kuota tiket stand-up comedy.
 * ============================================================================
 */

import { Tiket } from '@/models/Tiket';

export class EventController {
  #ticketModel;

  /**
   * Konstruktor EventController dengan Dependency Injection
   * @param {Tiket} [ticketModel=new Tiket()]
   */
  constructor(ticketModel = new Tiket()) {
    this.#ticketModel = ticketModel;
  }

  // --- GETTER & SETTER ---
  get ticketModel() {
    return this.#ticketModel;
  }

  set ticketModel(value) {
    this.#ticketModel = value;
  }

  // --- BUSINESS LOGIC METHODS ---

  /**
   * Mengambil seluruh daftar kategori/tier tiket
   * @returns {Promise<Tiket[]>}
   */
  async getAllTiers() {
    return this.#ticketModel.findAll();
  }

  /**
   * Alias getTickets sesuai spesifikasi antarmuka
   * @returns {Promise<Tiket[]>}
   */
  async getTickets() {
    return this.getAllTiers();
  }

  /**
   * Memeriksa ketersediaan kuota untuk tier tiket tertentu
   * @param {number} tierId
   * @param {number} [qty=1]
   * @returns {Promise<boolean>}
   */
  async checkAvailability(tierId, qty = 1) {
    if (!tierId) return false;
    return this.#ticketModel.checkQuota(Number(tierId), Number(qty) || 1);
  }

  /**
   * Menyimpan atau memperbarui alokasi kuota tier tiket acara
   * Mendukung input objek data konfigurasi maupun object kosong
   * @param {object} data - { tierId, sisa_kuota } atau { tierId, quota }
   * @returns {Promise<boolean>}
   */
  async saveEventData(data) {
    if (!data || Object.keys(data).length === 0) {
      return true;
    }

    const tierId = data.tierId || data.id;
    const newQuota =
      data.sisa_kuota !== undefined
        ? data.sisa_kuota
        : data.quota !== undefined
        ? data.quota
        : data.qty;

    if (tierId !== undefined && newQuota !== undefined) {
      if (Number(newQuota) < 0) {
        throw new Error('Alokasi kuota tiket tidak boleh bernilai negatif.');
      }
      return this.#ticketModel.updateQuota(Number(tierId), Number(newQuota));
    }

    return true;
  }

  /**
   * Memperbarui kuota tiket berdasarkan tierId dan nilai kuota baru
   * @param {number} tierId
   * @param {number} qty
   * @returns {Promise<boolean>}
   */
  async updateQuota(tierId, qty) {
    if (tierId === undefined || qty === undefined) {
      throw new Error('Parameter tierId dan kuota wajib diisi.');
    }
    if (Number(qty) < 0) {
      throw new Error('Alokasi kuota tiket tidak boleh bernilai negatif.');
    }
    return this.#ticketModel.updateQuota(Number(tierId), Number(qty));
  }
}

export default EventController;
