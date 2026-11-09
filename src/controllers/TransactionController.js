/**
 * ============================================================================
 * MODUL          : Transaction Controller (TransactionController.js)
 * REFERENSI      : DPPL-01 CLS-09 / SKPL KF-01, KF-02
 * PENGEMBANG     : Ariel Ahnaf Kusuma (103112400050)
 * DESKRIPSI      : Controller untuk manajemen transaksi kasir PoS dan pemesanan
 *                  tiket, kalkulasi subtotal, diskon promo, proses pembayaran
 *                  tunai, penerbitan e-tiket QR, serta riwayat transaksi.
 * ============================================================================
 */

import crypto from 'crypto';
import { Transaksi } from '@/models/Transaksi';
import { Tiket } from '@/models/Tiket';
import { Addon } from '@/models/Addon';
import { Promo } from '@/models/Promo';
import { TransaksiDetail } from '@/models/TransaksiDetail';
import { TiketItem } from '@/models/TiketItem';

export class TransactionController {
  #transactionModel;
  #ticketModel;
  #addonModel;
  #promoModel;
  #detailModel;
  #tiketItemModel;
  #items;
  #activePromo;

  /**
   * Konstruktor TransactionController dengan Dependency Injection
   * @param {Transaksi} [transactionModel=new Transaksi()]
   * @param {Tiket} [ticketModel=new Tiket()]
   * @param {Addon} [addonModel=new Addon()]
   * @param {Promo} [promoModel=new Promo()]
   * @param {TransaksiDetail} [detailModel=new TransaksiDetail()]
   * @param {TiketItem} [tiketItemModel=new TiketItem()]
   */
  constructor(
    transactionModel = new Transaksi(),
    ticketModel = new Tiket(),
    addonModel = new Addon(),
    promoModel = new Promo(),
    detailModel = new TransaksiDetail(),
    tiketItemModel = new TiketItem()
  ) {
    this.#transactionModel = transactionModel;
    this.#ticketModel = ticketModel;
    this.#addonModel = addonModel;
    this.#promoModel = promoModel;
    this.#detailModel = detailModel;
    this.#tiketItemModel = tiketItemModel;
    this.#items = [];
    this.#activePromo = null;
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

  get addonModel() {
    return this.#addonModel;
  }

  set addonModel(value) {
    this.#addonModel = value;
  }

  get promoModel() {
    return this.#promoModel;
  }

  set promoModel(value) {
    this.#promoModel = value;
  }

  get detailModel() {
    return this.#detailModel;
  }

  set detailModel(value) {
    this.#detailModel = value;
  }

  get tiketItemModel() {
    return this.#tiketItemModel;
  }

  set tiketItemModel(value) {
    this.#tiketItemModel = value;
  }

  get items() {
    return [...this.#items];
  }

  getItems() {
    return [...this.#items];
  }

  get activePromo() {
    return this.#activePromo;
  }

  // --- BUSINESS LOGIC METHODS ---

  /**
   * Menambahkan item tiket ke dalam daftar transaksi kasir
   * @param {number} ticketId
   * @param {number} [qty=1]
   * @returns {Promise<boolean>}
   */
  async addItem(ticketId, qty = 1) {
    const quantity = Number(qty);
    if (quantity <= 0) {
      return false;
    }

    const hasQuota = await this.#ticketModel.checkQuota(ticketId, quantity);
    if (!hasQuota) {
      return false;
    }

    let ticket = await this.#ticketModel.findById(ticketId);
    if (!ticket) {
      const allTickets = await this.#ticketModel.findAll();
      ticket = allTickets.find((t) => Number(t.id) === Number(ticketId));
    }

    const price = ticket ? Number(ticket.harga) : 50000;
    const tier = ticket ? ticket.tier : 'Tiket Standard';

    const existing = this.#items.find(
      (item) => item.type === 'ticket' && Number(item.id) === Number(ticketId)
    );

    if (existing) {
      existing.qty += quantity;
    } else {
      this.#items.push({
        type: 'ticket',
        id: Number(ticketId),
        name: tier,
        price,
        qty: quantity,
      });
    }

    return true;
  }

  /**
   * Menambahkan katalog add-on ke dalam transaksi kasir
   * @param {number} addonId
   * @param {number} [qty=1]
   * @returns {Promise<boolean>}
   */
  async addAddon(addonId, qty = 1) {
    const quantity = Number(qty);
    if (quantity <= 0) {
      return false;
    }

    const hasStock = await this.#addonModel.checkStok(addonId, quantity);
    if (!hasStock) {
      return false;
    }

    let addon = await this.#addonModel.findById(addonId);
    if (!addon) {
      const allAddons = await this.#addonModel.findAll();
      addon = allAddons.find((a) => Number(a.id) === Number(addonId));
    }

    const price = addon ? Number(addon.harga) : 15000;
    const name = addon ? addon.nama_item : 'Addon Item';

    const existing = this.#items.find(
      (item) => item.type === 'addon' && Number(item.id) === Number(addonId)
    );

    if (existing) {
      existing.qty += quantity;
    } else {
      this.#items.push({
        type: 'addon',
        id: Number(addonId),
        name,
        price,
        qty: quantity,
      });
    }

    return true;
  }

  /**
   * Menghitung subtotal dari seluruh tiket dan add-on yang dipilih
   * @returns {number}
   */
  calculateSubtotal() {
    return this.#items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.qty),
      0
    );
  }

  /**
   * Mengintegrasikan validasi promo dan kalkulasi potongan harga
   * @param {string} promoCode
   * @returns {Promise<object>}
   */
  async applyPromo(promoCode) {
    if (!promoCode || String(promoCode).trim() === '') {
      return {
        valid: false,
        discount: 0,
        message: 'Kode promo tidak boleh kosong.',
      };
    }

    const promo = await this.#promoModel.validatePromo(promoCode);
    if (!promo) {
      return {
        valid: false,
        discount: 0,
        message: 'Kode promo tidak valid atau kuota promo telah habis.',
      };
    }

    const subtotal = this.calculateSubtotal();
    const discount = Math.min(subtotal, Number(promo.nominal_potongan));
    this.#activePromo = promo;

    return {
      valid: true,
      discount,
      promoCode: promo.kode_promo,
      nominal_potongan: Number(promo.nominal_potongan),
    };
  }

  /**
   * Memproses pembayaran tunai dan menyelesaikan transaksi penjualan kasir
   * @param {number} cashAmount
   * @param {object} [customerData={}]
   * @returns {Promise<object>}
   */
  async processPayment(cashAmount, customerData = {}) {
    if (this.getItems().length === 0) {
      return {
        success: false,
        message: 'Keranjang transaksi kosong',
      };
    }

    const subtotal = this.calculateSubtotal();
    const discount = this.#activePromo
      ? Math.min(subtotal, Number(this.#activePromo.nominal_potongan))
      : 0;
    const totalBayar = Math.max(0, subtotal - discount);
    const cash = Number(cashAmount) || 0;

    if (cash < totalBayar) {
      return {
        success: false,
        message: 'Nominal pembayaran tunai kurang.',
        totalBayar,
        cashAmount: cash,
        shortfall: totalBayar - cash,
      };
    }

    const kembalian = cash - totalBayar;
    const invoiceNo =
      customerData.no_invoice ||
      `TRX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const nama_pemesan = customerData.nama_pemesan || 'Customer Kasir';
    const email_pemesan = customerData.email_pemesan || 'kasir@standupcomedy.id';
    const no_telp_pemesan = customerData.no_telp_pemesan || '08123456789';
    const id_pengguna =
      customerData.id_pengguna !== undefined ? customerData.id_pengguna : null;
    const kode_promo = this.#activePromo ? this.#activePromo.kode_promo : null;

    // Simpan ke tabel TRANSAKSI
    await this.#transactionModel.saveTransaction({
      no_invoice: invoiceNo,
      waktu_transaksi: new Date(),
      id_pengguna,
      kode_promo,
      nama_pemesan,
      email_pemesan,
      no_telp_pemesan,
      metode_pembayaran: 'CASH',
      status_transaksi: 'PAID',
      total_bayar: totalBayar,
      nominal_kembalian: kembalian,
    });

    const ticketsIssued = [];

    // Simpan ke tabel TRANSAKSI_DETAIL dan terbitkan TIKET_ITEM
    for (const item of this.#items) {
      const itemSubtotal = Number(item.price) * Number(item.qty);
      const detailPayload = {
        no_invoice: invoiceNo,
        id_tiket: item.type === 'ticket' ? item.id : null,
        id_addon: item.type === 'addon' ? item.id : null,
        kuantitas: item.qty,
        subtotal: itemSubtotal,
      };

      const savedDetail = await this.#detailModel.saveDetail(detailPayload);
      const idDetail = savedDetail?.id_detail || 1;

      if (item.type === 'ticket') {
        await this.#ticketModel.decrementQuota(item.id, item.qty);

        for (let i = 0; i < item.qty; i++) {
          const kodeTiket = `TKT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
          const qrHash = `QRHASH-${crypto
            .createHash('sha256')
            .update(`${invoiceNo}-${kodeTiket}-${i}`)
            .digest('hex')
            .slice(0, 24)}`;

          await this.#tiketItemModel.create({
            kode_tiket: kodeTiket,
            id_detail: idDetail,
            qr_code_hash: qrHash,
            status_kehadiran: 'Belum Hadir',
            waktu_checkin: null,
          });

          ticketsIssued.push({
            kode_tiket: kodeTiket,
            qr_code_hash: qrHash,
            tierId: item.id,
          });
        }
      } else if (item.type === 'addon') {
        await this.#addonModel.decrementStok(item.id, item.qty);
      }
    }

    // Kurangi kuota promo jika digunakan
    if (this.#activePromo) {
      await this.#promoModel.decrementKuota(this.#activePromo.kode_promo);
    }

    const processedItems = [...this.#items];
    this.#items = [];
    this.#activePromo = null;

    return {
      success: true,
      noInvoice: invoiceNo,
      totalBayar,
      change: kembalian,
      tickets: ticketsIssued,
      items: processedItems,
    };
  }

  /**
   * Alias eksplisit untuk proses pembayaran tunai kasir
   * @param {number} cashAmount
   * @param {object} [customerData={}]
   * @returns {Promise<object>}
   */
  async processCashPayment(cashAmount, customerData = {}) {
    return this.processPayment(cashAmount, customerData);
  }

  /**
   * Membuat transaksi daring baru dengan status PENDING
   * @param {object} orderData
   * @returns {Promise<object>}
   */
  async createPendingTransaction(orderData) {
    const invoiceNo =
      orderData.no_invoice ||
      `TRX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const items = orderData.items || [];
    let subtotal = 0;

    for (const item of items) {
      let unitPrice = Number(item.price) || 0;
      if (!unitPrice) {
        if (item.type === 'ticket') {
          const t = await this.#ticketModel.findById(item.id);
          unitPrice = t ? Number(t.harga) : 50000;
        } else {
          const a = await this.#addonModel.findById(item.id);
          unitPrice = a ? Number(a.harga) : 15000;
        }
      }
      subtotal += unitPrice * (Number(item.qty) || 1);
    }

    let discount = 0;
    let promoCodeUsed = null;
    if (orderData.promoCode) {
      const promo = await this.#promoModel.validatePromo(orderData.promoCode);
      if (promo) {
        discount = Math.min(subtotal, Number(promo.nominal_potongan));
        promoCodeUsed = promo.kode_promo;
      }
    }

    const totalBayar = Math.max(0, subtotal - discount);

    await this.#transactionModel.saveTransaction({
      no_invoice: invoiceNo,
      waktu_transaksi: new Date(),
      id_pengguna: orderData.id_pengguna || null,
      kode_promo: promoCodeUsed,
      nama_pemesan: orderData.nama_pemesan || 'Pelanggan Online',
      email_pemesan: orderData.email_pemesan || 'online@standupcomedy.id',
      no_telp_pemesan: orderData.no_telp_pemesan || '081234567890',
      metode_pembayaran: orderData.metode_pembayaran || 'QRIS',
      status_transaksi: 'PENDING',
      total_bayar: totalBayar,
      nominal_kembalian: 0,
    });

    for (const item of items) {
      let unitPrice = Number(item.price) || 0;
      const qty = Number(item.qty) || 1;
      if (!unitPrice) {
        if (item.type === 'ticket') {
          const t = await this.#ticketModel.findById(item.id);
          unitPrice = t ? Number(t.harga) : 50000;
        } else {
          const a = await this.#addonModel.findById(item.id);
          unitPrice = a ? Number(a.harga) : 15000;
        }
      }

      await this.#detailModel.saveDetail({
        no_invoice: invoiceNo,
        id_tiket: item.type === 'ticket' ? item.id : null,
        id_addon: item.type === 'addon' ? item.id : null,
        kuantitas: qty,
        subtotal: unitPrice * qty,
      });

      if (item.type === 'ticket') {
        await this.#ticketModel.decrementQuota(item.id, qty);
      } else if (item.type === 'addon') {
        await this.#addonModel.decrementStok(item.id, qty);
      }
    }

    return {
      success: true,
      noInvoice: invoiceNo,
      totalBayar,
      status: 'PENDING',
    };
  }

  /**
   * Mengambil riwayat seluruh transaksi
   * @returns {Promise<Transaksi[]>}
   */
  async getAllTransactions() {
    return this.#transactionModel.findAll();
  }

  /**
   * Mengambil detail transaksi berdasarkan nomor invoice
   * @param {string} invoiceNo
   * @returns {Promise<Transaksi|null>}
   */
  async getTransaction(invoiceNo) {
    return this.#transactionModel.findByInvoice(invoiceNo);
  }

  /**
   * Mengosongkan keranjang item transaksi saat ini
   */
  clearItems() {
    this.#items = [];
    this.#activePromo = null;
  }
}

export default TransactionController;
