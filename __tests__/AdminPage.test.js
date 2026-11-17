/**
 * ============================================================================
 * MODUL          : AdminPage.test.js
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL KF-07, KF-08, KF-09, KF-10, KF-13
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo - 103112400081 (Testing QA Lead)
 * DESKRIPSI      : Pengujian unit dan render antarmuka Dasbor Admin terpadu
 *                  (Sidebar navigasi 4 tab: Master Event & Kuota, Katalog Add-on,
 *                  Voucher Promo, dan Laporan Penjualan, kartu metrik omzet/kuota,
 *                  tabel master-detail, dan formulir operasional admin).
 * ============================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboardPage from '@/app/admin/page';

describe('AdminDashboardPage Component - Dasbor Admin Terpadu 4 Tab', () => {
  const mockTickets = [
    { id: 1, tier: 'Early Bird', harga: 50000, sisa_kuota: 0, total_kuota: 50 },
    { id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 120, total_kuota: 150 },
    { id: 3, tier: 'Batch 2', harga: 100000, sisa_kuota: 80, total_kuota: 100 },
    { id: 4, tier: 'VIP', harga: 150000, sisa_kuota: 25, total_kuota: 50 },
  ];

  const mockAddons = [
    { id: 1, nama_item: 'Paket Snack (Popcorn + Cola)', harga: 15000, stok: 100 },
    { id: 2, nama_item: 'Popcorn Caramel Large', harga: 20000, stok: 75 },
    { id: 3, nama_item: 'Official Stiker Pack Stand-Up', harga: 12000, stok: 50 },
  ];

  const mockPromos = [
    {
      kode_promo: 'KETAWA10',
      nominal_potongan: 10000,
      kuota_promo: 62,
      total_kuota: 100,
      tanggal_kadaluarsa: '2026-10-24',
    },
    {
      kode_promo: 'ROAST20',
      nominal_potongan: 20000,
      kuota_promo: 38,
      total_kuota: 100,
      tanggal_kadaluarsa: '2026-10-24',
    },
  ];

  const mockReportSummary = {
    totalRevenue: 7080000,
    totalTicketsSold: 70,
    totalTransactions: 42,
    addonRevenue: 450000,
    dailyRevenue: [
      { tanggal: '2026-10-23', omzet: 1200000, jumlah_transaksi: 7 },
      { tanggal: '2026-10-24', omzet: 1580000, jumlah_transaksi: 8 },
    ],
  };

  const mockTransactions = [
    {
      no_invoice: 'TRX-20261024-042',
      waktu_transaksi: '2026-10-24 19:20:00',
      nama_pemesan: 'Budi Santoso',
      metode_pembayaran: 'CASH',
      status_transaksi: 'PAID',
      total_bayar: 170000,
    },
    {
      no_invoice: 'TRX-20261024-041',
      waktu_transaksi: '2026-10-24 18:45:00',
      nama_pemesan: 'Siti Nurhaliza',
      metode_pembayaran: 'QRIS',
      status_transaksi: 'PAID',
      total_bayar: 150000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    window.print = jest.fn();

    global.fetch = jest.fn((url, options) => {
      const urlStr = String(url);

      if (urlStr.includes('/api/tickets')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, message: 'Kuota berhasil diperbarui' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: mockTickets }),
        });
      }

      if (urlStr.includes('/api/addons')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () =>
              Promise.resolve({
                success: true,
                data: { id: 99, nama_item: 'Minuman Segar', harga: 8000, stok: 50 },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: mockAddons }),
        });
      }

      if (urlStr.includes('/api/promos')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  kode_promo: 'DISKON50',
                  nominal_potongan: 50000,
                  kuota_promo: 20,
                  total_kuota: 20,
                  tanggal_kadaluarsa: '2026-12-31',
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: mockPromos }),
        });
      }

      if (urlStr.includes('/api/reports/summary')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: mockReportSummary }),
        });
      }

      if (urlStr.includes('/api/transactions')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: mockTransactions }),
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

  it('harus merender sidebar navigasi 4 tab (Master Event & Kuota, Katalog Add-on, Kode Promo, dan Laporan Penjualan)', async () => {
    render(<AdminDashboardPage />);

    // Tunggu initial fetch selesai
    await waitFor(() => {
      expect(screen.getByText('Early Bird')).toBeInTheDocument();
    });

    // Periksa logo brand dan badge Admin
    expect(screen.getByText(/^Admin$/)).toBeInTheDocument();

    // Periksa 4 menu tab navigasi pada sidebar
    expect(
      screen.getByRole('button', { name: /Master Event & Kuota/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Katalog Add-on/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Kode Promo/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Laporan Penjualan/i })
    ).toBeInTheDocument();
  });

  it('harus merender Tab 1 (Master Event & Kuota) beserta kartu metrik kuota dan tabel tier tiket', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Stand Up Comedy Night/i)).toBeInTheDocument();
      expect(screen.getByText('Early Bird')).toBeInTheDocument();
    });

    // Periksa detail kartu acara putih terpadu sesuai Mockup 5
    expect(screen.getByText('Stand Up Comedy Night')).toBeInTheDocument();
    expect(screen.getByText(/24 Okt 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Purwokerto')).toBeInTheDocument();
    expect(screen.getAllByText('Aktif').length).toBeGreaterThanOrEqual(1);

    // Periksa kartu metrik kuota tiket
    expect(screen.getByText(/^Total Kuota$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tiket Terjual/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Sisa Kuota/i).length).toBeGreaterThanOrEqual(1);

    // Periksa sub-bagian tabel kategori tiket & kuota
    expect(screen.getByText(/Kategori tiket & kuota/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Tambah kategori/i })).toBeInTheDocument();

    // Periksa tabel kategori tiket 6 kolom
    expect(screen.getByText('Early Bird')).toBeInTheDocument();
    expect(screen.getAllByText('Batch 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Batch 2')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();

    // Periksa alert info di bawah tabel
    expect(
      screen.getByText(/Kategori dengan kuota habis otomatis tidak dapat dipesan\./i)
    ).toBeInTheDocument();

    // Periksa form 'Ubah acara & tiket' di sebelah kanan
    expect(screen.getByText(/Ubah acara & tiket/i)).toBeInTheDocument();
    expect(screen.getByText(/Ubah kuota tiket dan detail acara/i)).toBeInTheDocument();

    // Periksa kontrol form input yang tersedia
    expect(screen.getByLabelText(/Nama acara/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tanggal acara/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jam mulai/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lokasi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Harga tiket \(Rp\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total kuota tiket/i)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText(/Acara aktif/i)).toBeInTheDocument();

    // Periksa tombol aksi Simpan perubahan dan Batal
    const saveBtn = screen.getByRole('button', {
      name: /(?:Simpan perubahan|Simpan Perubahan Kuota)/i,
    });
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toHaveTextContent(/Simpan perubahan/i);
    expect(screen.getByRole('button', { name: /Batal/i })).toBeInTheDocument();

    // Uji submit formulir via tombol Simpan perubahan
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tickets',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('harus dapat berpindah ke Tab 2 (Katalog Add-on) dan menampilkan tabel produk serta form tambah add-on', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Early Bird')).toBeInTheDocument();
    });

    // Klik tab Katalog Add-on
    const addonTabBtn = screen.getByRole('button', { name: /Katalog Add-on/i });
    fireEvent.click(addonTabBtn);

    // Periksa elemen Tab 2
    expect(
      screen.getByPlaceholderText(/Cari nama produk add-on\.\.\./i)
    ).toBeInTheDocument();
    expect(screen.getByText('Paket Snack (Popcorn + Cola)')).toBeInTheDocument();
    expect(screen.getByText('Popcorn Caramel Large')).toBeInTheDocument();

    // Periksa form penambahan add-on baru
    expect(screen.getByText(/Tambah Produk Add-on/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Simpan Produk Baru/i })
    ).toBeInTheDocument();
  });

  it('harus dapat berpindah ke Tab 3 (Kode Promo) dan menampilkan tabel voucher serta form buat promo', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Early Bird')).toBeInTheDocument();
    });

    // Klik tab Kode Promo
    const promoTabBtn = screen.getByRole('button', { name: /Kode Promo/i });
    fireEvent.click(promoTabBtn);

    // Periksa kode promo pada tabel
    expect(screen.getAllByText('KETAWA10').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ROAST20').length).toBeGreaterThanOrEqual(1);

    // Periksa form pembuatan voucher promo baru
    expect(screen.getByText(/Tambah Voucher Promo/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Simpan Kode Promo/i })
    ).toBeInTheDocument();
  });

  it('harus dapat berpindah ke Tab 4 (Laporan Penjualan) dan menampilkan kartu metrik omzet serta tabel riwayat transaksi', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Early Bird')).toBeInTheDocument();
    });

    // Klik tab Laporan Penjualan
    const reportTabBtn = screen.getByRole('button', { name: /Laporan Penjualan/i });
    fireEvent.click(reportTabBtn);

    // Periksa 4 kartu metrik omzet penjualan
    expect(screen.getByText(/Penjualan Bersih/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaksi Terbayar/i)).toBeInTheDocument();
    expect(screen.getByText(/Penjualan Add-on/i)).toBeInTheDocument();

    // Periksa tombol ekspor/cetak laporan
    const printBtn = screen.getByRole('button', { name: /Ekspor \/ Cetak Laporan/i });
    expect(printBtn).toBeInTheDocument();

    // Klik tombol cetak dan verifikasi window.print dipanggil
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalled();

    // Periksa tabel riwayat transaksi
    expect(screen.getByText('TRX-20261024-042')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('TRX-20261024-041')).toBeInTheDocument();
    expect(screen.getByText('Siti Nurhaliza')).toBeInTheDocument();
  });
});
