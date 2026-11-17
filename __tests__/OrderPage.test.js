/**
 * ============================================================================
 * MODUL          : OrderPage.test.js
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL KF-03, KF-04
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo - 103112400081 (Testing QA Lead)
 * DESKRIPSI      : Pengujian unit dan render antarmuka Pemesanan Mandiri Online
 *                  Mobile-First (Banner Acara Stand-Up Comedy, pemilihan tier tiket,
 *                  stepper kuantitas tiket, pembatasan kuota maksimal 4 tiket,
 *                  dan sticky checkout bar) dengan mock API tickets dan navigation.
 * ============================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderPage from '@/app/order/page';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('OrderPage Component - Pemesanan Mandiri Online Mobile-First', () => {
  const mockTickets = [
    { id: 1, tier: 'Early Bird', harga: 50000, sisa_kuota: 0 },
    { id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 120 },
    { id: 3, tier: 'Batch 2', harga: 100000, sisa_kuota: 80 },
    { id: 4, tier: 'VIP', harga: 150000, sisa_kuota: 25 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();

    global.fetch = jest.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: mockTickets }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  it('harus merender banner acara Stand-Up Comedy Night dan informasi pertunjukan', async () => {
    render(<OrderPage />);

    // Tunggu komponen selesai memuat data dari API
    await waitFor(() => {
      expect(screen.getByText('Batch 1')).toBeInTheDocument();
    });

    // Periksa badge dan judul acara pada banner Hero Navy (#0F172A)
    expect(screen.getByText(/STAND-UP COMEDY NIGHT/i)).toBeInTheDocument();
    expect(screen.getByText(/Panggung Ketawa: Spesial Purwokerto/i)).toBeInTheDocument();

    // Periksa rincian tanggal, jam, dan lokasi acara
    expect(screen.getByText(/Sabtu, 24 Okt 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/16\.00 WIB/i)).toBeInTheDocument();
    expect(screen.getByText(/Gedung Serbaguna, Purwokerto/i)).toBeInTheDocument();

    // Periksa indikator langkah pemesanan
    expect(screen.getByText(/Langkah 1 dari 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Pilih Tiket/i)).toBeInTheDocument();
  });

  it('harus memuat dan menampilkan tier tiket (Batch 1, Batch 2, VIP, dan Early Bird) dengan status ketersediaan', async () => {
    render(<OrderPage />);

    // Tunggu data tiket selesai dimuat
    await waitFor(() => {
      expect(screen.getByText('Batch 1')).toBeInTheDocument();
      expect(screen.getByText('Batch 2')).toBeInTheDocument();
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });

    // Periksa label sisa kuota
    expect(screen.getByText(/Sisa 120/i)).toBeInTheDocument();
    expect(screen.getByText(/Sisa 80/i)).toBeInTheDocument();
    expect(screen.getByText(/Sisa 25/i)).toBeInTheDocument();

    // Periksa badge habis dan label Sold Out untuk Early Bird
    expect(screen.getByText('Early Bird')).toBeInTheDocument();
    expect(screen.getByText(/Habis/i)).toBeInTheDocument();
    expect(screen.getByText(/Sold Out/i)).toBeInTheDocument();
  });

  it('harus mengoperasikan stepper kuantitas tiket dan membatasi maksimal 4 tiket per tier', async () => {
    render(<OrderPage />);

    await waitFor(() => {
      expect(screen.getByText('Batch 1')).toBeInTheDocument();
    });

    // Awalnya tombol Lanjut ke Add-on dinonaktifkan
    const continueBtn = screen.getByRole('button', { name: /Lanjut ke Add-on/i });
    expect(continueBtn).toBeDisabled();

    // Klik tombol '+ Pilih' pada Batch 1 (tiket pertama yang tersedia)
    const selectButtons = screen.getAllByRole('button', { name: /\+ Pilih/i });
    fireEvent.click(selectButtons[0]);

    // Stepper kuantitas muncul dengan nilai 1
    const incBatch1Btn = screen.getByRole('button', { name: /Tambah 1 Batch 1/i });
    const decBatch1Btn = screen.getByRole('button', { name: /Kurangi 1 Batch 1/i });
    expect(incBatch1Btn).toBeInTheDocument();
    expect(decBatch1Btn).toBeInTheDocument();

    // Tambah kuantitas hingga batas maksimum 4 tiket
    fireEvent.click(incBatch1Btn); // qty 2
    fireEvent.click(incBatch1Btn); // qty 3
    fireEvent.click(incBatch1Btn); // qty 4
    expect(screen.getByText('4')).toBeInTheDocument();

    // Pada kuantitas 4, tombol tambah harus dinonaktifkan (aturan SKPL max 4)
    expect(incBatch1Btn).toBeDisabled();

    // Coba klik lagi, kuantitas tetap 4
    fireEvent.click(incBatch1Btn);
    expect(screen.getByText('4')).toBeInTheDocument();

    // Periksa subtotal di bottom checkout bar (4 x Rp75.000 = Rp300.000)
    expect(screen.getByText(/Total \(4 tiket\):/i)).toBeInTheDocument();
    expect(screen.getByText(/300\.000/)).toBeInTheDocument();

    // Kurangi kuantitas 1 tiket
    fireEvent.click(decBatch1Btn);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/Total \(3 tiket\):/i)).toBeInTheDocument();
  });

  it('harus menyimpan data pemilihan tiket ke sessionStorage dan berpindah ke /order/addons', async () => {
    render(<OrderPage />);

    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });

    // Pilih tiket VIP (tombol ketiga yang berstatus + Pilih)
    const selectButtons = screen.getAllByRole('button', { name: /\+ Pilih/i });
    // selectButtons[2] adalah VIP karena Early Bird Sold Out
    fireEvent.click(selectButtons[2]);

    const continueBtn = screen.getByRole('button', { name: /Lanjut ke Add-on/i });
    expect(continueBtn).not.toBeDisabled();

    // Klik Lanjut ke Add-on
    fireEvent.click(continueBtn);

    // Pastikan router.push mengarah ke /order/addons
    expect(mockPush).toHaveBeenCalledWith('/order/addons');

    // Pastikan data tersimpan di sessionStorage
    const savedTickets = JSON.parse(sessionStorage.getItem('impal_order_tickets'));
    expect(savedTickets).toEqual({ 4: 1 }); // VIP id is 4, qty 1
  });
});
