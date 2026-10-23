/**
 * ============================================================================
 * MODUL          : Transaction Controller (TransactionController.js)
 * REFERENSI      : DPPL-01 CLS-08 & SKPL KF-01, KF-02 (Manajemen Transaksi Kasir PoS)
 * PENGEMBANG     : Ariel Ahnaf Kusuma (103112400050) - Logika Bisnis Kasir PoS
 * DESKRIPSI      : Skeleton controller untuk mengelola alur transaksi kasir PoS,
 *                  menambahkan item tiket ke keranjang, dan memproses pembayaran.
 * ============================================================================
 */

import { Transaksi } from '@/models/Transaksi';
import { Tiket } from '@/models/Tiket';

export class TransactionController {
  #transactionModel;
  #ticketModel;

  /**
   * Konstruktor TransactionController
   * @param {Transaksi} [transactionModel=new Transaksi()]
   * @param {Tiket} [ticketModel=new Tiket()]
   */
  constructor(transactionModel = new Transaksi(), ticketModel = new Tiket()) {
    this.#transactionModel = transactionModel;
    this.#ticketModel = ticketModel;
  }

  // --- GETTER & SETTER ---
  get transactionModel() {
    return this.#transactionModel;
  }

  set transactionModel(value) {
    this.#transactionModel = value;
  }

  get ticketModel() {
    return this.#ticketModel;
  }

  set ticketModel(value) {
    this.#ticketModel = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Menambahkan item tiket ke dalam daftar transaksi kasir
   * @param {number} ticketId
   * @param {number} qty
   * @returns {Promise<boolean>}
   */
  async addItem(ticketId, qty) {
    // Signature method: akan memvalidasi kuota via ticketModel dan menambah detail item
    return true;
  }

  /**
   * Memproses pembayaran tunai dan menghitung kembalian transaksi
   * @param {number} cashAmount
   * @returns {Promise<object>}
   */
  async processPayment(cashAmount) {
    // Signature method: akan memvalidasi kecukupan uang tunai dan menyimpan transaksi
    return {
      success: true,
      change: 0,
    };
  }
}

export default TransactionController;
