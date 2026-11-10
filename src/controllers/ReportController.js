/**
 * ============================================================================
 * MODUL          : Report Controller (ReportController.js)
 * REFERENSI      : DPPL-01 CLS-15 / SKPL KF-13
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Controller untuk menghasilkan laporan rekapitulasi penjualan,
 *                  omzet harian, total tiket terjual, dan ringkasan transaksi.
 * ============================================================================
 */

import { Transaksi } from '@/models/Transaksi';

export class ReportController {
  #transactionModel;

  /**
   * Konstruktor ReportController dengan Dependency Injection
   * @param {Transaksi} [transactionModel=new Transaksi()]
   */
  constructor(transactionModel = new Transaksi()) {
    this.#transactionModel = transactionModel;
  }

  // --- GETTER & SETTER ---
  get transactionModel() {
    return this.#transactionModel;
  }

  set transactionModel(value) {
    this.#transactionModel = value;
  }

  // --- BUSINESS LOGIC METHODS ---

  /**
   * Mengambil data agregasi laporan penjualan untuk dashboard administrator:
   * totalRevenue, totalTicketsSold, totalTransactions, dan dailyRevenue
   * @returns {Promise<{ totalRevenue: number, totalTicketsSold: number, totalTransactions: number, dailyRevenue: Array }>}
   */
  async fetchReportData() {
    const summary = await this.#transactionModel.getReportSummary();

    return {
      totalRevenue: Number(summary?.totalRevenue) || 0,
      totalTicketsSold: Number(summary?.totalTicketsSold) || 0,
      totalTransactions: Number(summary?.totalTransactions) || 0,
      dailyRevenue: Array.isArray(summary?.dailyRevenue) ? summary.dailyRevenue : [],
    };
  }
}

export default ReportController;
