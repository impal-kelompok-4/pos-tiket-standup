/**
 * ============================================================================
 * MODUL          : Unit Test Entitas Model OOP (models.test.js)
 * REFERENSI      : DPPL-01 Bab 2.4 & SKPL (Spesifikasi Model)
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo (103112400081) - QA & Testing
 * DESKRIPSI      : Unit testing enkapsulasi (getter/setter) dan method dasar
 *                  untuk seluruh entitas model sistem tiket comedy.
 * ============================================================================
 */

import { Pengguna } from '@/models/Pengguna';
import { Promo } from '@/models/Promo';
import { Tiket } from '@/models/Tiket';
import { Addon } from '@/models/Addon';
import { Transaksi } from '@/models/Transaksi';
import { TransaksiDetail } from '@/models/TransaksiDetail';
import { TiketItem } from '@/models/TiketItem';
import pool from '@/config/db';

jest.mock('@/config/db', () => ({
  execute: jest.fn(),
}));

describe('Unit Testing Entitas Model OOP', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Pengguna Entity', () => {
    it('harus menginisialisasi atribut private dan bekerja dengan getter/setter', () => {
      const user = new Pengguna(1, 'kasir01', 'pass123', 'kasir');
      expect(user.id).toBe(1);
      expect(user.username).toBe('kasir01');
      expect(user.password_hash).toBe('pass123');
      expect(user.role).toBe('kasir');

      user.username = 'kasir02';
      expect(user.username).toBe('kasir02');

      const json = user.toJSON();
      expect(json).toEqual({ id: 1, username: 'kasir02', role: 'kasir' });
      expect(json.password_hash).toBeUndefined();
    });

    it('berhasil login jika kredensial sesuai di database', async () => {
      pool.execute.mockResolvedValueOnce([
        [{ id: 1, username: 'kasir01', password_hash: 'secret', role: 'kasir' }],
      ]);

      const loggedIn = await Pengguna.login('kasir01', 'secret');
      expect(loggedIn).not.toBeNull();
      expect(loggedIn.username).toBe('kasir01');
      expect(loggedIn.role).toBe('kasir');
    });

    it('gagal login jika password tidak sesuai', async () => {
      pool.execute.mockResolvedValueOnce([
        [{ id: 1, username: 'kasir01', password_hash: 'secret', role: 'kasir' }],
      ]);

      const loggedIn = await Pengguna.login('kasir01', 'wrongpass');
      expect(loggedIn).toBeNull();
    });

    it('gagal login jika user tidak ditemukan', async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const loggedIn = await Pengguna.login('ghost_user', 'anypass');
      expect(loggedIn).toBeNull();
    });
  });

  describe('Promo Entity', () => {
    it('harus bekerja dengan getter dan setter', () => {
      const promo = new Promo('KETAWA10', 10000, 50, '2026-12-31');
      expect(promo.kode_promo).toBe('KETAWA10');
      expect(promo.nominal_potongan).toBe(10000);
      expect(promo.kuota_promo).toBe(50);
      expect(promo.tanggal_kadaluarsa).toBe('2026-12-31');

      promo.kuota_promo = 49;
      expect(promo.kuota_promo).toBe(49);
    });
  });

  describe('Tiket Entity', () => {
    it('harus menyimpan data tier tiket dan kuota', () => {
      const tiket = new Tiket(1, 'VIP', 150000, 25);
      expect(tiket.tier).toBe('VIP');
      expect(tiket.harga).toBe(150000);
      expect(tiket.sisa_kuota).toBe(25);
    });
  });

  describe('Addon Entity', () => {
    it('harus menyimpan katalog produk snack/merchandise', () => {
      const addon = new Addon(1, 'Popcorn Caramel', 20000, 75);
      expect(addon.nama_item).toBe('Popcorn Caramel');
      expect(addon.harga).toBe(20000);
      expect(addon.stok).toBe(75);
    });
  });

  describe('Transaksi & TransaksiDetail Entity', () => {
    it('harus menginisialisasi transaksi dan rincian transaksi', () => {
      const trx = new Transaksi(
        'TRX-001',
        new Date('2026-10-24'),
        1,
        'KETAWA10',
        'Budi',
        'budi@mail.com',
        '08123456789',
        'CASH',
        'PAID',
        170000,
        30000
      );
      expect(trx.no_invoice).toBe('TRX-001');
      expect(trx.metode_pembayaran).toBe('CASH');
      expect(trx.total_bayar).toBe(170000);

      const detail = new TransaksiDetail(1, 'TRX-001', 2, null, 2, 150000);
      expect(detail.id_detail).toBe(1);
      expect(detail.no_invoice).toBe('TRX-001');
      expect(detail.kuantitas).toBe(2);
      expect(detail.subtotal).toBe(150000);
    });
  });

  describe('TiketItem Entity', () => {
    it('harus menyimpan data barcode QR dan status kehadiran gate', () => {
      const item = new TiketItem('TKT-001', 1, 'QR-HASH-001', 'Belum Hadir', null);
      expect(item.kode_tiket).toBe('TKT-001');
      expect(item.qr_code_hash).toBe('QR-HASH-001');
      expect(item.status_kehadiran).toBe('Belum Hadir');

      item.status_kehadiran = 'Checked-In';
      expect(item.status_kehadiran).toBe('Checked-In');
    });
  });
});
