/**
 * ============================================================================
 * MODUL          : Payment Controller (PaymentController.js)
 * REFERENSI      : DPPL-01 CLS-11 / SKPL KF-02, KF-05
 * PENGEMBANG     : Ariel Ahnaf Kusuma (103112400050)
 * DESKRIPSI      : Controller untuk validasi pembayaran tunai kasir, kalkulasi
 *                  uang kembalian, inisiasi gateway pembayaran online (QRIS/VA),
 *                  serta penanganan callback webhook status pembayaran.
 * ============================================================================
 */

import { Transaksi } from '@/models/Transaksi';

export class PaymentController {
  #transactionModel;

  /**
   * Konstruktor PaymentController dengan Dependency Injection
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
   * Memvalidasi pembayaran tunai dan menghitung kembalian transaksi
   * @param {number} totalBayar
   * @param {number} cashAmount
   * @returns {object}
   */
  validateCashPayment(totalBayar, cashAmount) {
    const total = Number(totalBayar) || 0;
    const cash = Number(cashAmount) || 0;

    if (cash < total) {
      return {
        isValid: false,
        change: 0,
        shortfall: total - cash,
        message: 'Nominal pembayaran tunai kurang.',
      };
    }

    return {
      isValid: true,
      change: cash - total,
      shortfall: 0,
      message: 'Pembayaran tunai mencukupi.',
    };
  }

  /**
   * Menginisiasi pembayaran online dan membuat simulasi payment gateway
   * @param {string} [noInvoice='TRX-TEMP']
   * @param {string} [method='QRIS'] - 'QRIS' | 'VA'
   * @returns {Promise<object>}
   */
  async initiatePayment(noInvoice = 'TRX-TEMP', method = 'QRIS') {
    const invoice = String(noInvoice || 'TRX-TEMP');
    const paymentMethod = String(method || 'QRIS').toUpperCase();

    const result = {
      paymentUrl: `https://payment-simulator.local/pay/${invoice}`,
      status: 'PENDING',
      noInvoice: invoice,
      method: paymentMethod,
    };

    if (paymentMethod === 'VA') {
      result.vaNumber = `8801${Date.now()}`;
    } else {
      result.qrString = `00020101021226540014ID.LINKAJA.WWW01189360099900000000010215${Date.now()}`;
    }

    return result;
  }

  /**
   * Menangani notifikasi webhook callback status transaksi dari gateway
   * @param {string} arg1 - noInvoice atau status (pada pemanggilan single parameter)
   * @param {string} [arg2] - status ('PAID' | 'EXPIRED') jika 2 parameter disertakan
   * @returns {Promise<boolean|object>}
   */
  async webhookNotification(arg1, arg2) {
    let noInvoice;
    let status;
    let isLegacyCall = false;

    if (arg2 === undefined) {
      // Menangani kompatibilitas pemanggilan signature awal webhookNotification(status)
      status = String(arg1 || 'PAID').toUpperCase();
      noInvoice = 'TRX-TEMP';
      isLegacyCall = true;
    } else {
      noInvoice = String(arg1);
      status = String(arg2).toUpperCase();
    }

    await this.#transactionModel.updateStatus(noInvoice, status);

    if (isLegacyCall) {
      return true;
    }

    return {
      success: true,
      status,
      noInvoice,
      message: `Status transaksi ${noInvoice} berhasil diperbarui menjadi ${status}.`,
    };
  }
}

export default PaymentController;
