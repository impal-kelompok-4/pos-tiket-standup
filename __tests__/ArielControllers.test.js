/**
 * @jest-environment node
 */
/**
 * ============================================================================
 * MODUL          : Unit Test Ariel Controllers & API Handlers (ArielControllers.test.js)
 * REFERENSI      : DPPL-01 Bab 2.4 & SKPL KF-01, KF-02, KF-04, KF-05, KF-06, KF-07, KF-11
 * PENGEMBANG     : Ariel Ahnaf Kusuma (103112400050) - Backend API, Logic & Unit Test
 * DESKRIPSI      : Unit testing menyeluruh untuk TransactionController (CLS-09),
 *                  OrderController (CLS-10), PaymentController (CLS-11),
 *                  ValidationController (CLS-16), dan Route Handlers API terkait.
 * ============================================================================
 */

import pool from '@/config/db';
import { Tiket } from '@/models/Tiket';
import { Addon } from '@/models/Addon';
import { Promo } from '@/models/Promo';
import { Transaksi } from '@/models/Transaksi';
import { TransaksiDetail } from '@/models/TransaksiDetail';
import { TiketItem } from '@/models/TiketItem';

import { TransactionController } from '@/controllers/TransactionController';
import { OrderController } from '@/controllers/OrderController';
import { PaymentController } from '@/controllers/PaymentController';
import { ValidationController } from '@/controllers/ValidationController';

import { GET as getTransactions, POST as postTransactions } from '@/app/api/transactions/route';
import { POST as postCheckout } from '@/app/api/checkout/route';
import { POST as postGateVerify } from '@/app/api/gate/verify/route';

jest.mock('@/config/db', () => ({
  execute: jest.fn(),
}));

describe('Unit Testing Modul Backend Ariel Ahnaf Kusuma (103112400050)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 1. TransactionController (CLS-09 / KF-01, KF-02)
  // ==========================================================================
  describe('1. TransactionController (CLS-09 / KF-01, KF-02)', () => {
    it('dapat diinisialisasi dengan dependency injection dan getter/setter private fields', () => {
      const trxModel = new Transaksi();
      const ticketModel = new Tiket();
      const addonModel = new Addon();
      const promoModel = new Promo();
      const detailModel = new TransaksiDetail();
      const itemModel = new TiketItem();

      const ctrl = new TransactionController(
        trxModel,
        ticketModel,
        addonModel,
        promoModel,
        detailModel,
        itemModel
      );

      expect(ctrl.transactionModel).toBe(trxModel);
      expect(ctrl.ticketModel).toBe(ticketModel);
      expect(ctrl.addonModel).toBe(addonModel);
      expect(ctrl.promoModel).toBe(promoModel);
      expect(ctrl.detailModel).toBe(detailModel);
      expect(ctrl.tiketItemModel).toBe(itemModel);
      expect(ctrl.items).toEqual([]);
      expect(ctrl.activePromo).toBeNull();
    });

    it('addItem menambahkan tiket jika kuota mencukupi dan mengagregasi kuantitas', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 50)),
      };
      const ctrl = new TransactionController(undefined, mockTicketModel);

      const res1 = await ctrl.addItem(2, 2);
      expect(res1).toBe(true);
      expect(ctrl.items).toHaveLength(1);
      expect(ctrl.items[0]).toEqual({
        type: 'ticket',
        id: 2,
        name: 'Batch 1',
        price: 75000,
        qty: 2,
      });

      // Agregasi kuantitas untuk tiket yang sama
      const res2 = await ctrl.addItem(2, 1);
      expect(res2).toBe(true);
      expect(ctrl.items).toHaveLength(1);
      expect(ctrl.items[0].qty).toBe(3);
    });

    it('addItem menolak kuantitas non-positif atau kuota tidak mencukupi', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(false),
      };
      const ctrl = new TransactionController(undefined, mockTicketModel);

      expect(await ctrl.addItem(1, 0)).toBe(false);
      expect(await ctrl.addItem(1, -2)).toBe(false);

      const noQuotaRes = await ctrl.addItem(1, 10);
      expect(noQuotaRes).toBe(false);
      expect(ctrl.items).toHaveLength(0);
    });

    it('addAddon menambahkan produk add-on jika stok mencukupi dan mengagregasi kuantitas', async () => {
      const mockAddonModel = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Addon(1, 'Paket Snack', 15000, 40)),
      };
      const ctrl = new TransactionController(undefined, undefined, mockAddonModel);

      const res1 = await ctrl.addAddon(1, 2);
      expect(res1).toBe(true);
      expect(ctrl.items).toHaveLength(1);
      expect(ctrl.items[0]).toEqual({
        type: 'addon',
        id: 1,
        name: 'Paket Snack',
        price: 15000,
        qty: 2,
      });

      const res2 = await ctrl.addAddon(1, 1);
      expect(res2).toBe(true);
      expect(ctrl.items[0].qty).toBe(3);
    });

    it('addAddon menolak kuantitas non-positif atau stok habis', async () => {
      const mockAddonModel = {
        checkStok: jest.fn().mockResolvedValue(false),
      };
      const ctrl = new TransactionController(undefined, undefined, mockAddonModel);

      expect(await ctrl.addAddon(2, 0)).toBe(false);
      expect(await ctrl.addAddon(2, -1)).toBe(false);
      expect(await ctrl.addAddon(2, 10)).toBe(false);
      expect(ctrl.items).toHaveLength(0);
    });

    it('calculateSubtotal menghitung total harga tiket dan add-on', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 50)),
      };
      const mockAddonModel = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Addon(1, 'Snack', 15000, 40)),
      };
      const ctrl = new TransactionController(undefined, mockTicketModel, mockAddonModel);

      await ctrl.addItem(2, 2); // 75.000 * 2 = 150.000
      await ctrl.addAddon(1, 2); // 15.000 * 2 = 30.000

      expect(ctrl.calculateSubtotal()).toBe(180000);
    });

    it('applyPromo memvalidasi voucher dan menghitung nominal potongan diskon', async () => {
      const mockPromoModel = {
        validatePromo: jest.fn().mockResolvedValue(new Promo('KETAWA10', 10000, 50, '2026-12-31')),
      };
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 50)),
      };
      const ctrl = new TransactionController(undefined, mockTicketModel, undefined, mockPromoModel);
      await ctrl.addItem(2, 2); // 150.000

      const promoRes = await ctrl.applyPromo('KETAWA10');
      expect(promoRes.valid).toBe(true);
      expect(promoRes.discount).toBe(10000);
      expect(promoRes.promoCode).toBe('KETAWA10');
      expect(ctrl.activePromo).toBeDefined();

      // Kode promo kosong atau tidak valid
      mockPromoModel.validatePromo.mockResolvedValueOnce(null);
      const invalidRes = await ctrl.applyPromo('EXPIRED');
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.discount).toBe(0);

      const emptyRes = await ctrl.applyPromo('');
      expect(emptyRes.valid).toBe(false);
    });

    it('processPayment menolak jika keranjang transaksi kosong', async () => {
      const ctrl = new TransactionController();
      expect(ctrl.getItems()).toHaveLength(0);

      const result = await ctrl.processPayment(100000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Keranjang transaksi kosong');
    });

    it('processPayment menolak jika nominal uang tunai kurang', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 50)),
      };
      const ctrl = new TransactionController(undefined, mockTicketModel);
      await ctrl.addItem(2, 2); // 150.000

      const result = await ctrl.processPayment(100000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('kurang');
      expect(result.totalBayar).toBe(150000);
      expect(result.cashAmount).toBe(100000);
      expect(result.shortfall).toBe(50000);
    });

    it('processPayment berhasil menyelesaikan transaksi tunai, menghitung kembalian, dan menerbitkan tiket item QR', async () => {
      const mockTrxModel = { saveTransaction: jest.fn().mockResolvedValue(true) };
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 50)),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockAddonModel = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Addon(1, 'Snack', 15000, 40)),
        decrementStok: jest.fn().mockResolvedValue(true),
      };
      const mockPromoModel = {
        validatePromo: jest.fn().mockResolvedValue(new Promo('KETAWA10', 10000, 50, '2026-12-31')),
        decrementKuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetailModel = {
        saveDetail: jest.fn().mockResolvedValue({ id_detail: 101 }),
      };
      const mockItemModel = {
        create: jest.fn().mockResolvedValue(true),
      };

      const ctrl = new TransactionController(
        mockTrxModel,
        mockTicketModel,
        mockAddonModel,
        mockPromoModel,
        mockDetailModel,
        mockItemModel
      );

      await ctrl.addItem(2, 2); // 150.000
      await ctrl.addAddon(1, 2); // 30.000
      // Subtotal = 180.000
      await ctrl.applyPromo('KETAWA10'); // Diskon = 10.000 -> Total = 170.000

      const payRes = await ctrl.processPayment(200000, {
        nama_pemesan: 'Budi Santoso',
        email_pemesan: 'budi@mail.com',
        no_telp_pemesan: '08123456789',
      });

      expect(payRes.success).toBe(true);
      expect(payRes.totalBayar).toBe(170000);
      expect(payRes.change).toBe(30000); // 200.000 - 170.000 = 30.000
      expect(payRes.tickets).toHaveLength(2);
      expect(payRes.tickets[0].kode_tiket).toMatch(/^TKT-/);
      expect(payRes.tickets[0].qr_code_hash).toMatch(/^QRHASH-/);

      // Verifikasi pemanggilan model
      expect(mockTrxModel.saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          total_bayar: 170000,
          nominal_kembalian: 30000,
          metode_pembayaran: 'CASH',
          status_transaksi: 'PAID',
        })
      );
      expect(mockTicketModel.decrementQuota).toHaveBeenCalledWith(2, 2);
      expect(mockAddonModel.decrementStok).toHaveBeenCalledWith(1, 2);
      expect(mockPromoModel.decrementKuota).toHaveBeenCalledWith('KETAWA10');
      expect(mockItemModel.create).toHaveBeenCalledTimes(2);

      // Pastikan keranjang item dan promo di-reset setelah pembayaran
      expect(ctrl.items).toHaveLength(0);
      expect(ctrl.activePromo).toBeNull();
    });

    it('processCashPayment memanggil processPayment sebagai alias', async () => {
      const ctrl = new TransactionController();
      jest.spyOn(ctrl, 'processPayment').mockResolvedValue({ success: true, change: 0 });

      const res = await ctrl.processCashPayment(50000);
      expect(res.success).toBe(true);
      expect(ctrl.processPayment).toHaveBeenCalledWith(50000, {});
    });

    it('createPendingTransaction menyimpan transaksi daring status PENDING', async () => {
      const mockTrxModel = { saveTransaction: jest.fn().mockResolvedValue(true) };
      const mockDetailModel = { saveDetail: jest.fn().mockResolvedValue({ id_detail: 1 }) };
      const mockTicketModel = {
        findById: jest.fn().mockResolvedValue(new Tiket(3, 'Batch 2', 100000, 50)),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };

      const ctrl = new TransactionController(mockTrxModel, mockTicketModel, undefined, undefined, mockDetailModel);

      const orderData = {
        nama_pemesan: 'Andi Online',
        email_pemesan: 'andi@online.com',
        no_telp_pemesan: '081234567888',
        metode_pembayaran: 'QRIS',
        items: [{ type: 'ticket', id: 3, qty: 1 }],
      };

      const pendingRes = await ctrl.createPendingTransaction(orderData);
      expect(pendingRes.success).toBe(true);
      expect(pendingRes.status).toBe('PENDING');
      expect(pendingRes.totalBayar).toBe(100000);
      expect(mockTrxModel.saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          status_transaksi: 'PENDING',
          metode_pembayaran: 'QRIS',
        })
      );
    });

    it('getAllTransactions dan getTransaction mengambil riwayat transaksi dari model', async () => {
      const mockTrxModel = {
        findAll: jest.fn().mockResolvedValue([new Transaksi('TRX-001'), new Transaksi('TRX-002')]),
        findByInvoice: jest.fn().mockResolvedValue(new Transaksi('TRX-001')),
      };
      const ctrl = new TransactionController(mockTrxModel);

      const list = await ctrl.getAllTransactions();
      expect(list).toHaveLength(2);

      const single = await ctrl.getTransaction('TRX-001');
      expect(single.no_invoice).toBe('TRX-001');
    });

    it('clearItems mengosongkan item dan promo aktif', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(1, 'Early', 50000, 10)),
      };
      const ctrl = new TransactionController(undefined, mockTicketModel);
      await ctrl.addItem(1, 1);
      expect(ctrl.items).toHaveLength(1);

      ctrl.clearItems();
      expect(ctrl.items).toHaveLength(0);
      expect(ctrl.activePromo).toBeNull();
    });
  });

  // ==========================================================================
  // 2. OrderController (CLS-10 / KF-04, KF-11)
  // ==========================================================================
  describe('2. OrderController (CLS-10 / KF-04, KF-11)', () => {
    it('dapat diinisialisasi dengan model dan keranjang kosong', () => {
      const ctrl = new OrderController();
      expect(ctrl.ticketModel).toBeDefined();
      expect(ctrl.addonModel).toBeDefined();
      expect(ctrl.transactionModel).toBeDefined();
      expect(ctrl.promoModel).toBeDefined();
      expect(ctrl.detailModel).toBeDefined();
      expect(ctrl.cart).toEqual({ tickets: [], addons: [] });
    });

    it('addToCart menambahkan tiket ke keranjang belanja daring jika kuota mencukupi', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 80)),
      };
      const ctrl = new OrderController(mockTicketModel);

      const added = await ctrl.addToCart(2, 2);
      expect(added).toBe(true);
      expect(ctrl.cart.tickets).toHaveLength(1);
      expect(ctrl.cart.tickets[0]).toEqual({
        id: 2,
        tier: 'Batch 1',
        harga: 75000,
        qty: 2,
      });

      // Menambah tiket yang sama
      await ctrl.addToCart(2, 1);
      expect(ctrl.cart.tickets[0].qty).toBe(3);
    });

    it('addToCart menolak jika kuota tidak mencukupi atau kuantitas <= 0', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(false),
      };
      const ctrl = new OrderController(mockTicketModel);

      expect(await ctrl.addToCart(1, 0)).toBe(false);
      expect(await ctrl.addToCart(1, -1)).toBe(false);
      expect(await ctrl.addToCart(1, 5)).toBe(false);
      expect(ctrl.cart.tickets).toHaveLength(0);
    });

    it('addAddon menambahkan produk add-on ke keranjang belanja daring', async () => {
      const mockAddonModel = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Addon(1, 'Popcorn Cola', 15000, 30)),
      };
      const ctrl = new OrderController(undefined, mockAddonModel);

      const added = await ctrl.addAddon(1, 3);
      expect(added).toBe(true);
      expect(ctrl.cart.addons).toHaveLength(1);
      expect(ctrl.cart.addons[0].qty).toBe(3);
    });

    it('getCart menghitung subtotal tiket, add-on, dan total keseluruhan', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 80)),
      };
      const mockAddonModel = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Addon(1, 'Popcorn', 15000, 30)),
      };
      const ctrl = new OrderController(mockTicketModel, mockAddonModel);

      await ctrl.addToCart(2, 2); // 150.000
      await ctrl.addAddon(1, 2); // 30.000

      const cart = ctrl.getCart();
      expect(cart.ticketSubtotal).toBe(150000);
      expect(cart.addonSubtotal).toBe(30000);
      expect(cart.total).toBe(180000);
    });

    it('clearCart mengosongkan keranjang belanja', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 80)),
      };
      const ctrl = new OrderController(mockTicketModel);
      await ctrl.addToCart(2, 1);
      expect(ctrl.cart.tickets).toHaveLength(1);

      ctrl.clearCart();
      expect(ctrl.cart.tickets).toHaveLength(0);
      expect(ctrl.cart.addons).toHaveLength(0);
    });

    it('checkout menolak jika data pelanggan tidak lengkap atau keranjang kosong', async () => {
      const ctrl = new OrderController();

      const incompleteRes = await ctrl.checkout({
        nama_pemesan: 'Customer',
        email_pemesan: '',
        no_telp_pemesan: '08123',
      });
      expect(incompleteRes.success).toBe(false);
      expect(incompleteRes.message).toContain('wajib lengkap');

      const emptyRes = await ctrl.checkout({
        nama_pemesan: 'Customer',
        email_pemesan: 'cust@mail.com',
        no_telp_pemesan: '08123456789',
      });
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.message).toContain('kosong');
    });

    it('checkout berhasil memproses pesanan daring, membuat status PENDING, dan mengosongkan keranjang', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 80)),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockAddonModel = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Addon(1, 'Snack', 15000, 30)),
        decrementStok: jest.fn().mockResolvedValue(true),
      };
      const mockTrxModel = {
        saveTransaction: jest.fn().mockResolvedValue(true),
      };

      // Mock pool execute for TransaksiDetail saveDetail
      pool.execute.mockResolvedValueOnce([{ insertId: 501 }]).mockResolvedValueOnce([{ insertId: 502 }]);

      const ctrl = new OrderController(mockTicketModel, mockAddonModel, mockTrxModel);
      await ctrl.addToCart(2, 2); // 150.000
      await ctrl.addAddon(1, 1); // 15.000

      const checkoutRes = await ctrl.checkout({
        nama_pemesan: 'Dewi Lestari',
        email_pemesan: 'dewi@mail.com',
        no_telp_pemesan: '08123456789',
        metode_pembayaran: 'QRIS',
      });

      expect(checkoutRes.success).toBe(true);
      expect(checkoutRes.status).toBe('PENDING');
      expect(checkoutRes.totalBayar).toBe(165000);
      expect(checkoutRes.noInvoice).toMatch(/^INV-/);

      expect(mockTrxModel.saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          status_transaksi: 'PENDING',
          metode_pembayaran: 'QRIS',
          total_bayar: 165000,
        })
      );

      expect(mockTicketModel.decrementQuota).toHaveBeenCalledWith(2, 2);
      expect(mockAddonModel.decrementStok).toHaveBeenCalledWith(1, 1);
      expect(ctrl.cart.tickets).toHaveLength(0);
    });

    it('checkout menghitung potongan diskon promo dan memanggil saveDetail via DI', async () => {
      const mockTicketModel = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Tiket(2, 'Batch 1', 75000, 80)),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockAddonModel = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(new Addon(1, 'Snack', 15000, 30)),
        decrementStok: jest.fn().mockResolvedValue(true),
      };
      const mockTrxModel = {
        saveTransaction: jest.fn().mockResolvedValue(true),
      };
      const mockPromoModel = {
        validatePromo: jest.fn().mockResolvedValue(new Promo('HEMAT20', 20000, 10, '2026-12-31')),
        decrementKuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetailModel = {
        saveDetail: jest.fn().mockResolvedValue({ id_detail: 999 }),
      };

      const ctrl = new OrderController(
        mockTicketModel,
        mockAddonModel,
        mockTrxModel,
        mockPromoModel,
        mockDetailModel
      );

      await ctrl.addToCart(2, 2); // 150.000
      await ctrl.addAddon(1, 1); // 15.000 (Subtotal = 165.000)

      const res = await ctrl.checkout({
        nama_pemesan: 'Dimas Promo',
        email_pemesan: 'dimas@promo.com',
        no_telp_pemesan: '08123456789',
        kode_promo: 'HEMAT20',
      });

      expect(res.success).toBe(true);
      expect(res.subtotal).toBe(165000);
      expect(res.discount).toBe(20000);
      expect(res.totalBayar).toBe(145000); // 165.000 - 20.000

      expect(mockPromoModel.validatePromo).toHaveBeenCalledWith('HEMAT20');
      expect(mockPromoModel.decrementKuota).toHaveBeenCalledWith('HEMAT20');
      expect(mockDetailModel.saveDetail).toHaveBeenCalledTimes(2);
      expect(mockTrxModel.saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          total_bayar: 145000,
          kode_promo: 'HEMAT20',
        })
      );
    });
  });

  // ==========================================================================
  // 3. PaymentController (CLS-11 / KF-02, KF-05)
  // ==========================================================================
  describe('3. PaymentController (CLS-11 / KF-02, KF-05)', () => {
    it('dapat diinisialisasi dengan model Transaksi', () => {
      const trx = new Transaksi();
      const ctrl = new PaymentController(trx);
      expect(ctrl.transactionModel).toBe(trx);
    });

    it('validateCashPayment memvalidasi kecukupan uang tunai dan menghitung kekurangan/kembalian', () => {
      const ctrl = new PaymentController();

      const shortRes = ctrl.validateCashPayment(150000, 100000);
      expect(shortRes.isValid).toBe(false);
      expect(shortRes.shortfall).toBe(50000);
      expect(shortRes.change).toBe(0);

      const exactRes = ctrl.validateCashPayment(150000, 150000);
      expect(exactRes.isValid).toBe(true);
      expect(exactRes.change).toBe(0);

      const overRes = ctrl.validateCashPayment(150000, 200000);
      expect(overRes.isValid).toBe(true);
      expect(overRes.change).toBe(50000);
    });

    it('initiatePayment menghasilkan simulasi URL pembayaran dan identifier QRIS / VA', async () => {
      const ctrl = new PaymentController();

      const qrisRes = await ctrl.initiatePayment('TRX-999', 'QRIS');
      expect(qrisRes.status).toBe('PENDING');
      expect(qrisRes.noInvoice).toBe('TRX-999');
      expect(qrisRes.method).toBe('QRIS');
      expect(qrisRes.paymentUrl).toContain('TRX-999');
      expect(qrisRes.qrString).toBeDefined();

      const vaRes = await ctrl.initiatePayment('TRX-888', 'VA');
      expect(vaRes.status).toBe('PENDING');
      expect(vaRes.method).toBe('VA');
      expect(vaRes.vaNumber).toMatch(/^8801/);
    });

    it('webhookNotification memperbarui status transaksi dan mendukung kompatibilitas parameter', async () => {
      const mockTrxModel = {
        updateStatus: jest.fn().mockResolvedValue(true),
      };
      const ctrl = new PaymentController(mockTrxModel);

      // Pemanggilan kompatibilitas 1 parameter (controllers.test.js)
      const legacyRes = await ctrl.webhookNotification('PAID');
      expect(legacyRes).toBe(true);
      expect(mockTrxModel.updateStatus).toHaveBeenCalledWith('TRX-TEMP', 'PAID');

      // Pemanggilan 2 parameter (noInvoice, status)
      const fullRes = await ctrl.webhookNotification('TRX-12345', 'PAID');
      expect(fullRes.success).toBe(true);
      expect(fullRes.status).toBe('PAID');
      expect(fullRes.noInvoice).toBe('TRX-12345');
      expect(mockTrxModel.updateStatus).toHaveBeenCalledWith('TRX-12345', 'PAID');
    });
  });

  // ==========================================================================
  // 4. ValidationController (CLS-16 / KF-06, KF-07)
  // ==========================================================================
  describe('4. ValidationController (CLS-16 / KF-06, KF-07)', () => {
    it('dapat diinisialisasi dengan model TiketItem', () => {
      const itemModel = new TiketItem();
      const ctrl = new ValidationController(itemModel);
      expect(ctrl.tiketItemModel).toBe(itemModel);
    });

    it('validateQR menolak payload kosong', async () => {
      const ctrl = new ValidationController();
      const emptyRes = await ctrl.validateQR('');
      expect(emptyRes.isValid).toBe(false);
      expect(emptyRes.message).toContain('kosong');
    });

    it('validateQR mengenali tiket palsu / tidak terdaftar', async () => {
      const mockItemModel = {
        findByHash: jest.fn().mockResolvedValue(null),
      };
      const ctrl = new ValidationController(mockItemModel);

      const fakeRes = await ctrl.validateQR('FAKE-HASH-999');
      expect(fakeRes.isValid).toBe(false);
      expect(fakeRes.message).toContain('palsu atau tidak terdaftar');
    });

    it('validateQR berhasil check-in pada tiket valid berstatus "Belum Hadir"', async () => {
      const freshTicket = new TiketItem('TKT-003', 3, 'QRHASH-VALID-001', 'Belum Hadir', null);
      const mockItemModel = {
        findByHash: jest.fn().mockResolvedValue(freshTicket),
        verifyAndMarkCheckedIn: jest.fn().mockResolvedValue({ success: true, status: 'VALID' }),
      };
      const ctrl = new ValidationController(mockItemModel);

      const checkinRes = await ctrl.validateQR('QRHASH-VALID-001');
      expect(checkinRes.isValid).toBe(true);
      expect(checkinRes.ticketCode).toBe('TKT-003');
      expect(checkinRes.message).toContain('Check-in berhasil');
      expect(mockItemModel.verifyAndMarkCheckedIn).toHaveBeenCalledWith('QRHASH-VALID-001');
      expect(freshTicket.status_kehadiran).toBe('Checked-In');
      expect(freshTicket.waktu_checkin).toBeDefined();
    });

    it('validateQR menolak tiket yang sudah check-in (Anti-Double-Checkin guard)', async () => {
      const usedTicket = new TiketItem('TKT-001', 1, 'QRHASH-USED-001', 'Checked-In', new Date('2026-10-24 19:45:00'));
      const mockItemModel = {
        findByHash: jest.fn().mockResolvedValue(usedTicket),
      };
      const ctrl = new ValidationController(mockItemModel);

      const doubleRes = await ctrl.validateQR('QRHASH-USED-001');
      expect(doubleRes.isValid).toBe(false);
      expect(doubleRes.alreadyCheckedIn).toBe(true);
      expect(doubleRes.ticketCode).toBe('TKT-001');
      expect(doubleRes.checkinTime).toBeDefined();
      expect(doubleRes.message).toContain('sudah digunakan');
    });

    it('setCheckedIn berfungsi sebagai helper method eksplisit', async () => {
      const mockItemModel = {
        verifyAndMarkCheckedIn: jest.fn().mockResolvedValue({ success: true, status: 'VALID' }),
      };
      const ctrl = new ValidationController(mockItemModel);
      expect(await ctrl.setCheckedIn('TKT-001')).toBe(true);
      expect(mockItemModel.verifyAndMarkCheckedIn).toHaveBeenCalledWith('TKT-001');
      expect(await ctrl.setCheckedIn('')).toBe(false);
    });
  });

  // ==========================================================================
  // 5. Route Handlers API (src/app/api/)
  // ==========================================================================
  describe('5. Route Handlers API', () => {
    describe('GET & POST /api/transactions', () => {
      it('GET /api/transactions mengembalikan seluruh daftar transaksi', async () => {
        pool.execute.mockResolvedValueOnce([
          [
            {
              no_invoice: 'TRX-101',
              waktu_transaksi: '2026-10-24',
              metode_pembayaran: 'CASH',
              status_transaksi: 'PAID',
              total_bayar: 170000,
            },
          ],
        ]);

        const req = new Request('http://localhost:3000/api/transactions');
        const res = await getTransactions(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
      });

      it('GET /api/transactions?invoice=... mengembalikan single transaksi atau 404', async () => {
        pool.execute.mockResolvedValueOnce([
          [
            {
              no_invoice: 'TRX-101',
              total_bayar: 170000,
            },
          ],
        ]);

        const req1 = new Request('http://localhost:3000/api/transactions?invoice=TRX-101');
        const res1 = await getTransactions(req1);
        const data1 = await res1.json();

        expect(res1.status).toBe(200);
        expect(data1.data.no_invoice).toBe('TRX-101');

        // Kasus tidak ditemukan
        pool.execute.mockResolvedValueOnce([[]]);
        const req2 = new Request('http://localhost:3000/api/transactions?invoice=TRX-NOT-FOUND');
        const res2 = await getTransactions(req2);
        expect(res2.status).toBe(404);
      });

      it('POST /api/transactions menolak payload tanpa items atau uang tunai kurang', async () => {
        const reqNoItems = new Request('http://localhost:3000/api/transactions', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const resNoItems = await postTransactions(reqNoItems);
        expect(resNoItems.status).toBe(400);

        // Uang tunai kurang
        pool.execute
          .mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }]]) // checkQuota
          .mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }]]); // findById

        const reqLessCash = new Request('http://localhost:3000/api/transactions', {
          method: 'POST',
          body: JSON.stringify({
            items: [{ type: 'ticket', id: 2, qty: 1 }],
            cashAmount: 50000, // Total 75.000
          }),
        });
        const resLessCash = await postTransactions(reqLessCash);
        expect(resLessCash.status).toBe(400);
        const lessData = await resLessCash.json();
        expect(lessData.message).toContain('kurang');
      });

      it('POST /api/transactions memproses transaksi kasir tunai berhasil', async () => {
        pool.execute
          .mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }]]) // checkQuota
          .mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }]]) // findById
          .mockResolvedValueOnce([{ affectedRows: 1 }]) // saveTransaction
          .mockResolvedValueOnce([{ insertId: 10 }]) // saveDetail
          .mockResolvedValueOnce([{ affectedRows: 1 }]) // decrementQuota
          .mockResolvedValueOnce([{ affectedRows: 1 }]); // create TiketItem

        const req = new Request('http://localhost:3000/api/transactions', {
          method: 'POST',
          body: JSON.stringify({
            items: [{ type: 'ticket', id: 2, qty: 1 }],
            cashAmount: 100000,
            nama_pemesan: 'Budi Kasir',
            email_pemesan: 'budi@kasir.id',
            no_telp_pemesan: '08123456789',
          }),
        });

        const res = await postTransactions(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.totalBayar).toBe(75000);
        expect(data.data.change).toBe(25000);
      });
    });

    describe('POST /api/checkout', () => {
      it('POST /api/checkout menolak jika data customer atau items tidak lengkap', async () => {
        const reqIncomplete = new Request('http://localhost:3000/api/checkout', {
          method: 'POST',
          body: JSON.stringify({
            customer: { nama_pemesan: 'Dewi' },
          }),
        });
        const resIncomplete = await postCheckout(reqIncomplete);
        expect(resIncomplete.status).toBe(400);

        const reqEmptyCart = new Request('http://localhost:3000/api/checkout', {
          method: 'POST',
          body: JSON.stringify({
            customer: {
              nama_pemesan: 'Dewi',
              email_pemesan: 'dewi@mail.com',
              no_telp_pemesan: '0812345',
            },
            items: [],
          }),
        });
        const resEmptyCart = await postCheckout(reqEmptyCart);
        expect(resEmptyCart.status).toBe(400);
      });

      it('POST /api/checkout berhasil membuat order mandiri daring dan payment simulation', async () => {
        pool.execute
          .mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }]]) // checkQuota addToCart
          .mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }]]) // findById addToCart
          .mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }]]) // checkQuota checkout validation
          .mockResolvedValueOnce([{ affectedRows: 1 }]) // saveTransaction
          .mockResolvedValueOnce([{ insertId: 201 }]) // saveDetail
          .mockResolvedValueOnce([{ affectedRows: 1 }]); // decrementQuota

        const req = new Request('http://localhost:3000/api/checkout', {
          method: 'POST',
          body: JSON.stringify({
            customer: {
              nama_pemesan: 'Andi Online',
              email_pemesan: 'andi@online.id',
              no_telp_pemesan: '081234567803',
              metode_pembayaran: 'QRIS',
            },
            tickets: [{ id: 2, qty: 1 }],
          }),
        });

        const res = await postCheckout(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('PENDING');
        expect(data.data.payment).toBeDefined();
        expect(data.data.payment.qrString).toBeDefined();
      });
    });

    describe('POST /api/gate/verify', () => {
      it('POST /api/gate/verify menolak payload tanpa qr_code_hash', async () => {
        const req = new Request('http://localhost:3000/api/gate/verify', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const res = await postGateVerify(req);
        expect(res.status).toBe(400);
      });

      it('POST /api/gate/verify mengembalikan status 200 untuk check-in tiket valid', async () => {
        const ticketRow = [
          {
            kode_tiket: 'TKT-2026-003',
            id_detail: 3,
            qr_code_hash: 'QRHASH-VALID-999',
            status_kehadiran: 'Belum Hadir',
            waktu_checkin: null,
          },
        ];
        pool.execute
          .mockResolvedValueOnce([ticketRow]) // findByHash in validateQR
          .mockResolvedValueOnce([ticketRow]) // findByHash in verifyAndMarkCheckedIn
          .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE in verifyAndMarkCheckedIn

        const req = new Request('http://localhost:3000/api/gate/verify', {
          method: 'POST',
          body: JSON.stringify({ qrPayload: 'QRHASH-VALID-999' }),
        });

        const res = await postGateVerify(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.ticketCode).toBe('TKT-2026-003');
      });

      it('POST /api/gate/verify mensimulasikan skenario double-scan: scan pertama 200, scan kedua 409', async () => {
        const freshTicketRow = [
          {
            kode_tiket: 'TKT-2026-007',
            id_detail: 7,
            qr_code_hash: 'QRHASH-DOUBLE-007',
            status_kehadiran: 'Belum Hadir',
            waktu_checkin: null,
          },
        ];
        const checkedInTicketRow = [
          {
            kode_tiket: 'TKT-2026-007',
            id_detail: 7,
            qr_code_hash: 'QRHASH-DOUBLE-007',
            status_kehadiran: 'Checked-In',
            waktu_checkin: '2026-10-24 19:40:00',
          },
        ];

        // Scan Pertama: Tiket valid dan belum hadir
        pool.execute
          .mockResolvedValueOnce([freshTicketRow]) // findByHash in validateQR
          .mockResolvedValueOnce([freshTicketRow]) // findByHash in verifyAndMarkCheckedIn
          .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE in verifyAndMarkCheckedIn

        const req1 = new Request('http://localhost:3000/api/gate/verify', {
          method: 'POST',
          body: JSON.stringify({ qrPayload: 'QRHASH-DOUBLE-007' }),
        });
        const res1 = await postGateVerify(req1);
        const data1 = await res1.json();

        expect(res1.status).toBe(200);
        expect(data1.success).toBe(true);
        expect(data1.data.ticketCode).toBe('TKT-2026-007');

        // Scan Kedua: Tiket yang sama di-scan lagi (Anti-Double-Checkin)
        pool.execute.mockResolvedValueOnce([checkedInTicketRow]);

        const req2 = new Request('http://localhost:3000/api/gate/verify', {
          method: 'POST',
          body: JSON.stringify({ qrPayload: 'QRHASH-DOUBLE-007' }),
        });
        const res2 = await postGateVerify(req2);
        const data2 = await res2.json();

        expect(res2.status).toBe(409);
        expect(data2.success).toBe(false);
        expect(data2.data.alreadyCheckedIn).toBe(true);
        expect(data2.data.ticketCode).toBe('TKT-2026-007');
      });

      it('POST /api/gate/verify mengembalikan status 409 untuk tiket yang sudah check-in', async () => {
        pool.execute.mockResolvedValueOnce([
          [
            {
              kode_tiket: 'TKT-2026-001',
              id_detail: 1,
              qr_code_hash: 'QRHASH-USED-999',
              status_kehadiran: 'Checked-In',
              waktu_checkin: '2026-10-24 19:45:10',
            },
          ],
        ]);

        const req = new Request('http://localhost:3000/api/gate/verify', {
          method: 'POST',
          body: JSON.stringify({ qrPayload: 'QRHASH-USED-999' }),
        });

        const res = await postGateVerify(req);
        const data = await res.json();

        expect(res.status).toBe(409);
        expect(data.success).toBe(false);
        expect(data.data.alreadyCheckedIn).toBe(true);
      });

      it('POST /api/gate/verify mengembalikan status 404 untuk tiket palsu', async () => {
        pool.execute.mockResolvedValueOnce([[]]);

        const req = new Request('http://localhost:3000/api/gate/verify', {
          method: 'POST',
          body: JSON.stringify({ qrPayload: 'FAKE-HASH-UNKNOWN' }),
        });

        const res = await postGateVerify(req);
        expect(res.status).toBe(404);
      });
    });
  });
});
