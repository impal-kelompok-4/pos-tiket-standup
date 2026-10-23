/**
 * ============================================================================
 * MODUL          : Order Controller (OrderController.js)
 * REFERENSI      : DPPL-01 CLS-09 & SKPL KF-09, KF-10 (Pemesanan Online Self-Service)
 * PENGEMBANG     : Ariel Ahnaf Kusuma (103112400050) - Logika Pemesanan Online
 * DESKRIPSI      : Skeleton controller untuk mengelola proses pemesanan tiket
 *                  secara mandiri oleh penonton pada portal Storefront.
 * ============================================================================
 */

import { Tiket } from '@/models/Tiket';
import { Transaksi } from '@/models/Transaksi';

export class OrderController {
  #ticketModel;
  #transactionModel;

  /**
   * Konstruktor OrderController
   * @param {Tiket} [ticketModel=new Tiket()]
   * @param {Transaksi} [transactionModel=new Transaksi()]
   */
  constructor(ticketModel = new Tiket(), transactionModel = new Transaksi()) {
    this.#ticketModel = ticketModel;
    this.#transactionModel = transactionModel;
  }

  // --- GETTER & SETTER ---
  get ticketModel() {
    return this.#ticketModel;
  }

  set ticketModel(value) {
    this.#ticketModel = value;
  }

  get transactionModel() {
    return this.#transactionModel;
  }

  set transactionModel(value) {
    this.#transactionModel = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Menambahkan tiket yang dipilih ke dalam keranjang belanja online
   * @param {number} ticketId
   * @param {number} qty
   * @returns {Promise<boolean>}
   */
  async addToCart(ticketId, qty) {
    // Signature method: memvalidasi sisa kuota tiket sebelum memasukkan ke keranjang
    return true;
  }
}

export default OrderController;
