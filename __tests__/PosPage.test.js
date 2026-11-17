/**
 * ============================================================================
 * MODUL          : PosPage.test.js
 * REFERENSI      : DPPL-01 Bab 2.3 POS-01 / SKPL KF-01, KF-02, KF-10, KF-11
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo - 103112400081 (Testing QA Lead)
 * DESKRIPSI      : Pengujian unit dan render antarmuka Kasir PoS Desktop 3 Kolom
 *                  (Katalog Tiket & Add-on, Keranjang Belanja, Input Promo Code,
 *                  Tombol Pembayaran CASH/QRIS, dan Kalkulasi Kembalian Otomatis).
 * ============================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PosPage from '@/app/pos/page';

describe('PosPage Component - Kasir PoS Desktop 3 Kolom', () => {
  const mockTickets = [
    { id: 1, tier: 'Early Bird', harga: 50000, sisa_kuota: 0 },
    { id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 120 },
    { id: 3, tier: 'Batch 2', harga: 100000, sisa_kuota: 80 },
    { id: 4, tier: 'VIP', harga: 150000, sisa_kuota: 25 },
  ];

  const mockAddons = [
    { id: 1, nama_item: 'Paket Snack (Popcorn + Cola)', harga: 15000, stok: 100 },
    { id: 2, nama_item: 'Popcorn Caramel Large', harga: 20000, stok: 75 },
    { id: 3, nama_item: 'Official Stiker Pack Stand-Up', harga: 12000, stok: 50 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url) => {
      const urlStr = String(url);

      if (urlStr.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: mockTickets }),
        });
      }

      if (urlStr.includes('/api/addons')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: mockAddons }),
        });
      }

      if (urlStr.includes('/api/promos/validate')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              valid: true,
              discount: 10000,
              promo: {
                kode_promo: 'KETAWA10',
                nominal_potongan: 10000,
              },
            }),
        });
      }

      if (urlStr.includes('/api/transactions')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                noInvoice: 'TRX-POS-20261024-001',
                totalBayar: 65000,
                change: 35000,
                tickets: [{ ticketCode: 'TKT-BATCH1-001' }],
              },
            }),
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
  });

  it('harus merender layout 3 kolom PoS (Katalog, Keranjang, dan Pembayaran) secara lengkap', async () => {
    render(<PosPage />);

    // Periksa judul dan badge kasir sesuai mockup Transaksi kasir
    expect(screen.getByRole('heading', { level: 1, name: /Transaksi kasir/i })).toBeInTheDocument();
    expect(screen.getByText(/Printer terhubung/i)).toBeInTheDocument();
    expect(screen.getByText(/Terminal PoS 01/i)).toBeInTheDocument();

    // Periksa keberadaan 3 section kolom utama
    expect(screen.getByRole('region', { name: /Katalog Produk/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Keranjang Belanja/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Panel Pembayaran/i })).toBeInTheDocument();

    // Tunggu data katalog dimuat dari API
    await waitFor(() => {
      expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
      expect(screen.getByText('Tiket VIP')).toBeInTheDocument();
      expect(screen.getByText('Paket Snack (Popcorn + Cola)')).toBeInTheDocument();
    });

    // Periksa status habis untuk Early Bird
    expect(screen.getByText('Tiket Early Bird')).toBeInTheDocument();
    expect(screen.getByText(/Sold Out/i)).toBeInTheDocument();
  });

  it('harus mendukung filter katalog (Semua, Tiket, Add-on) dan input pencarian', async () => {
    render(<PosPage />);

    await waitFor(() => {
      expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Cari tiket atau add-on\.\.\. \[F2\]/i);
    expect(searchInput).toBeInTheDocument();

    // Filter ke tab Tiket
    const ticketTabBtn = screen.getByRole('button', { name: /^Tiket$/i });
    fireEvent.click(ticketTabBtn);

    expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
    expect(screen.queryByText('Paket Snack (Popcorn + Cola)')).not.toBeInTheDocument();

    // Filter ke tab Add-on
    const addonTabBtn = screen.getByRole('button', { name: /^Add-on$/i });
    fireEvent.click(addonTabBtn);

    expect(screen.queryByText('Tiket Batch 1')).not.toBeInTheDocument();
    expect(screen.getByText('Paket Snack (Popcorn + Cola)')).toBeInTheDocument();

    // Uji pencarian teks
    fireEvent.change(searchInput, { target: { value: 'Stiker' } });
    expect(screen.getByText('Official Stiker Pack Stand-Up')).toBeInTheDocument();
    expect(screen.queryByText('Paket Snack (Popcorn + Cola)')).not.toBeInTheDocument();
  });

  it('harus dapat menambahkan produk ke keranjang belanja dan memperbarui kuantitas', async () => {
    render(<PosPage />);

    await waitFor(() => {
      expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
    });

    // Keranjang awal kosong
    expect(screen.getByText(/Keranjang masih kosong/i)).toBeInTheDocument();

    // Tambahkan tiket Batch 1 ke keranjang
    const addBatch1Buttons = screen.getAllByRole('button', { name: /\+ Tambah/i });
    fireEvent.click(addBatch1Buttons[0]);

    // Keranjang sekarang memiliki item Tiket Batch 1
    const cartSection = screen.getByRole('region', { name: /Keranjang Belanja/i });
    expect(cartSection).toHaveTextContent('Tiket Batch 1');
    expect(cartSection).toHaveTextContent('1 item terpilih');

    // Tambah kuantitas via tombol stepper (+) di keranjang
    const increaseBtn = screen.getByRole('button', { name: /Tambah 1/i });
    fireEvent.click(increaseBtn);

    expect(cartSection).toHaveTextContent('2 item terpilih');
  });

  it('harus dapat memvalidasi kode voucher promo dan menampilkan diskon', async () => {
    render(<PosPage />);

    await waitFor(() => {
      expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
    });

    // Tambahkan Batch 1 ke keranjang (harga 75.000)
    const addButtons = screen.getAllByRole('button', { name: /\+ Tambah/i });
    fireEvent.click(addButtons[0]);

    const promoInput = screen.getByPlaceholderText(/Contoh: KETAWA10/i);
    const applyPromoBtn = screen.getByRole('button', { name: /Terapkan/i });

    // Masukkan kode voucher promo
    fireEvent.change(promoInput, { target: { value: 'KETAWA10' } });
    fireEvent.click(applyPromoBtn);

    // Tunggu validasi promo sukses
    await waitFor(() => {
      expect(screen.getByText(/Potongan.*10\.000/i)).toBeInTheDocument();
    });

    // Total tagihan berkurang menjadi Rp65.000
    const cartSection = screen.getByRole('region', { name: /Keranjang Belanja/i });
    expect(cartSection).toHaveTextContent(/Total Tagihan/i);
    expect(cartSection).toHaveTextContent(/65\.000/);
  });

  it('harus menyediakan pilihan pembayaran CASH/QRIS dan menghitung kembalian uang tunai secara otomatis', async () => {
    render(<PosPage />);

    await waitFor(() => {
      expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
    });

    // Tambahkan tiket Batch 1 (Rp75.000)
    const addButtons = screen.getAllByRole('button', { name: /\+ Tambah/i });
    fireEvent.click(addButtons[0]);

    // Periksa tombol metode pembayaran (segmented toggle teks bersih "Tunai" dan "QRIS" tanpa emoji)
    const cashBtn = screen.getByRole('button', { name: /^(?:Tunai|CASH \(Tunai\))$/i });
    const qrisBtn = screen.getByRole('button', { name: /^(?:QRIS|QRIS Dinamis)$/i });
    expect(cashBtn).toBeInTheDocument();
    expect(qrisBtn).toBeInTheDocument();
    expect(cashBtn).toHaveTextContent('Tunai');
    expect(qrisBtn).toHaveTextContent('QRIS');
    expect(cashBtn).not.toHaveTextContent('💵');
    expect(qrisBtn).not.toHaveTextContent('📱');

    // Uji peralihan toggle ke QRIS dan kembali ke Tunai
    fireEvent.click(qrisBtn);
    expect(screen.getByText(/QRIS Kasir Stand-Up/i)).toBeInTheDocument();
    fireEvent.click(cashBtn);

    // Secara default metode adalah CASH, masukkan nominal uang diterima
    const cashInput = screen.getByPlaceholderText(/Contoh: 100000/i);
    expect(cashInput).toBeInTheDocument();

    // Uji jika uang kurang (misal bayar 50.000 untuk tagihan 75.000)
    fireEvent.change(cashInput, { target: { value: '50000' } });
    expect(screen.getByText(/Uang Kurang:/i)).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();

    // Uji jika uang lebih (misal bayar 100.000 untuk tagihan 75.000)
    fireEvent.change(cashInput, { target: { value: '100000' } });
    expect(screen.getByText(/Uang Kembalian:/i)).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();

    // Uji tombol shortcut nominal cepat (misal tombol 200.000)
    const preset200k = screen.getByRole('button', { name: '200.000' });
    fireEvent.click(preset200k);
    expect(cashInput).toHaveValue(200000);
    expect(screen.getByText(/125\.000/)).toBeInTheDocument();

    // Tombol bayar transaksi aktif
    const payBtn = screen.getByRole('button', { name: /Bayar Transaksi/i });
    expect(payBtn).not.toBeDisabled();
  });
});
