/**
 * @jest-environment node
 */
/**
 * ============================================================================
 * MODUL          : Unit Test Transaction Controller (TransactionController.test.js)
 * REFERENSI      : DPPL-01 CLS-09 / SKPL KF-01, KF-02
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo (103112400081)
 * DESKRIPSI      : Pengujian komprehensif untuk TransactionController (CLS-09)
 *                  mencakup kalkulasi subtotal tiket dan add-on, potongan promo,
 *                  validasi pembayaran tunai, kembalian, penanganan uang kurang,
 *                  guard keranjang kosong, penerbitan e-tiket, transaksi pending,
 *                  dan isolasi interaksi basis data tanpa memerlukan MySQL aktif.
 * ============================================================================
 */

import pool from '@/config/db';
import { TransactionController } from '@/controllers/TransactionController';
import { Transaksi } from '@/models/Transaksi';
import { Tiket } from '@/models/Tiket';
import { Addon } from '@/models/Addon';
import { Promo } from '@/models/Promo';
import { TransaksiDetail } from '@/models/TransaksiDetail';
import { TiketItem } from '@/models/TiketItem';

jest.mock('@/config/db', () => ({
  execute: jest.fn(),
}));

describe('Unit Testing TransactionController (CLS-09 / KF-01, KF-02) - Ryan Akeyla (103112400081)', () => {
  beforeEach(() => {
    pool.execute.mockResolvedValue([[]]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 1. Inisialisasi, Dependency Injection, dan Enkapsulasi
  // ==========================================================================
  describe('1. Inisialisasi & Dependency Injection', () => {
    it('menginisialisasi controller dengan model default dan state awal kosong', () => {
      const controller = new TransactionController();
      expect(controller.transactionModel).toBeInstanceOf(Transaksi);
      expect(controller.ticketModel).toBeInstanceOf(Tiket);
      expect(controller.addonModel).toBeInstanceOf(Addon);
      expect(controller.promoModel).toBeInstanceOf(Promo);
      expect(controller.detailModel).toBeInstanceOf(TransaksiDetail);
      expect(controller.tiketItemModel).toBeInstanceOf(TiketItem);
      expect(controller.items).toEqual([]);
      expect(controller.getItems()).toEqual([]);
      expect(controller.activePromo).toBeNull();
    });

    it('mendukung penyuntikan (injection) mock model custom melalui konstruktor dan setter', () => {
      const mockTrx = { saveTransaction: jest.fn(), findAll: jest.fn() };
      const mockTicket = { checkQuota: jest.fn(), findById: jest.fn() };
      const mockAddon = { checkStok: jest.fn(), findById: jest.fn() };
      const mockPromo = { validatePromo: jest.fn() };
      const mockDetail = { saveDetail: jest.fn() };
      const mockItem = { create: jest.fn() };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        mockAddon,
        mockPromo,
        mockDetail,
        mockItem
      );

      expect(controller.transactionModel).toBe(mockTrx);
      expect(controller.ticketModel).toBe(mockTicket);
      expect(controller.addonModel).toBe(mockAddon);
      expect(controller.promoModel).toBe(mockPromo);
      expect(controller.detailModel).toBe(mockDetail);
      expect(controller.tiketItemModel).toBe(mockItem);

      // Setter verification
      const replacementTrx = { saveTransaction: jest.fn() };
      const replacementTicket = { checkQuota: jest.fn() };
      const replacementAddon = { checkStok: jest.fn() };
      const replacementPromo = { validatePromo: jest.fn() };
      const replacementDetail = { saveDetail: jest.fn() };
      const replacementItem = { create: jest.fn() };

      controller.transactionModel = replacementTrx;
      controller.ticketModel = replacementTicket;
      controller.addonModel = replacementAddon;
      controller.promoModel = replacementPromo;
      controller.detailModel = replacementDetail;
      controller.tiketItemModel = replacementItem;

      expect(controller.transactionModel).toBe(replacementTrx);
      expect(controller.ticketModel).toBe(replacementTicket);
      expect(controller.addonModel).toBe(replacementAddon);
      expect(controller.promoModel).toBe(replacementPromo);
      expect(controller.detailModel).toBe(replacementDetail);
      expect(controller.tiketItemModel).toBe(replacementItem);
    });

    it('getter items mengembalikan salinan baru (immutability guard)', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'VIP', harga: 150000 }),
      };
      const controller = new TransactionController(undefined, mockTicket);

      await controller.addItem(1, 1);
      const itemsCopy = controller.items;
      itemsCopy.push({ type: 'fake' });

      expect(controller.items).toHaveLength(1);
      expect(controller.getItems()).toHaveLength(1);
    });
  });

  // ==========================================================================
  // 2. Kalkulasi Subtotal Tiket dan Add-on (addItem, addAddon, calculateSubtotal)
  // ==========================================================================
  describe('2. Manajemen Keranjang & Kalkulasi Subtotal (addItem, addAddon, calculateSubtotal)', () => {
    it('addItem menolak kuantitas tidak sah (<= 0)', async () => {
      const controller = new TransactionController();

      expect(await controller.addItem(1, 0)).toBe(false);
      expect(await controller.addItem(1, -2)).toBe(false);
      expect(await controller.addItem(1, -5)).toBe(false);
      expect(controller.items).toHaveLength(0);
    });

    it('addItem menolak penambahan jika kuota tiket tidak mencukupi (checkQuota false)', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(false),
      };
      const controller = new TransactionController(undefined, mockTicket);

      const result = await controller.addItem(1, 5);
      expect(result).toBe(false);
      expect(mockTicket.checkQuota).toHaveBeenCalledWith(1, 5);
      expect(controller.items).toHaveLength(0);
    });

    it('addItem berhasil menambahkan tiket baru ke dalam keranjang', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 2, tier: 'Batch 1', harga: 75000 }),
      };
      const controller = new TransactionController(undefined, mockTicket);

      const result = await controller.addItem(2, 2);
      expect(result).toBe(true);
      expect(controller.items).toHaveLength(1);
      expect(controller.items[0]).toEqual({
        type: 'ticket',
        id: 2,
        name: 'Batch 1',
        price: 75000,
        qty: 2,
      });
    });

    it('addItem mengakumulasikan kuantitas bila tiket yang sama ditambahkan kembali', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 2, tier: 'Batch 1', harga: 75000 }),
      };
      const controller = new TransactionController(undefined, mockTicket);

      await controller.addItem(2, 2);
      await controller.addItem(2, 3);

      expect(controller.items).toHaveLength(1);
      expect(controller.items[0].qty).toBe(5);
    });

    it('addItem menggunakan fallback dari findAll jika findById mengembalikan null', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue([
          { id: 3, tier: 'VIP Gold', harga: 200000 },
        ]),
      };
      const controller = new TransactionController(undefined, mockTicket);

      const result = await controller.addItem(3, 1);
      expect(result).toBe(true);
      expect(controller.items[0].name).toBe('VIP Gold');
      expect(controller.items[0].price).toBe(200000);
    });

    it('addItem menggunakan nilai default jika tiket tidak ditemukan di findById maupun findAll', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue([]),
      };
      const controller = new TransactionController(undefined, mockTicket);

      const result = await controller.addItem(99, 1);
      expect(result).toBe(true);
      expect(controller.items[0].name).toBe('Tiket Standard');
      expect(controller.items[0].price).toBe(50000);
    });

    it('addAddon menolak kuantitas tidak sah (<= 0)', async () => {
      const controller = new TransactionController();

      expect(await controller.addAddon(1, 0)).toBe(false);
      expect(await controller.addAddon(1, -1)).toBe(false);
      expect(await controller.addAddon(1, -10)).toBe(false);
      expect(controller.items).toHaveLength(0);
    });

    it('addAddon menolak penambahan jika stok addon tidak mencukupi (checkStok false)', async () => {
      const mockAddon = {
        checkStok: jest.fn().mockResolvedValue(false),
      };
      const controller = new TransactionController(undefined, undefined, mockAddon);

      const result = await controller.addAddon(1, 10);
      expect(result).toBe(false);
      expect(mockAddon.checkStok).toHaveBeenCalledWith(1, 10);
      expect(controller.items).toHaveLength(0);
    });

    it('addAddon berhasil menambahkan merchandise/konsumsi ke dalam keranjang', async () => {
      const mockAddon = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, nama_item: 'Kaos Standup', harga: 85000 }),
      };
      const controller = new TransactionController(undefined, undefined, mockAddon);

      const result = await controller.addAddon(1, 2);
      expect(result).toBe(true);
      expect(controller.items).toHaveLength(1);
      expect(controller.items[0]).toEqual({
        type: 'addon',
        id: 1,
        name: 'Kaos Standup',
        price: 85000,
        qty: 2,
      });
    });

    it('addAddon mengakumulasikan kuantitas bila produk add-on yang sama ditambahkan lagi', async () => {
      const mockAddon = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, nama_item: 'Air Mineral', harga: 10000 }),
      };
      const controller = new TransactionController(undefined, undefined, mockAddon);

      await controller.addAddon(1, 1);
      await controller.addAddon(1, 4);

      expect(controller.items).toHaveLength(1);
      expect(controller.items[0].qty).toBe(5);
    });

    it('addAddon menggunakan fallback dari findAll jika findById mengembalikan null', async () => {
      const mockAddon = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue([
          { id: 2, nama_item: 'Stiker Komedi', harga: 5000 },
        ]),
      };
      const controller = new TransactionController(undefined, undefined, mockAddon);

      const result = await controller.addAddon(2, 3);
      expect(result).toBe(true);
      expect(controller.items[0].name).toBe('Stiker Komedi');
      expect(controller.items[0].price).toBe(5000);
    });

    it('addAddon menggunakan nilai default jika add-on tidak ditemukan di findById maupun findAll', async () => {
      const mockAddon = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue([]),
      };
      const controller = new TransactionController(undefined, undefined, mockAddon);

      const result = await controller.addAddon(88, 1);
      expect(result).toBe(true);
      expect(controller.items[0].name).toBe('Addon Item');
      expect(controller.items[0].price).toBe(15000);
    });

    it('calculateSubtotal menghitung total harga gabungan tiket dan add-on secara presisi', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'VIP', harga: 150000 }),
      };
      const mockAddon = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 2, nama_item: 'Paket Snack', harga: 25000 }),
      };
      const controller = new TransactionController(undefined, mockTicket, mockAddon);

      expect(controller.calculateSubtotal()).toBe(0);

      await controller.addItem(1, 2); // 2 x 150.000 = 300.000
      expect(controller.calculateSubtotal()).toBe(300000);

      await controller.addAddon(2, 3); // 3 x 25.000 = 75.000
      expect(controller.calculateSubtotal()).toBe(375000);
    });

    it('clearItems mengosongkan seluruh item dan mereset activePromo', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'Reguler', harga: 50000 }),
      };
      const controller = new TransactionController(undefined, mockTicket);

      await controller.addItem(1, 1);
      expect(controller.items).toHaveLength(1);

      controller.clearItems();
      expect(controller.items).toHaveLength(0);
      expect(controller.activePromo).toBeNull();
      expect(controller.calculateSubtotal()).toBe(0);
    });
  });

  // ==========================================================================
  // 3. Potongan Diskon Promo (applyPromo)
  // ==========================================================================
  describe('3. Potongan Diskon Promo (applyPromo)', () => {
    it('applyPromo menolak kode promo kosong atau hanya whitespace', async () => {
      const controller = new TransactionController();

      const resEmpty = await controller.applyPromo('');
      expect(resEmpty).toEqual({
        valid: false,
        discount: 0,
        message: 'Kode promo tidak boleh kosong.',
      });

      const resSpace = await controller.applyPromo('   ');
      expect(resSpace.valid).toBe(false);
      expect(resSpace.discount).toBe(0);
    });

    it('applyPromo menolak kode promo yang tidak valid, kadaluarsa, atau habis kuota', async () => {
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue(null),
      };
      const controller = new TransactionController(undefined, undefined, undefined, mockPromo);

      const result = await controller.applyPromo('KODE_EXPIRED');
      expect(result).toEqual({
        valid: false,
        discount: 0,
        message: 'Kode promo tidak valid atau kuota promo telah habis.',
      });
      expect(controller.activePromo).toBeNull();
    });

    it('applyPromo berhasil menerapkan potongan harga jika kode valid dan kuota ada', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'VIP', harga: 100000 }),
      };
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue({
          kode_promo: 'HEMAT20',
          nominal_potongan: 20000,
          kuota_promo: 5,
        }),
      };
      const controller = new TransactionController(undefined, mockTicket, undefined, mockPromo);

      await controller.addItem(1, 1); // subtotal = 100000
      const result = await controller.applyPromo('HEMAT20');

      expect(result).toEqual({
        valid: true,
        discount: 20000,
        promoCode: 'HEMAT20',
        nominal_potongan: 20000,
      });
      expect(controller.activePromo).not.toBeNull();
      expect(controller.activePromo.kode_promo).toBe('HEMAT20');
    });

    it('applyPromo membatasi nominal diskon tidak melebihi subtotal (capped at subtotal)', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'Reguler', harga: 30000 }),
      };
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue({
          kode_promo: 'SUPER50',
          nominal_potongan: 50000,
          kuota_promo: 10,
        }),
      };
      const controller = new TransactionController(undefined, mockTicket, undefined, mockPromo);

      await controller.addItem(1, 1); // subtotal = 30000, nominal_potongan = 50000
      const result = await controller.applyPromo('SUPER50');

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(30000); // Harus dibatasi sebesar subtotal
      expect(result.nominal_potongan).toBe(50000);
    });
  });

  // ==========================================================================
  // 4. Validasi Pembayaran Tunai, Kembalian, dan Shortfall
  // ==========================================================================
  describe('4. Validasi Pembayaran Tunai & Kembalian (processPayment / processCashPayment)', () => {
    it('guard keranjang kosong: menolak processPayment jika tidak ada item di keranjang', async () => {
      const controller = new TransactionController();

      const result = await controller.processPayment(100000);
      expect(result).toEqual({
        success: false,
        message: 'Keranjang transaksi kosong',
      });
    });

    it('menolak pembayaran jika uang tunai kurang dari total tagihan (shortfall)', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'VIP', harga: 100000 }),
      };
      const controller = new TransactionController(undefined, mockTicket);

      await controller.addItem(1, 1); // subtotal = 100.000, totalBayar = 100.000
      const result = await controller.processPayment(75000);

      expect(result).toEqual({
        success: false,
        message: 'Nominal pembayaran tunai kurang.',
        totalBayar: 100000,
        cashAmount: 75000,
        shortfall: 25000,
      });
    });

    it('menolak pembayaran dengan uang tunai bernilai 0 atau negatif', async () => {
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'Reguler', harga: 50000 }),
      };
      const controller = new TransactionController(undefined, mockTicket);

      await controller.addItem(1, 1);
      const resZero = await controller.processPayment(0);
      expect(resZero.success).toBe(false);
      expect(resZero.shortfall).toBe(50000);

      const resNegative = await controller.processPayment(-10000);
      expect(resNegative.success).toBe(false);
      expect(resNegative.shortfall).toBe(60000); // 50000 - (-10000) = 60000
    });

    it('berhasil memproses pembayaran dengan uang pas (kembalian = 0)', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue({ insertId: 1 }) };
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'Batch 1', harga: 75000 }),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue({ id_detail: 101 }) };
      const mockItem = { create: jest.fn().mockResolvedValue(true) };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        undefined,
        undefined,
        mockDetail,
        mockItem
      );

      await controller.addItem(1, 1);
      const result = await controller.processPayment(75000);

      expect(result.success).toBe(true);
      expect(result.totalBayar).toBe(75000);
      expect(result.change).toBe(0);
      expect(result.noInvoice).toMatch(/^TRX-/);
      expect(controller.items).toHaveLength(0); // Keranjang direset
    });

    it('berhasil memproses pembayaran dengan uang lebih dan menghitung kembalian secara tepat', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue({ insertId: 2 }) };
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 2, tier: 'VIP', harga: 150000 }),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue({ id_detail: 201 }) };
      const mockItem = { create: jest.fn().mockResolvedValue(true) };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        undefined,
        undefined,
        mockDetail,
        mockItem
      );

      await controller.addItem(2, 1);
      const result = await controller.processPayment(200000);

      expect(result.success).toBe(true);
      expect(result.totalBayar).toBe(150000);
      expect(result.change).toBe(50000);
    });

    it('processCashPayment bertindak sebagai alias dari processPayment', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue(true) };
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'Reguler', harga: 50000 }),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue({ id_detail: 1 }) };
      const mockItem = { create: jest.fn().mockResolvedValue(true) };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        undefined,
        undefined,
        mockDetail,
        mockItem
      );

      await controller.addItem(1, 1);
      const result = await controller.processCashPayment(50000);
      expect(result.success).toBe(true);
      expect(result.totalBayar).toBe(50000);
    });
  });

  // ==========================================================================
  // 5. Integrasi Penyimpanan Transaksi, Detail, Tiket Item, dan Kuota Promo
  // ==========================================================================
  describe('5. Integrasi Persistensi Transaksi, Detail, Penerbitan E-Tiket & Pengurangan Kuota', () => {
    it('menyimpan record Transaksi dengan payload lengkap dan status PAID', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue({ insertId: 10 }) };
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'VIP', harga: 100000 }),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue({
          kode_promo: 'PROMO10',
          nominal_potongan: 10000,
        }),
        decrementKuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue({ id_detail: 50 }) };
      const mockItem = { create: jest.fn().mockResolvedValue(true) };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        undefined,
        mockPromo,
        mockDetail,
        mockItem
      );

      await controller.addItem(1, 1);
      await controller.applyPromo('PROMO10');

      const customerData = {
        no_invoice: 'INV-TEST-001',
        nama_pemesan: 'Ryan Akeyla',
        email_pemesan: 'ryan@comedy.id',
        no_telp_pemesan: '081234567890',
        id_pengguna: 5,
      };

      const result = await controller.processPayment(100000, customerData);
      expect(result.success).toBe(true);
      expect(result.totalBayar).toBe(90000); // 100k - 10k
      expect(result.change).toBe(10000);

      // Verifikasi Transaksi.saveTransaction
      expect(mockTrx.saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          no_invoice: 'INV-TEST-001',
          id_pengguna: 5,
          kode_promo: 'PROMO10',
          nama_pemesan: 'Ryan Akeyla',
          email_pemesan: 'ryan@comedy.id',
          no_telp_pemesan: '081234567890',
          metode_pembayaran: 'CASH',
          status_transaksi: 'PAID',
          total_bayar: 90000,
          nominal_kembalian: 10000,
        })
      );

      // Verifikasi pengurangan kuota promo
      expect(mockPromo.decrementKuota).toHaveBeenCalledWith('PROMO10');
    });

    it('menerbitkan tiket item unik per kuantitas dan memanggil decrementQuota tiket', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue(true) };
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 2, tier: 'Batch 1', harga: 75000 }),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue({ id_detail: 77 }) };
      const mockItem = { create: jest.fn().mockResolvedValue(true) };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        undefined,
        undefined,
        mockDetail,
        mockItem
      );

      // Beli 3 tiket
      await controller.addItem(2, 3);
      const result = await controller.processPayment(250000);

      expect(result.success).toBe(true);
      expect(mockTicket.decrementQuota).toHaveBeenCalledWith(2, 3);

      // Verifikasi penerbitan 3 tiket individual
      expect(mockItem.create).toHaveBeenCalledTimes(3);
      expect(result.tickets).toHaveLength(3);

      result.tickets.forEach((t) => {
        expect(t.kode_tiket).toMatch(/^TKT-[A-Z0-9]{8}$/);
        expect(t.qr_code_hash).toMatch(/^QRHASH-[a-f0-9]{24}$/);
        expect(t.tierId).toBe(2);
      });

      // Verifikasi payload create TiketItem
      expect(mockItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_detail: 77,
          status_kehadiran: 'Belum Hadir',
          waktu_checkin: null,
        })
      );
    });

    it('memproses add-on secara presisi: menyimpan detail dan memanggil decrementStok', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue(true) };
      const mockAddon = {
        checkStok: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 5, nama_item: 'Merch Mug', harga: 30000 }),
        decrementStok: jest.fn().mockResolvedValue(true),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue({ id_detail: 99 }) };
      const mockItem = { create: jest.fn() };

      const controller = new TransactionController(
        mockTrx,
        undefined,
        mockAddon,
        undefined,
        mockDetail,
        mockItem
      );

      await controller.addAddon(5, 2);
      const result = await controller.processPayment(60000);

      expect(result.success).toBe(true);
      expect(mockDetail.saveDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          id_tiket: null,
          id_addon: 5,
          kuantitas: 2,
          subtotal: 60000,
        })
      );
      expect(mockAddon.decrementStok).toHaveBeenCalledWith(5, 2);
      // Item tiket tidak boleh diterbitkan untuk add-on
      expect(mockItem.create).not.toHaveBeenCalled();
    });

    it('mereset daftar items dan activePromo setelah pembayaran sukses', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue(true) };
      const mockTicket = {
        checkQuota: jest.fn().mockResolvedValue(true),
        findById: jest.fn().mockResolvedValue({ id: 1, tier: 'VIP', harga: 100000 }),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue({ kode_promo: 'DISC5', nominal_potongan: 5000 }),
        decrementKuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue({ id_detail: 1 }) };
      const mockItem = { create: jest.fn().mockResolvedValue(true) };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        undefined,
        mockPromo,
        mockDetail,
        mockItem
      );

      await controller.addItem(1, 1);
      await controller.applyPromo('DISC5');
      expect(controller.items).toHaveLength(1);
      expect(controller.activePromo).not.toBeNull();

      await controller.processPayment(100000);
      expect(controller.items).toHaveLength(0);
      expect(controller.activePromo).toBeNull();
    });
  });

  // ==========================================================================
  // 6. Transaksi Online Mandiri (createPendingTransaction)
  // ==========================================================================
  describe('6. Pembuatan Transaksi Pending Daring (createPendingTransaction)', () => {
    it('membuat transaksi baru berstatus PENDING dengan potongan diskon jika ada promoCode', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue(true) };
      const mockTicket = {
        findById: jest.fn().mockResolvedValue({ id: 1, harga: 75000 }),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockAddon = {
        findById: jest.fn().mockResolvedValue({ id: 2, harga: 20000 }),
        decrementStok: jest.fn().mockResolvedValue(true),
      };
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue({ kode_promo: 'ONLINE15', nominal_potongan: 15000 }),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue(true) };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        mockAddon,
        mockPromo,
        mockDetail
      );

      const orderData = {
        no_invoice: 'TRX-ONLINE-123',
        promoCode: 'ONLINE15',
        nama_pemesan: 'Penonton Daring',
        email_pemesan: 'daring@standup.id',
        items: [
          { type: 'ticket', id: 1, price: 75000, qty: 2 }, // 150.000
          { type: 'addon', id: 2, price: 20000, qty: 1 },  // 20.000 -> subtotal = 170.000
        ],
      };

      const result = await controller.createPendingTransaction(orderData);
      expect(result).toEqual({
        success: true,
        noInvoice: 'TRX-ONLINE-123',
        totalBayar: 155000, // 170.000 - 15.000
        status: 'PENDING',
      });

      expect(mockTrx.saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          no_invoice: 'TRX-ONLINE-123',
          kode_promo: 'ONLINE15',
          status_transaksi: 'PENDING',
          total_bayar: 155000,
          nominal_kembalian: 0,
        })
      );

      expect(mockTicket.decrementQuota).toHaveBeenCalledWith(1, 2);
      expect(mockAddon.decrementStok).toHaveBeenCalledWith(2, 1);
    });

    it('mengambil harga dari model jika harga item tidak disediakan dalam orderData', async () => {
      const mockTrx = { saveTransaction: jest.fn().mockResolvedValue(true) };
      const mockTicket = {
        findById: jest.fn().mockResolvedValue({ id: 3, harga: 120000 }),
        decrementQuota: jest.fn().mockResolvedValue(true),
      };
      const mockDetail = { saveDetail: jest.fn().mockResolvedValue(true) };

      const controller = new TransactionController(
        mockTrx,
        mockTicket,
        undefined,
        undefined,
        mockDetail
      );

      const orderData = {
        items: [{ type: 'ticket', id: 3, qty: 1 }],
      };

      const result = await controller.createPendingTransaction(orderData);
      expect(result.success).toBe(true);
      expect(result.totalBayar).toBe(120000);
      expect(mockTicket.findById).toHaveBeenCalledWith(3);
    });
  });

  // ==========================================================================
  // 7. Riwayat Transaksi (getAllTransactions & getTransaction)
  // ==========================================================================
  describe('7. Query Riwayat Transaksi (getAllTransactions & getTransaction)', () => {
    it('getAllTransactions mendelegasikan ke model Transaksi.findAll', async () => {
      const mockTrxList = [
        new Transaksi('TRX-001', new Date(), 1, null, 'User 1', 'u1@mail.com', '081', 'CASH', 'PAID', 75000, 0),
        new Transaksi('TRX-002', new Date(), 2, null, 'User 2', 'u2@mail.com', '082', 'QRIS', 'PAID', 150000, 0),
      ];
      const mockTrx = {
        findAll: jest.fn().mockResolvedValue(mockTrxList),
      };
      const controller = new TransactionController(mockTrx);

      const list = await controller.getAllTransactions();
      expect(list).toHaveLength(2);
      expect(mockTrx.findAll).toHaveBeenCalledTimes(1);
    });

    it('getTransaction mendelegasikan ke model Transaksi.findByInvoice', async () => {
      const mockTrxObj = new Transaksi('TRX-999', new Date(), 1, null, 'User 9', 'u9@mail.com', '089', 'CASH', 'PAID', 50000, 0);
      const mockTrx = {
        findByInvoice: jest.fn().mockResolvedValue(mockTrxObj),
      };
      const controller = new TransactionController(mockTrx);

      const trx = await controller.getTransaction('TRX-999');
      expect(trx).toBe(mockTrxObj);
      expect(mockTrx.findByInvoice).toHaveBeenCalledWith('TRX-999');
    });
  });

  // ==========================================================================
  // 8. Isolasi Mocking Database Layer (pool.execute)
  // ==========================================================================
  describe('8. Mocking Isolasi Database Pool (Tanpa Koneksi MySQL)', () => {
    it('berjalan mulus end-to-end menggunakan real model instances dengan pool.execute di-mock', async () => {
      // Mock database queries yang dipanggil oleh real model instances
      pool.execute.mockImplementation(async (query, params) => {
        if (query.includes('FROM TIKET') && query.includes('sisa_kuota')) {
          return [[{ id: 1, tier: 'VIP', harga: 100000, sisa_kuota: 10 }]];
        }
        if (query.includes('FROM PROMO')) {
          return [[{ kode_promo: 'HEMAT10', nominal_potongan: 10000, kuota_promo: 5, tanggal_kadaluarsa: '2026-12-31' }]];
        }
        if (query.includes('INSERT INTO TRANSAKSI')) {
          return [{ insertId: 1, affectedRows: 1 }];
        }
        if (query.includes('INSERT INTO TRANSAKSI_DETAIL')) {
          return [{ insertId: 10, affectedRows: 1 }];
        }
        if (query.includes('UPDATE TIKET SET sisa_kuota')) {
          return [{ affectedRows: 1 }];
        }
        if (query.includes('INSERT INTO TIKET_ITEM')) {
          return [{ insertId: 100, affectedRows: 1 }];
        }
        if (query.includes('UPDATE PROMO SET kuota_promo')) {
          return [{ affectedRows: 1 }];
        }
        return [[]];
      });

      // Menggunakan real model classes yang terisolasi oleh mock pool
      const controller = new TransactionController();

      const addRes = await controller.addItem(1, 1);
      expect(addRes).toBe(true);

      const promoRes = await controller.applyPromo('HEMAT10');
      expect(promoRes.valid).toBe(true);
      expect(promoRes.discount).toBe(10000);

      const payRes = await controller.processPayment(100000);
      expect(payRes.success).toBe(true);
      expect(payRes.totalBayar).toBe(90000);
      expect(payRes.change).toBe(10000);
      expect(payRes.tickets).toHaveLength(1);
    });
  });
});
