/**
 * @jest-environment node
 */
/**
 * ============================================================================
 * MODUL          : Unit Test Promo Controller (PromoController.test.js)
 * REFERENSI      : DPPL-01 CLS-14 / SKPL KF-10, KF-12
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo (103112400081)
 * DESKRIPSI      : Pengujian unit komprehensif untuk PromoController (CLS-14)
 *                  mencakup validasi kode voucher aktif, kalkulasi diskon proporsional
 *                  terhadap subtotal, batas kadaluarsa, batas kuota habis, validasi
 *                  input pada createPromo, decrement kuota, dan isolasi database.
 * ============================================================================
 */

import pool from '@/config/db';
import { PromoController } from '@/controllers/PromoController';
import { Promo } from '@/models/Promo';

jest.mock('@/config/db', () => ({
  execute: jest.fn(),
}));

describe('Unit Testing PromoController (CLS-14 / KF-10, KF-12) - Ryan Akeyla (103112400081)', () => {
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
    it('menginisialisasi controller dengan model Promo default', () => {
      const controller = new PromoController();
      expect(controller.promoModel).toBeInstanceOf(Promo);
    });

    it('mendukung injeksi mock Promo melalui konstruktor dan setter', () => {
      const mockPromo = { findAll: jest.fn(), validatePromo: jest.fn() };
      const controller = new PromoController(mockPromo);

      expect(controller.promoModel).toBe(mockPromo);

      const replacementPromo = { findAll: jest.fn() };
      controller.promoModel = replacementPromo;
      expect(controller.promoModel).toBe(replacementPromo);
    });
  });

  // ==========================================================================
  // 2. Pengambilan Seluruh Data Promo (getAllPromos)
  // ==========================================================================
  describe('2. Pengambilan Seluruh Voucher Promo (getAllPromos)', () => {
    it('getAllPromos mendelegasikan pemanggilan ke promoModel.findAll', async () => {
      const promoList = [
        new Promo('HEMAT10', 10000, 50, '2026-12-31'),
        new Promo('KETAWA25', 25000, 20, '2026-12-31'),
      ];
      const mockPromo = {
        findAll: jest.fn().mockResolvedValue(promoList),
      };
      const controller = new PromoController(mockPromo);

      const result = await controller.getAllPromos();
      expect(result).toHaveLength(2);
      expect(result).toBe(promoList);
      expect(mockPromo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // 3. Pembuatan Promo Baru (createPromo) & Validasi Parameter
  // ==========================================================================
  describe('3. Pembuatan Voucher Promo Baru & Validasi Input (createPromo)', () => {
    it('mengembalikan true jika payload data kosong atau null', async () => {
      const controller = new PromoController();

      expect(await controller.createPromo(null)).toBe(true);
      expect(await controller.createPromo({})).toBe(true);
    });

    it('melempar Error jika kode_promo tidak diisi atau kosong', async () => {
      const controller = new PromoController();

      await expect(controller.createPromo({ nominal_potongan: 10000, kuota_promo: 50 }))
        .rejects.toThrow('Kode promo wajib diisi.');

      await expect(controller.createPromo({ kode_promo: '', nominal_potongan: 10000 }))
        .rejects.toThrow('Kode promo wajib diisi.');
    });

    it('melempar Error jika kuota_promo bernilai 0 atau negatif', async () => {
      const controller = new PromoController();

      await expect(controller.createPromo({
        kode_promo: 'ZEROKUOTA',
        nominal_potongan: 10000,
        kuota_promo: 0,
      })).rejects.toThrow('Kuota promo harus lebih dari 0.');

      await expect(controller.createPromo({
        kode_promo: 'NEGATIFKUOTA',
        nominal_potongan: 10000,
        kuota_promo: -10,
      })).rejects.toThrow('Kuota promo harus lebih dari 0.');
    });

    it('melempar Error jika nominal_potongan bernilai negatif', async () => {
      const controller = new PromoController();

      await expect(controller.createPromo({
        kode_promo: 'MINUSDISC',
        nominal_potongan: -5000,
        kuota_promo: 10,
      })).rejects.toThrow('Nominal potongan promo tidak boleh negatif.');
    });

    it('berhasil membuat voucher promo baru jika seluruh input valid', async () => {
      const createdPromo = new Promo('STANDUP20', 20000, 100, '2026-12-31');
      const mockPromo = {
        create: jest.fn().mockResolvedValue(createdPromo),
      };
      const controller = new PromoController(mockPromo);

      const input = {
        kode_promo: '  STANDUP20  ',
        nominal_potongan: 20000,
        kuota_promo: 100,
        tanggal_kadaluarsa: '2026-12-31',
      };

      const result = await controller.createPromo(input);

      expect(result).toBe(createdPromo);
      expect(mockPromo.create).toHaveBeenCalledWith({
        kode_promo: 'STANDUP20',
        nominal_potongan: 20000,
        kuota_promo: 100,
        tanggal_kadaluarsa: '2026-12-31',
      });
    });

    it('mengembalikan true jika create model mengembalikan nilai truthy non-objek', async () => {
      const mockPromo = {
        create: jest.fn().mockResolvedValue(true),
      };
      const controller = new PromoController(mockPromo);

      const result = await controller.createPromo({
        kode_promo: 'PROMOOK',
        nominal_potongan: 5000,
        kuota_promo: 10,
      });

      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // 4. Validasi & Penerapan Diskon Promo (applyPromo)
  // ==========================================================================
  describe('4. Validasi & Penerapan Diskon Promo (applyPromo)', () => {
    it('menolak jika parameter kode promo kosong, null, atau undefined', async () => {
      const controller = new PromoController();

      const resNull = await controller.applyPromo(null);
      expect(resNull).toEqual({
        valid: false,
        discount: 0,
        message: 'Kode promo wajib diisi.',
      });

      const resEmpty = await controller.applyPromo('');
      expect(resEmpty).toEqual({
        valid: false,
        discount: 0,
        message: 'Kode promo wajib diisi.',
      });

      const resUndefined = await controller.applyPromo(undefined);
      expect(resUndefined).toEqual({
        valid: false,
        discount: 0,
        message: 'Kode promo wajib diisi.',
      });
    });

    it('berhasil menerapkan diskon jika kode promo valid dan subtotal > nominal potongan', async () => {
      const mockPromoObj = new Promo('DISKON30', 30000, 15, '2026-12-31');
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue(mockPromoObj),
      };
      const controller = new PromoController(mockPromo);

      const result = await controller.applyPromo('DISKON30', 100000);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(30000);
      expect(result.promo).toEqual(mockPromoObj.toJSON());
      expect(mockPromo.validatePromo).toHaveBeenCalledWith('DISKON30');
    });

    it('membatasi nilai diskon tidak melebihi subtotal jika subtotal < nominal potongan (capped at subtotal)', async () => {
      const mockPromoObj = new Promo('SUPER50', 50000, 10, '2026-12-31');
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue(mockPromoObj),
      };
      const controller = new PromoController(mockPromo);

      // Subtotal hanya 25.000, sementara potongan 50.000
      const result = await controller.applyPromo('SUPER50', 25000);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(25000); // Diskon dibatasi sebesar subtotal
    });

    it('mengembalikan diskon sebesar nominal_potongan jika subtotal bernilai 0 atau tidak diberikan', async () => {
      const mockPromoObj = new Promo('HEMAT15', 15000, 20, '2026-12-31');
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue(mockPromoObj),
      };
      const controller = new PromoController(mockPromo);

      const result = await controller.applyPromo('HEMAT15', 0);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(15000);
    });

    it('menangani objek promo murni tanpa method toJSON secara aman', async () => {
      const plainPromo = {
        kode_promo: 'PLAIN20',
        nominal_potongan: 20000,
        kuota_promo: 5,
        tanggal_kadaluarsa: '2026-12-31',
      };
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue(plainPromo),
      };
      const controller = new PromoController(mockPromo);

      const result = await controller.applyPromo('PLAIN20', 80000);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(20000);
      expect(result.promo).toEqual(plainPromo);
    });
  });

  // ==========================================================================
  // 5. Pengujian Batas Kadaluarsa Promo
  // ==========================================================================
  describe('5. Pengujian Batas Kadaluarsa Promo', () => {
    it('menolak kode promo jika validatePromo mengembalikan null karena tanggal kadaluarsa terlewat', async () => {
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue(null),
      };
      const controller = new PromoController(mockPromo);

      const result = await controller.applyPromo('EXPIRED_VOUCHER', 100000);

      expect(result).toEqual({
        valid: false,
        discount: 0,
        message: 'Kode promo tidak valid, sudah kadaluarsa, atau kuota telah habis.',
      });
      expect(mockPromo.validatePromo).toHaveBeenCalledWith('EXPIRED_VOUCHER');
    });
  });

  // ==========================================================================
  // 6. Pengujian Kuota Promo Habis
  // ==========================================================================
  describe('6. Pengujian Kuota Promo Habis (kuota_promo <= 0)', () => {
    it('menolak kode promo jika validatePromo mengembalikan null karena kuota habis', async () => {
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue(null),
      };
      const controller = new PromoController(mockPromo);

      const result = await controller.applyPromo('OUT_OF_STOCK', 50000);

      expect(result).toEqual({
        valid: false,
        discount: 0,
        message: 'Kode promo tidak valid, sudah kadaluarsa, atau kuota telah habis.',
      });
    });
  });

  // ==========================================================================
  // 7. Pengujian Kode Promo Tidak Terdaftar
  // ==========================================================================
  describe('7. Pengujian Kode Promo Tidak Terdaftar', () => {
    it('menolak kode promo yang tidak ada di basis data', async () => {
      const mockPromo = {
        validatePromo: jest.fn().mockResolvedValue(null),
      };
      const controller = new PromoController(mockPromo);

      const result = await controller.applyPromo('KODE_GAIB', 50000);

      expect(result.valid).toBe(false);
      expect(result.discount).toBe(0);
      expect(result.message).toBe('Kode promo tidak valid, sudah kadaluarsa, atau kuota telah habis.');
    });
  });

  // ==========================================================================
  // 8. Pengujian Pengurangan Kuota (decrementKuota)
  // ==========================================================================
  describe('8. Pengurangan Kuota Promo (decrementKuota)', () => {
    it('decrementKuota mengembalikan false jika kode kosong atau null', async () => {
      const controller = new PromoController();

      expect(await controller.decrementKuota('')).toBe(false);
      expect(await controller.decrementKuota(null)).toBe(false);
      expect(await controller.decrementKuota(undefined)).toBe(false);
    });

    it('decrementKuota mendelegasikan pemanggilan ke promoModel.decrementKuota', async () => {
      const mockPromo = {
        decrementKuota: jest.fn().mockResolvedValue(true),
      };
      const controller = new PromoController(mockPromo);

      const res = await controller.decrementKuota('  HEMAT10  ');

      expect(res).toBe(true);
      expect(mockPromo.decrementKuota).toHaveBeenCalledWith('HEMAT10');
    });
  });

  // ==========================================================================
  // 9. Mocking Isolasi Database Pool (End-to-End dengan Real Promo Model)
  // ==========================================================================
  describe('9. Mocking Isolasi Basis Data Pool (Tanpa Koneksi MySQL)', () => {
    it('berhasil memvalidasi promo aktif dari database menggunakan prepared statement', async () => {
      pool.execute.mockImplementation(async (query, params) => {
        if (query.includes('FROM PROMO') && query.includes('WHERE kode_promo = ?')) {
          return [[
            {
              kode_promo: 'AKTIF20',
              nominal_potongan: 20000,
              kuota_promo: 10,
              tanggal_kadaluarsa: '2026-12-31',
            },
          ]];
        }
        return [[]];
      });

      const controller = new PromoController(); // Real Promo model
      const result = await controller.applyPromo('AKTIF20', 100000);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(20000);
      expect(result.promo.kode_promo).toBe('AKTIF20');
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT kode_promo, nominal_potongan, kuota_promo, tanggal_kadaluarsa FROM PROMO WHERE kode_promo = ? LIMIT 1'),
        ['AKTIF20']
      );
    });

    it('menolak kode promo di mana tanggal_kadaluarsa pada database telah lewat (Expired Date)', async () => {
      pool.execute.mockImplementation(async (query) => {
        if (query.includes('FROM PROMO')) {
          return [[
            {
              kode_promo: 'EXPIRED10',
              nominal_potongan: 10000,
              kuota_promo: 100,
              tanggal_kadaluarsa: '2020-01-01', // Past date
            },
          ]];
        }
        return [[]];
      });

      const controller = new PromoController();
      const result = await controller.applyPromo('EXPIRED10', 50000);

      expect(result.valid).toBe(false);
      expect(result.discount).toBe(0);
      expect(result.message).toBe('Kode promo tidak valid, sudah kadaluarsa, atau kuota telah habis.');
    });

    it('menolak kode promo di mana kuota_promo pada database bernilai 0 (Zero Quota)', async () => {
      pool.execute.mockImplementation(async (query) => {
        if (query.includes('FROM PROMO')) {
          return [[
            {
              kode_promo: 'HABISKUOTA',
              nominal_potongan: 15000,
              kuota_promo: 0, // Kuota habis
              tanggal_kadaluarsa: '2026-12-31',
            },
          ]];
        }
        return [[]];
      });

      const controller = new PromoController();
      const result = await controller.applyPromo('HABISKUOTA', 75000);

      expect(result.valid).toBe(false);
      expect(result.discount).toBe(0);
      expect(result.message).toBe('Kode promo tidak valid, sudah kadaluarsa, atau kuota telah habis.');
    });

    it('berhasil mengeksekusi decrementKuota pada database melalui real Promo model', async () => {
      pool.execute.mockImplementation(async (query, params) => {
        if (query.includes('UPDATE PROMO SET kuota_promo = kuota_promo - 1')) {
          return [{ affectedRows: 1 }];
        }
        return [[]];
      });

      const controller = new PromoController();
      const result = await controller.decrementKuota('AKTIF20');

      expect(result).toBe(true);
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE PROMO SET kuota_promo = kuota_promo - 1 WHERE kode_promo = ? AND kuota_promo > 0'),
        ['AKTIF20']
      );
    });

    it('berhasil menyimpan kode promo baru ke database melalui real Promo model', async () => {
      pool.execute.mockImplementation(async (query) => {
        if (query.includes('INSERT INTO PROMO')) {
          return [{ affectedRows: 1 }];
        }
        return [[]];
      });

      const controller = new PromoController();
      const result = await controller.createPromo({
        kode_promo: 'NEWPROMO',
        nominal_potongan: 25000,
        kuota_promo: 50,
        tanggal_kadaluarsa: '2026-12-31',
      });

      expect(result).toBeInstanceOf(Promo);
      expect(result.kode_promo).toBe('NEWPROMO');
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO PROMO (kode_promo, nominal_potongan, kuota_promo, tanggal_kadaluarsa)'),
        ['NEWPROMO', 25000, 50, '2026-12-31']
      );
    });
  });
});
