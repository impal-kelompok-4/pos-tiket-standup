/**
 * ============================================================================
 * MODUL          : GatePage.test.js
 * REFERENSI      : DPPL-01 Bab 2.3 GATE-01 / SKPL KF-06, KF-07
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo - 103112400081 (Testing QA Lead)
 * DESKRIPSI      : Pengujian unit dan render antarmuka Gate Scanner Check-in
 *                  (viewport pemindai kamera simulasi, input manual hash barcode,
 *                  tombol shortcut preset pengujian tiket sah/pakai/palsu,
 *                  kartu visual feedback 3 warna, dan akumulasi statistik).
 * ============================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GatePage from '@/app/gate/page';

describe('GatePage Component - Gate Scanner Check-in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('harus merender viewport pemindai, input QR hash manual, dan tombol preset pengujian dosen', () => {
    render(<GatePage />);

    // Periksa header scanner dan breadcrumb sesuai revisi mockup
    expect(screen.getByRole('heading', { level: 1, name: /Gate check-in/i })).toBeInTheDocument();
    expect(screen.getByText(/Stand Up Comedy Night · Pintu masuk A/i)).toBeInTheDocument();
    expect(screen.getByText(/Sistem terhubung/i)).toBeInTheDocument();

    // Periksa viewport pemindai (viewfinder navy #0F172A)
    expect(screen.getByText(/Kamera utama - Gate A/i)).toBeInTheDocument();
    expect(screen.getByText(/Arahkan QR Code tiket ke dalam bingkai/i)).toBeInTheDocument();
    expect(screen.getByText(/Pemindaian berjalan otomatis/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ganti kamera/i })).toBeInTheDocument();

    // Periksa input manual kode tiket dan tombol Validasi
    expect(screen.getByText(/Masukkan kode tiket secara manual/i)).toBeInTheDocument();
    const qrInput = screen.getByPlaceholderText(/STUP-042-01/i);
    const verifyBtn = screen.getByRole('button', { name: /(?:Validasi|Verifikasi)/i });
    expect(qrInput).toBeInTheDocument();
    expect(verifyBtn).toBeInTheDocument();
    expect(verifyBtn).toHaveTextContent(/Validasi/i);
    expect(verifyBtn).toBeDisabled(); // Disabled saat input kosong

    // Periksa 3 tombol shortcut preset evaluasi
    expect(screen.getByText(/\[1\] Tiket Sah \(200\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\[2\] Sudah Dipakai \(409\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\[3\] Tiket Palsu \(404\)/i)).toBeInTheDocument();

    // Periksa kartu metrik counter pengunjung masuk
    expect(screen.getByText(/Pengunjung masuk/i)).toBeInTheDocument();
    expect(screen.getByText(/Gate A · Stand Up Comedy Night/i)).toBeInTheDocument();
    expect(screen.getByText('148')).toBeInTheDocument();

    // Periksa ketersediaan counter aksesibilitas
    expect(screen.getByText(/Total Scan/i)).toBeInTheDocument();
    expect(screen.getByText(/^Tiket Sah$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Ditolak$/i)).toBeInTheDocument();
  });

  it('harus memvalidasi tiket sah (200 OK) dan menampilkan kartu feedback visual hijau', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            message: 'Check-in berhasil! Selamat menikmati pertunjukan',
            data: {
              isValid: true,
              ticketCode: 'TKT-BATCH1-003',
            },
          }),
      })
    );

    render(<GatePage />);

    // Klik preset [1] Tiket Sah
    const presetSahBtn = screen.getByText(/\[1\] Tiket Sah \(200\)/i);
    fireEvent.click(presetSahBtn);

    // Pastikan request POST dikirim ke /api/gate/verify
    expect(global.fetch).toHaveBeenCalledWith('/api/gate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrPayload: 'QRHASH-3c4e5f6a-003' }),
    });

    // Tunggu kartu feedback hijau lembut muncul
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: /Tiket valid/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Silakan masuk\. Check-in berhasil\./i)).toBeInTheDocument();
      expect(screen.getAllByText(/TKT-BATCH1-003/i).length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Check-in berhasil! Selamat menikmati pertunjukan/i)
      ).toBeInTheDocument();
    });

    // Periksa counter Pengunjung masuk bertambah menjadi 149 (148 + 1)
    expect(screen.getByText('149')).toBeInTheDocument();

    // Periksa tabel riwayat check-in pada pemindaian terakhir
    expect(screen.getByText(/Pemindaian terakhir/i)).toBeInTheDocument();
  });

  it('harus memvalidasi tiket yang sudah dipakai (409 Conflict) dan menampilkan kartu feedback merah', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Tiket ini sudah pernah digunakan untuk check-in sebelumnya!',
            data: {
              isValid: false,
              ticketCode: 'TKT-BATCH1-001',
              checkinTime: '18:30 WIB',
            },
          }),
      })
    );

    render(<GatePage />);

    // Klik preset [2] Sudah Dipakai
    const presetUsedBtn = screen.getByText(/\[2\] Sudah Dipakai \(409\)/i);
    fireEvent.click(presetUsedBtn);

    expect(global.fetch).toHaveBeenCalledWith('/api/gate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrPayload: 'QRHASH-8f9d2a1b-001' }),
    });

    // Tunggu kartu feedback merah lembut muncul
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: /Tiket sudah digunakan/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Proteksi Anti-Double Check-in Aktif!/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Tiket ini sudah pernah digunakan untuk check-in sebelumnya!/i)
      ).toBeInTheDocument();
    });
  });

  it('harus memvalidasi tiket palsu (404 Not Found) dan menampilkan kartu feedback merah gelap', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            success: false,
            message:
              'Hash e-tiket tidak dikenali dalam basis data sistem. Arahkan pengunjung ke Meja Bantuan.',
          }),
      })
    );

    render(<GatePage />);

    // Masukkan hash tiket palsu secara manual
    const qrInput = screen.getByPlaceholderText(/STUP-042-01/i);
    const verifyBtn = screen.getByRole('button', { name: /(?:Validasi|Verifikasi)/i });

    fireEvent.change(qrInput, { target: { value: 'QRHASH-INVALID-000' } });
    expect(verifyBtn).not.toBeDisabled();
    fireEvent.click(verifyBtn);

    expect(global.fetch).toHaveBeenCalledWith('/api/gate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrPayload: 'QRHASH-INVALID-000' }),
    });

    // Tunggu kartu feedback merah tiket tidak terdaftar muncul
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: /Tiket tidak terdaftar/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Meja Bantuan/i).length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Hash e-tiket tidak dikenali dalam basis data sistem/i)
      ).toBeInTheDocument();
    });
  });
});
