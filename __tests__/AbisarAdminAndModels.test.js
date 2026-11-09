/**
 * @jest-environment node
 */
/**
 * ============================================================================
 * MODUL          : Unit Test Model Helpers, Controllers & API Admin (AbisarAdminAndModels.test.js)
 * REFERENSI      : DPPL-01 Bab 2.4 & SKPL KF-08, KF-09, KF-10, KF-12, KF-13
 * PENGEMBANG     : Abisar Fathir (103112400068) - Database MySQL & Endpoint Admin
 * DESKRIPSI      : Unit testing menyeluruh untuk helper methods prepared statements
 *                  pada entitas model, OOP Controllers, dan Route Handlers API Admin.
 * ============================================================================
 */

import pool from '@/config/db';
import { Tiket } from '@/models/Tiket';
import { Addon } from '@/models/Addon';
import { Promo } from '@/models/Promo';
import { Transaksi } from '@/models/Transaksi';
import { TransaksiDetail } from '@/models/TransaksiDetail';
import { TiketItem } from '@/models/TiketItem';
import { EventController } from '@/controllers/EventController';
import { AddonController } from '@/controllers/AddonController';
import { PromoController } from '@/controllers/PromoController';
import { ReportController } from '@/controllers/ReportController';

import { GET as getTickets, POST as postTickets } from '@/app/api/tickets/route';
import { GET as getAddons, POST as postAddons } from '@/app/api/addons/route';
import { POST as postValidatePromo } from '@/app/api/promos/validate/route';
import { GET as getReportsSummary } from '@/app/api/reports/summary/route';

jest.mock('@/config/db', () => ({
  execute: jest.fn(),
}));

describe('Pengujian Model Helpers, Controllers, dan API Admin (PIC: Abisar Fathir)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Tiket Entity (CLS-04 / KF-08)', () => {
    it('checkQuota mengembalikan true jika sisa kuota >= permintaan', async () => {
      pool.execute.mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }]]);
      const available = await Tiket.checkQuota(2, 5);
      expect(available).toBe(true);
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, tier, harga, sisa_kuota FROM TIKET'),
        [2]
      );
    });

    it('checkQuota mengembalikan false jika kuota tidak mencukupi atau tidak ditemukan', async () => {
      pool.execute.mockResolvedValueOnce([[{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 2 }]]);
      const available = await Tiket.checkQuota(2, 5);
      expect(available).toBe(false);

      pool.execute.mockResolvedValueOnce([[]]);
      const notFound = await Tiket.checkQuota(99, 1);
      expect(notFound).toBe(false);
    });

    it('findAll mengambil seluruh data tier tiket', async () => {
      pool.execute.mockResolvedValueOnce([
        [
          { id: 1, tier: 'Early Bird', harga: 50000, sisa_kuota: 0 },
          { id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 120 },
        ],
      ]);
      const tickets = await Tiket.findAll();
      expect(tickets).toHaveLength(2);
      expect(tickets[0]).toBeInstanceOf(Tiket);
      expect(tickets[0].tier).toBe('Early Bird');
    });

    it('findById mengambil detail tier tiket', async () => {
      pool.execute.mockResolvedValueOnce([
        [{ id: 3, tier: 'Batch 2', harga: 100000, sisa_kuota: 80 }],
      ]);
      const ticket = await Tiket.findById(3);
      expect(ticket).not.toBeNull();
      expect(ticket.tier).toBe('Batch 2');
    });

    it('updateQuota memperbarui sisa kuota tiket', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await Tiket.updateQuota(2, 150);
      expect(res).toBe(true);
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE TIKET SET sisa_kuota = ?'),
        [150, 2]
      );
    });

    it('decrementQuota mengurangi kuota tiket jika sisa mencukupi', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await Tiket.decrementQuota(2, 2);
      expect(res).toBe(true);
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('sisa_kuota = sisa_kuota - ?'),
        [2, 2, 2]
      );
    });
  });

  describe('2. Addon Entity (CLS-05 / KF-09)', () => {
    it('checkStok mengembalikan status ketersediaan stok', async () => {
      pool.execute.mockResolvedValueOnce([
        [{ id: 1, nama_item: 'Popcorn', harga: 15000, stok: 20 }],
      ]);
      const available = await Addon.checkStok(1, 10);
      expect(available).toBe(true);

      pool.execute.mockResolvedValueOnce([
        [{ id: 1, nama_item: 'Popcorn', harga: 15000, stok: 5 }],
      ]);
      const notEnough = await Addon.checkStok(1, 10);
      expect(notEnough).toBe(false);
    });

    it('findAll mengambil seluruh katalog addon', async () => {
      pool.execute.mockResolvedValueOnce([
        [
          { id: 1, nama_item: 'Popcorn', harga: 15000, stok: 20 },
          { id: 2, nama_item: 'Cola', harga: 10000, stok: 50 },
        ],
      ]);
      const items = await Addon.findAll();
      expect(items).toHaveLength(2);
      expect(items[0]).toBeInstanceOf(Addon);
      expect(items[0].nama_item).toBe('Popcorn');
    });

    it('create menambahkan item addon baru', async () => {
      pool.execute.mockResolvedValueOnce([{ insertId: 6 }]);
      const newAddon = await Addon.create({
        nama_item: 'Tumbler Comedy',
        harga: 45000,
        stok: 30,
      });
      expect(newAddon).toBeInstanceOf(Addon);
      expect(newAddon.id).toBe(6);
      expect(newAddon.nama_item).toBe('Tumbler Comedy');
    });

    it('updateStok memperbarui stok addon', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await Addon.updateStok(1, 80);
      expect(res).toBe(true);

      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const decRes = await Addon.decrementStok(1, 5);
      expect(decRes).toBe(true);
    });
  });

  describe('3. Promo Entity (CLS-06 / KF-10, KF-12)', () => {
    it('validatePromo mengembalikan Promo jika kode valid, kuota > 0, dan belum kadaluarsa', async () => {
      pool.execute.mockResolvedValueOnce([
        [
          {
            kode_promo: 'KETAWA10',
            nominal_potongan: 10000,
            kuota_promo: 50,
            tanggal_kadaluarsa: '2026-12-31',
          },
        ],
      ]);
      const promo = await Promo.validatePromo('KETAWA10');
      expect(promo).not.toBeNull();
      expect(promo.kode_promo).toBe('KETAWA10');
      expect(promo.nominal_potongan).toBe(10000);
    });

    it('validatePromo menolak jika kuota promo habis (kuota <= 0)', async () => {
      pool.execute.mockResolvedValueOnce([
        [
          {
            kode_promo: 'OPENING10',
            nominal_potongan: 10000,
            kuota_promo: 0,
            tanggal_kadaluarsa: '2026-12-31',
          },
        ],
      ]);
      const promo = await Promo.validatePromo('OPENING10');
      expect(promo).toBeNull();
    });

    it('validatePromo menolak jika kode telah kadaluarsa', async () => {
      pool.execute.mockResolvedValueOnce([
        [
          {
            kode_promo: 'EXPIRED10',
            nominal_potongan: 10000,
            kuota_promo: 20,
            tanggal_kadaluarsa: '2020-01-01',
          },
        ],
      ]);
      const promo = await Promo.validatePromo('EXPIRED10');
      expect(promo).toBeNull();
    });

    it('decrementKuota mengurangi kuota promo', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await Promo.decrementKuota('KETAWA10');
      expect(res).toBe(true);
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('kuota_promo = kuota_promo - 1'),
        ['KETAWA10']
      );
    });

    it('create menyimpan voucher promo baru', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const created = await Promo.create({
        kode_promo: 'NEWPROMO',
        nominal_potongan: 25000,
        kuota_promo: 100,
        tanggal_kadaluarsa: '2026-12-31',
      });
      expect(created.kode_promo).toBe('NEWPROMO');
      expect(created.nominal_potongan).toBe(25000);
    });
  });

  describe('4. Transaksi & TransaksiDetail Entity (CLS-02, CLS-03)', () => {
    it('saveTransaction menyimpan record transaksi baru', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const trx = new Transaksi(
        'TRX-101',
        new Date(),
        2,
        'KETAWA10',
        'Budi',
        'budi@test.com',
        '08123',
        'CASH',
        'PAID',
        170000,
        30000
      );
      const saved = await trx.saveTransaction();
      expect(saved).toBe(true);
    });

    it('updateStatus memperbarui status transaksi', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const updated = await Transaksi.updateStatus('TRX-101', 'PAID');
      expect(updated).toBe(true);
    });

    it('findByInvoice mengambil transaksi sesuai nomor invoice', async () => {
      pool.execute.mockResolvedValueOnce([
        [
          {
            no_invoice: 'TRX-101',
            waktu_transaksi: new Date(),
            id_pengguna: 2,
            kode_promo: null,
            nama_pemesan: 'Budi',
            email_pemesan: 'budi@test.com',
            no_telp_pemesan: '08123',
            metode_pembayaran: 'CASH',
            status_transaksi: 'PAID',
            total_bayar: 100000,
            nominal_kembalian: 0,
          },
        ],
      ]);
      const trx = await Transaksi.findByInvoice('TRX-101');
      expect(trx).not.toBeNull();
      expect(trx.no_invoice).toBe('TRX-101');
    });

    it('getReportSummary mengakumulasi data omzet dan tiket terjual', async () => {
      pool.execute
        .mockResolvedValueOnce([[{ totalRevenue: 500000, totalTransactions: 4 }]])
        .mockResolvedValueOnce([[{ totalTicketsSold: 8 }]])
        .mockResolvedValueOnce([[{ tanggal: '2026-10-24', omzet: 500000, jumlah_transaksi: 4 }]]);

      const summary = await Transaksi.getReportSummary();
      expect(summary.totalRevenue).toBe(500000);
      expect(summary.totalTransactions).toBe(4);
      expect(summary.totalTicketsSold).toBe(8);
      expect(summary.dailyRevenue).toHaveLength(1);
    });

    it('saveDetail dan findByInvoice pada TransaksiDetail', async () => {
      pool.execute.mockResolvedValueOnce([{ insertId: 10 }]);
      const detail = new TransaksiDetail(null, 'TRX-101', 2, null, 2, 150000);
      const savedDetail = await detail.saveDetail();
      expect(savedDetail.id_detail).toBe(10);

      pool.execute.mockResolvedValueOnce([
        [{ id_detail: 10, no_invoice: 'TRX-101', id_tiket: 2, id_addon: null, kuantitas: 2, subtotal: 150000 }],
      ]);
      const details = await TransaksiDetail.findByInvoice('TRX-101');
      expect(details).toHaveLength(1);
      expect(details[0].subtotal).toBe(150000);
    });
  });

  describe('5. TiketItem Entity (CLS-07 / KF-06, KF-07)', () => {
    it('create menyimpan record tiket item baru', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const item = await TiketItem.create({
        kode_tiket: 'TKT-999',
        id_detail: 1,
        qr_code_hash: 'QR-TEST-999',
        status_kehadiran: 'Belum Hadir',
      });
      expect(item.kode_tiket).toBe('TKT-999');
      expect(item.status_kehadiran).toBe('Belum Hadir');
    });

    it('verifyAndMarkCheckedIn berhasil pada tiket valid Belum Hadir', async () => {
      // Mock findByHash
      pool.execute.mockResolvedValueOnce([
        [
          {
            kode_tiket: 'TKT-003',
            id_detail: 3,
            qr_code_hash: 'QR-HASH-VALID',
            status_kehadiran: 'Belum Hadir',
            waktu_checkin: null,
          },
        ],
      ]);
      // Mock update
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await TiketItem.verifyAndMarkCheckedIn('QR-HASH-VALID');
      expect(res.success).toBe(true);
      expect(res.status).toBe('VALID');
      expect(res.ticket.status_kehadiran).toBe('Checked-In');
    });

    it('verifyAndMarkCheckedIn menolak tiket yang sudah Checked-In (anti double check-in)', async () => {
      pool.execute.mockResolvedValueOnce([
        [
          {
            kode_tiket: 'TKT-001',
            id_detail: 1,
            qr_code_hash: 'QR-HASH-ALREADY-USED',
            status_kehadiran: 'Checked-In',
            waktu_checkin: '2026-10-24 19:45:10',
          },
        ],
      ]);

      const res = await TiketItem.verifyAndMarkCheckedIn('QR-HASH-ALREADY-USED');
      expect(res.success).toBe(false);
      expect(res.status).toBe('ALREADY_USED');
    });

    it('verifyAndMarkCheckedIn menolak tiket palsu / tidak terdaftar', async () => {
      pool.execute.mockResolvedValueOnce([[]]);
      const res = await TiketItem.verifyAndMarkCheckedIn('QR-FAKE');
      expect(res.success).toBe(false);
      expect(res.status).toBe('INVALID');
    });
  });

  describe('6. Controllers (CLS-12, CLS-13, CLS-14, CLS-15)', () => {
    it('EventController mengelola tier dan kuota tiket', async () => {
      const mockTiket = new Tiket();
      jest.spyOn(mockTiket, 'findAll').mockResolvedValueOnce([new Tiket(2, 'Batch 1', 75000, 100)]);
      jest.spyOn(mockTiket, 'checkQuota').mockResolvedValueOnce(true);
      jest.spyOn(mockTiket, 'updateQuota').mockResolvedValueOnce(true);

      const ctrl = new EventController(mockTiket);
      const tiers = await ctrl.getAllTiers();
      expect(tiers).toHaveLength(1);

      const avail = await ctrl.checkAvailability(2, 2);
      expect(avail).toBe(true);

      const updated = await ctrl.updateQuota(2, 80);
      expect(updated).toBe(true);

      await expect(ctrl.updateQuota(2, -5)).rejects.toThrow('tidak boleh bernilai negatif');
    });

    it('AddonController mengelola katalog dan stok addon dengan validasi', async () => {
      const mockAddon = new Addon();
      jest.spyOn(mockAddon, 'findAll').mockResolvedValueOnce([new Addon(1, 'Popcorn', 15000, 50)]);
      jest.spyOn(mockAddon, 'create').mockResolvedValueOnce(new Addon(2, 'Soda', 10000, 40));

      const ctrl = new AddonController(mockAddon);
      const items = await ctrl.getAddons();
      expect(items).toHaveLength(1);

      const created = await ctrl.saveAddon({ nama_item: 'Soda', harga: 10000, stok: 40 });
      expect(created.nama_item).toBe('Soda');

      await expect(ctrl.saveAddon({ nama_item: 'Invalid', harga: -1000, stok: 10 })).rejects.toThrow(
        'tidak boleh bernilai negatif'
      );
    });

    it('PromoController memvalidasi diskon dan menerapkan kode promo', async () => {
      const mockPromo = new Promo();
      jest.spyOn(mockPromo, 'validatePromo').mockImplementation(async (code) => {
        if (code === 'KETAWA10') return new Promo('KETAWA10', 10000, 50, '2026-12-31');
        return null;
      });

      const ctrl = new PromoController(mockPromo);
      const validRes = await ctrl.applyPromo('KETAWA10', 100000);
      expect(validRes.valid).toBe(true);
      expect(validRes.discount).toBe(10000);

      const capRes = await ctrl.applyPromo('KETAWA10', 7000);
      expect(capRes.discount).toBe(7000);

      const invalidRes = await ctrl.applyPromo('UNKNOWN', 100000);
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.discount).toBe(0);

      await expect(ctrl.createPromo({ kode_promo: 'FAIL', kuota_promo: 0 })).rejects.toThrow(
        'harus lebih dari 0'
      );
    });

    it('ReportController mengumpulkan ringkasan penjualan', async () => {
      const mockTrx = new Transaksi();
      jest.spyOn(mockTrx, 'getReportSummary').mockResolvedValueOnce({
        totalRevenue: 1000000,
        totalTicketsSold: 12,
        totalTransactions: 6,
        dailyRevenue: [],
      });

      const ctrl = new ReportController(mockTrx);
      const summary = await ctrl.fetchReportData();
      expect(summary.totalRevenue).toBe(1000000);
      expect(summary.totalTicketsSold).toBe(12);
    });
  });

  describe('7. API Route Handlers (/api/)', () => {
    it('GET /api/tickets mengembalikan daftar tiket', async () => {
      pool.execute.mockResolvedValueOnce([
        [{ id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 120 }],
      ]);
      const res = await getTickets();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data[0].tier).toBe('Batch 1');
    });

    it('POST /api/tickets memperbarui kuota tiket', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const req = new Request('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: 2, sisa_kuota: 90 }),
      });
      const res = await postTickets(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.sisa_kuota).toBe(90);
    });

    it('GET /api/addons mengembalikan katalog addon', async () => {
      pool.execute.mockResolvedValueOnce([
        [{ id: 1, nama_item: 'Popcorn', harga: 15000, stok: 50 }],
      ]);
      const res = await getAddons();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data[0].nama_item).toBe('Popcorn');
    });

    it('POST /api/addons menambahkan produk addon baru', async () => {
      pool.execute.mockResolvedValueOnce([{ insertId: 7 }]);
      const req = new Request('http://localhost/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_item: 'Pin Logo', harga: 10000, stok: 100 }),
      });
      const res = await postAddons(req);
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.nama_item).toBe('Pin Logo');
    });

    it('POST /api/promos/validate memvalidasi kode promo dan potongan diskon', async () => {
      pool.execute.mockResolvedValueOnce([
        [
          {
            kode_promo: 'KETAWA10',
            nominal_potongan: 10000,
            kuota_promo: 40,
            tanggal_kadaluarsa: '2026-12-31',
          },
        ],
      ]);
      const req = new Request('http://localhost/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode: 'KETAWA10', subtotal: 80000 }),
      });
      const res = await postValidatePromo(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.valid).toBe(true);
      expect(json.discount).toBe(10000);
    });

    it('GET /api/reports/summary mengembalikan agregasi omzet dan penjualan', async () => {
      pool.execute
        .mockResolvedValueOnce([[{ totalRevenue: 850000, totalTransactions: 5 }]])
        .mockResolvedValueOnce([[{ totalTicketsSold: 10 }]])
        .mockResolvedValueOnce([[]]);

      const res = await getReportsSummary();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.totalRevenue).toBe(850000);
      expect(json.data.totalTicketsSold).toBe(10);
    });
  });
});
