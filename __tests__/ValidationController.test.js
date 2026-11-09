/**
 * @jest-environment node
 */
/**
 * ============================================================================
 * MODUL          : Unit Test Validation Controller (ValidationController.test.js)
 * REFERENSI      : DPPL-01 CLS-16 / SKPL KF-06, KF-07
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo (103112400081)
 * DESKRIPSI      : Pengujian unit komprehensif untuk ValidationController (CLS-16)
 *                  mencakup verifikasi e-tiket valid di gate, penolakan tiket palsu,
 *                  proteksi anti-double-checkin, method setCheckedIn, penanganan
 *                  offline resilience, serta isolasi database mock.
 * ============================================================================
 */

import pool from '@/config/db';
import { ValidationController } from '@/controllers/ValidationController';
import { TiketItem } from '@/models/TiketItem';

jest.mock('@/config/db', () => ({
  execute: jest.fn(),
}));

describe('Unit Testing ValidationController (CLS-16 / KF-06, KF-07) - Ryan Akeyla (103112400081)', () => {
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
    it('menginisialisasi controller dengan model TiketItem default', () => {
      const controller = new ValidationController();
      expect(controller.tiketItemModel).toBeInstanceOf(TiketItem);
    });

    it('mendukung injeksi mock TiketItem melalui konstruktor dan setter', () => {
      const mockItem = { findByHash: jest.fn(), verifyAndMarkCheckedIn: jest.fn() };
      const controller = new ValidationController(mockItem);

      expect(controller.tiketItemModel).toBe(mockItem);

      const replacementItem = { findByHash: jest.fn() };
      controller.tiketItemModel = replacementItem;
      expect(controller.tiketItemModel).toBe(replacementItem);
    });
  });

  // ==========================================================================
  // 2. Validasi Input Payload QR Code
  // ==========================================================================
  describe('2. Validasi Parameter Input QR Code Payload', () => {
    it('menolak payload QR yang kosong, null, atau undefined', async () => {
      const controller = new ValidationController();

      const resNull = await controller.validateQR(null);
      expect(resNull).toEqual({
        isValid: false,
        message: 'Payload QR code tidak boleh kosong',
      });

      const resUndefined = await controller.validateQR(undefined);
      expect(resUndefined).toEqual({
        isValid: false,
        message: 'Payload QR code tidak boleh kosong',
      });

      const resEmpty = await controller.validateQR('');
      expect(resEmpty).toEqual({
        isValid: false,
        message: 'Payload QR code tidak boleh kosong',
      });

      const resWhitespace = await controller.validateQR('    ');
      expect(resWhitespace).toEqual({
        isValid: false,
        message: 'Payload QR code tidak boleh kosong',
      });
    });
  });

  // ==========================================================================
  // 3. Pengujian Tiket Palsu / Tidak Terdaftar
  // ==========================================================================
  describe('3. Verifikasi Tiket Palsu / Tidak Terdaftar', () => {
    it('menolak tiket jika QR hash tidak ditemukan di database (findByHash null)', async () => {
      const mockItem = {
        findByHash: jest.fn().mockResolvedValue(null),
        verifyAndMarkCheckedIn: jest.fn(),
      };
      const controller = new ValidationController(mockItem);

      const result = await controller.validateQR('QR-PALSU-XYZ-999');

      expect(result).toEqual({
        isValid: false,
        message: 'Tiket palsu atau tidak terdaftar',
      });
      expect(mockItem.findByHash).toHaveBeenCalledWith('QR-PALSU-XYZ-999');
      // Jangan pernah memanggil check-in jika tiket tidak terdaftar
      expect(mockItem.verifyAndMarkCheckedIn).not.toHaveBeenCalled();
    });

    it('menolak tiket jika pencarian database mengalami error selain ECONNREFUSED', async () => {
      const mockItem = {
        findByHash: jest.fn().mockRejectedValue(new Error('Syntax error or DB table missing')),
        verifyAndMarkCheckedIn: jest.fn(),
      };
      const controller = new ValidationController(mockItem);

      const result = await controller.validateQR('QR-ERROR-HASH');

      expect(result).toEqual({
        isValid: false,
        message: 'Tiket palsu atau tidak terdaftar',
      });
      expect(mockItem.verifyAndMarkCheckedIn).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 4. Pengujian Tiket Valid (Happy Path)
  // ==========================================================================
  describe('4. Verifikasi Tiket Valid & Check-in Sukses (Happy Path)', () => {
    it('berhasil memvalidasi e-tiket valid dan berstatus Belum Hadir', async () => {
      const fakeTicket = new TiketItem(
        'TKT-ABC12345',
        10,
        'QR-HASH-VALID-123',
        'Belum Hadir',
        null
      );

      const mockItem = {
        findByHash: jest.fn().mockResolvedValue(fakeTicket),
        verifyAndMarkCheckedIn: jest.fn().mockResolvedValue({
          success: true,
          status: 'VALID',
          message: 'Check-in berhasil',
        }),
      };
      const controller = new ValidationController(mockItem);

      const result = await controller.validateQR('  QR-HASH-VALID-123  ');

      expect(result).toEqual({
        isValid: true,
        message: 'Check-in berhasil! Selamat menikmati pertunjukan',
        ticketCode: 'TKT-ABC12345',
      });

      // Verifikasi pemanggilan findByHash dengan string trimmed
      expect(mockItem.findByHash).toHaveBeenCalledWith('QR-HASH-VALID-123');
      expect(mockItem.verifyAndMarkCheckedIn).toHaveBeenCalledWith('QR-HASH-VALID-123');

      // Verifikasi status lokal tiket dimutasi menjadi Checked-In dengan waktu checkin
      expect(fakeTicket.status_kehadiran).toBe('Checked-In');
      expect(fakeTicket.waktu_checkin).toBeInstanceOf(Date);
    });
  });

  // ==========================================================================
  // 5. Pengujian Proteksi Anti-Double-Checkin
  // ==========================================================================
  describe('5. Proteksi Anti-Double-Checkin Gate Scanner', () => {
    it('menolak tiket yang saat dicari sudah berstatus Checked-In (alreadyCheckedIn: true)', async () => {
      const checkinDate = new Date('2026-11-09T18:00:00Z');
      const usedTicket = new TiketItem(
        'TKT-SUDAH-PAKAI',
        20,
        'QR-HASH-USED-888',
        'Checked-In',
        checkinDate
      );

      const mockItem = {
        findByHash: jest.fn().mockResolvedValue(usedTicket),
        verifyAndMarkCheckedIn: jest.fn(),
      };
      const controller = new ValidationController(mockItem);

      const result = await controller.validateQR('QR-HASH-USED-888');

      expect(result).toEqual({
        isValid: false,
        message: 'Tiket sudah digunakan sebelumnya',
        alreadyCheckedIn: true,
        ticketCode: 'TKT-SUDAH-PAKAI',
        checkinTime: checkinDate,
      });

      // verifyAndMarkCheckedIn tidak boleh dipanggil ulang untuk tiket yang sudah checked in
      expect(mockItem.verifyAndMarkCheckedIn).not.toHaveBeenCalled();
    });

    it('menolak jika verifyAndMarkCheckedIn mengembalikan status ALREADY_USED (race condition guard)', async () => {
      const freshTicket = new TiketItem(
        'TKT-RACE-001',
        30,
        'QR-HASH-RACE',
        'Belum Hadir',
        null
      );

      const mockItem = {
        findByHash: jest.fn().mockResolvedValue(freshTicket),
        verifyAndMarkCheckedIn: jest.fn().mockResolvedValue({
          success: false,
          status: 'ALREADY_USED',
          alreadyCheckedIn: true,
          message: 'Tiket sudah digunakan sebelumnya',
        }),
      };
      const controller = new ValidationController(mockItem);

      const result = await controller.validateQR('QR-HASH-RACE');

      expect(result).toEqual({
        isValid: false,
        message: 'Tiket sudah digunakan sebelumnya',
        alreadyCheckedIn: true,
      });
      // Objek lokal tidak boleh dimutasi ke Checked-In jika update database gagal
      expect(freshTicket.status_kehadiran).toBe('Belum Hadir');
    });

    it('menolak pada pemindaian kedua berturut-turut untuk objek tiket yang sama (Stateful Verification)', async () => {
      const ticket = new TiketItem('TKT-DOUBLE-01', 40, 'QR-DOUBLE-SCAN', 'Belum Hadir', null);

      const mockItem = {
        findByHash: jest.fn().mockImplementation(async () => ticket),
        verifyAndMarkCheckedIn: jest.fn().mockImplementation(async () => {
          if (ticket.status_kehadiran === 'Checked-In') {
            return { success: false, status: 'ALREADY_USED', alreadyCheckedIn: true };
          }
          return { success: true, status: 'VALID' };
        }),
      };
      const controller = new ValidationController(mockItem);

      // Pemindaian pertama di gerbang: Sukses
      const scan1 = await controller.validateQR('QR-DOUBLE-SCAN');
      expect(scan1.isValid).toBe(true);
      expect(scan1.ticketCode).toBe('TKT-DOUBLE-01');

      // Pemindaian kedua dengan QR code yang sama: Ditolak
      const scan2 = await controller.validateQR('QR-DOUBLE-SCAN');
      expect(scan2.isValid).toBe(false);
      expect(scan2.alreadyCheckedIn).toBe(true);
      expect(scan2.message).toBe('Tiket sudah digunakan sebelumnya');
    });
  });

  // ==========================================================================
  // 6. Penanganan Galat Persistensi Check-in
  // ==========================================================================
  describe('6. Penanganan Galat Persistensi Database saat Check-in', () => {
    it('mengembalikan isValid: false jika verifyAndMarkCheckedIn gagal dengan pesan kustom', async () => {
      const ticket = new TiketItem('TKT-FAIL-DB', 50, 'QR-FAIL-DB', 'Belum Hadir', null);

      const mockItem = {
        findByHash: jest.fn().mockResolvedValue(ticket),
        verifyAndMarkCheckedIn: jest.fn().mockResolvedValue({
          success: false,
          status: 'ERROR',
          message: 'Koneksi database terputus saat pembaruan.',
        }),
      };
      const controller = new ValidationController(mockItem);

      const result = await controller.validateQR('QR-FAIL-DB');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Koneksi database terputus saat pembaruan.');
      expect(result.alreadyCheckedIn).toBe(false);
    });
  });

  // ==========================================================================
  // 7. Pengujian Ketahanan Mode Offline (ECONNREFUSED Resilience)
  // ==========================================================================
  describe('7. Ketahanan Mode Offline (ECONNREFUSED Resilience)', () => {
    it('tetap berhasil check-in ketika findByHash dan verifyAndMarkCheckedIn melempar ECONNREFUSED', async () => {
      const econnError = new Error('connect ECONNREFUSED 127.0.0.1:3306');
      econnError.code = 'ECONNREFUSED';

      const mockItem = {
        findByHash: jest.fn().mockRejectedValue(econnError),
        verifyAndMarkCheckedIn: jest.fn().mockRejectedValue(econnError),
      };
      const controller = new ValidationController(mockItem);

      const result = await controller.validateQR('TKT-OFFLINE-TEST');

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Check-in berhasil! Selamat menikmati pertunjukan');
      expect(result.ticketCode).toBe('TKT-OFFLINE-TEST');
    });
  });

  // ==========================================================================
  // 8. Pengujian Method setCheckedIn
  // ==========================================================================
  describe('8. Pengujian Method setCheckedIn', () => {
    it('setCheckedIn mengembalikan false jika input kosong atau null', async () => {
      const controller = new ValidationController();

      expect(await controller.setCheckedIn('')).toBe(false);
      expect(await controller.setCheckedIn(null)).toBe(false);
      expect(await controller.setCheckedIn('   ')).toBe(false);
      expect(await controller.setCheckedIn(undefined)).toBe(false);
    });

    it('setCheckedIn mengembalikan true jika verifyAndMarkCheckedIn berhasil', async () => {
      const mockItem = {
        verifyAndMarkCheckedIn: jest.fn().mockResolvedValue({ success: true, status: 'VALID' }),
      };
      const controller = new ValidationController(mockItem);

      const res = await controller.setCheckedIn('TKT-SET-001');
      expect(res).toBe(true);
      expect(mockItem.verifyAndMarkCheckedIn).toHaveBeenCalledWith('TKT-SET-001');
    });

    it('setCheckedIn mengembalikan true pada penanganan galat ECONNREFUSED', async () => {
      const econnError = new Error('ECONNREFUSED');
      econnError.code = 'ECONNREFUSED';

      const mockItem = {
        verifyAndMarkCheckedIn: jest.fn().mockRejectedValue(econnError),
      };
      const controller = new ValidationController(mockItem);

      const res = await controller.setCheckedIn('TKT-OFFLINE-SET');
      expect(res).toBe(true);
    });

    it('setCheckedIn mendelegasikan ke validateQR jika verifyAndMarkCheckedIn bukan fungsi', async () => {
      const mockItem = {
        findByHash: jest.fn().mockResolvedValue(
          new TiketItem('TKT-FALLBACK', 1, 'QR-FALLBACK', 'Belum Hadir', null)
        ),
      };
      const controller = new ValidationController(mockItem);

      const res = await controller.setCheckedIn('QR-FALLBACK');
      expect(res).toBe(true);
    });
  });

  // ==========================================================================
  // 9. Mocking Isolasi Database Pool (End-to-End dengan Real TiketItem Model)
  // ==========================================================================
  describe('9. Mocking Isolasi Basis Data Pool (Tanpa Koneksi MySQL)', () => {
    it('berhasil memvalidasi tiket valid menggunakan real TiketItem dengan mock pool.execute', async () => {
      pool.execute.mockImplementation(async (query) => {
        if (query.includes('FROM TIKET_ITEM')) {
          return [[
            {
              kode_tiket: 'TKT-DB-99',
              id_detail: 15,
              qr_code_hash: 'QR-HASH-REAL-DB',
              status_kehadiran: 'Belum Hadir',
              waktu_checkin: null,
            },
          ]];
        }
        if (query.includes('UPDATE TIKET_ITEM')) {
          return [{ affectedRows: 1 }];
        }
        return [[]];
      });

      const controller = new ValidationController(); // default TiketItem instance
      const result = await controller.validateQR('QR-HASH-REAL-DB');

      expect(result.isValid).toBe(true);
      expect(result.ticketCode).toBe('TKT-DB-99');
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('FROM TIKET_ITEM'),
        ['QR-HASH-REAL-DB', 'QR-HASH-REAL-DB']
      );
    });

    it('menolak tiket yang sudah berstatus Checked-In di basis data', async () => {
      pool.execute.mockImplementation(async (query) => {
        if (query.includes('FROM TIKET_ITEM')) {
          return [[
            {
              kode_tiket: 'TKT-DB-USED',
              id_detail: 16,
              qr_code_hash: 'QR-HASH-ALREADY-USED',
              status_kehadiran: 'Checked-In',
              waktu_checkin: '2026-11-09 17:30:00',
            },
          ]];
        }
        return [[]];
      });

      const controller = new ValidationController();
      const result = await controller.validateQR('QR-HASH-ALREADY-USED');

      expect(result.isValid).toBe(false);
      expect(result.alreadyCheckedIn).toBe(true);
      expect(result.ticketCode).toBe('TKT-DB-USED');
    });

    it('menolak tiket yang tidak ditemukan di basis data', async () => {
      pool.execute.mockResolvedValue([[]]); // No rows found

      const controller = new ValidationController();
      const result = await controller.validateQR('QR-UNKNOWN');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Tiket palsu atau tidak terdaftar');
    });
  });
});
