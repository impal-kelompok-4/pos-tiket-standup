/**
 * ============================================================================
 * MODUL          : EmpiricalEdgeCases.test.js
 * REFERENSI      : DPPL-01 / SKPL KF-01 s/d KF-11 / Testing QA Lead
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo - 103112400081 (Testing QA Lead)
 * DESKRIPSI      : Pengujian unit dan edge cases adversarial untuk validasi UI:
 *                  1. Empty cart checkout prevention (PoS & Online Checkout)
 *                  2. Cash amount lower than total & invalid cash inputs (PoS)
 *                  3. Boundary conditions ticket quantities (max 4 per category, sisa kuota)
 *                  4. Invalid & expired promo code rejection (OPENING10)
 *                  5. Anti-double check-in enforcement (HTTP 409 Conflict visual feedback)
 *                  6. Unknown ticket hash rejection (HTTP 404 Not Found visual feedback)
 *                  7. Network failure and malformed data resilience (No page crashes)
 * ============================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PosPage from '@/app/pos/page';
import OrderPage from '@/app/order/page';
import OrderAddonsPage from '@/app/order/addons/page';
import OrderCheckoutPage from '@/app/order/checkout/page';
import GatePage from '@/app/gate/page';
import AdminDashboardPage from '@/app/admin/page';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Empirical Challenger - Edge Case Verification Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  // ==========================================================================
  // 1. EMPTY CART CHECKOUT PREVENTION
  // ==========================================================================
  describe('1. Empty Cart Checkout Prevention', () => {
    it('[PoS] Tombol Bayar Transaksi wajib disabled saat keranjang kosong dan tidak mengirim fetch', async () => {
      global.fetch = jest.fn((url) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/tickets')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: [{ id: 1, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 }] }),
          });
        }
        if (urlStr.includes('/api/addons')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) });
      });

      render(<PosPage />);

      await waitFor(() => {
        expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
      });

      // Tombol Bayar Transaksi harus ada dan berstatus disabled
      const payButton = screen.getByRole('button', { name: /Bayar Transaksi/i });
      expect(payButton).toBeDisabled();

      // Coba klik tombol yang disabled
      fireEvent.click(payButton);

      // Verifikasi bahwa /api/transactions TIDAK PERNAH dipanggil
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/transactions'),
        expect.anything()
      );
    });

    it('[Online Order Checkout] Form submit diblokir dan tombol submit disabled jika keranjang kosong', async () => {
      sessionStorage.setItem('impal_order_tickets_data', JSON.stringify([]));
      sessionStorage.setItem('impal_order_addons_data', JSON.stringify([]));

      global.fetch = jest.fn();

      render(<OrderCheckoutPage />);

      // Pesan empty state harus terlihat
      expect(screen.getByText(/Belum ada tiket atau add-on yang dipilih/i)).toBeInTheDocument();

      // Tombol Bayar Sekarang harus disabled
      const submitBtn = screen.getByRole('button', { name: /Bayar Sekarang/i });
      expect(submitBtn).toBeDisabled();

      // Coba isi data diri menggunakan placeholder aktual
      const nameInput = screen.getByPlaceholderText(/Contoh: Budi Santoso/i);
      const emailInput = screen.getByPlaceholderText(/budi\.santoso@email\.com/i);
      const phoneInput = screen.getByPlaceholderText(/081234567890/i);

      fireEvent.change(nameInput, { target: { value: 'Budi Santoso' } });
      fireEvent.change(emailInput, { target: { value: 'budi@test.com' } });
      fireEvent.change(phoneInput, { target: { value: '08123456789' } });

      // Coba klik tombol submit (disabled)
      fireEvent.click(submitBtn);

      // Verifikasi bahwa /api/checkout TIDAK dipanggil dan tidak terjadi redirect
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/checkout'),
        expect.anything()
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('[Online Order Page] Tombol "Lanjut ke Add-on" disabled saat belum ada tiket dipilih', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                { id: 1, tier: 'Batch 1', harga: 75000, sisa_kuota: 10 },
                { id: 2, tier: 'VIP', harga: 150000, sisa_kuota: 5 },
              ],
            }),
        })
      );

      render(<OrderPage />);

      await waitFor(() => {
        expect(screen.getByText('Batch 1')).toBeInTheDocument();
      });

      const continueBtn = screen.getByRole('button', { name: /Lanjut ke Add-on/i });
      expect(continueBtn).toBeDisabled();

      fireEvent.click(continueBtn);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 2. CASH AMOUNT LOWER THAN TOTAL
  // ==========================================================================
  describe('2. Cash Amount Lower Than Total (PoS Cashier)', () => {
    it('[PoS] Menampilkan banner "Uang Kurang" dan tombol bayar tetap disabled jika uang tunai < total', async () => {
      global.fetch = jest.fn((url) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/tickets')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: [{ id: 1, tier: 'Batch 1', harga: 100000, sisa_kuota: 10 }],
              }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) });
      });

      render(<PosPage />);

      await waitFor(() => {
        expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
      });

      // Tambahkan tiket ke keranjang (Total: Rp 100.000)
      const addBtn = screen.getByRole('button', { name: /\+ Tambah/i });
      fireEvent.click(addBtn);

      // Pastikan item masuk ke keranjang
      expect(screen.getByText(/1 item terpilih/i)).toBeInTheDocument();

      // Input uang tunai kurang dari total (misal Rp 50.000)
      const cashInput = screen.getByPlaceholderText(/Contoh: 100000/i);
      fireEvent.change(cashInput, { target: { value: '50000' } });

      // Verifikasi peringatan "Uang Kurang:" muncul
      expect(screen.getByText(/Uang Kurang:/i)).toBeInTheDocument();
      expect(screen.getByText(/Rp\s*50\.000/i)).toBeInTheDocument();

      // Tombol bayar harus tetap disabled
      const payButton = screen.getByRole('button', { name: /Bayar Transaksi/i });
      expect(payButton).toBeDisabled();

      // Masukkan uang pas (Rp 100.000) -> Uang Kembalian muncul dan tombol aktif
      fireEvent.change(cashInput, { target: { value: '100000' } });
      expect(screen.getByText(/Uang Kembalian:/i)).toBeInTheDocument();
      expect(payButton).not.toBeDisabled();

      // Masukkan uang lebih (Rp 150.000) -> Kembalian Rp 50.000
      fireEvent.change(cashInput, { target: { value: '150000' } });
      expect(screen.getByText(/Uang Kembalian:/i)).toBeInTheDocument();
      expect(payButton).not.toBeDisabled();
    });

    it('[PoS] Menolak input tunai bernilai negatif atau karakter non-numerik', async () => {
      global.fetch = jest.fn((url) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/tickets')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: [{ id: 1, tier: 'Batch 1', harga: 50000, sisa_kuota: 10 }],
              }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) });
      });

      render(<PosPage />);

      await waitFor(() => {
        expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
      });

      // Tambahkan item
      fireEvent.click(screen.getByRole('button', { name: /\+ Tambah/i }));

      const cashInput = screen.getByPlaceholderText(/Contoh: 100000/i);
      const payButton = screen.getByRole('button', { name: /Bayar Transaksi/i });

      // Input negatif
      fireEvent.change(cashInput, { target: { value: '-20000' } });
      expect(payButton).toBeDisabled();

      // Input karakter huruf
      fireEvent.change(cashInput, { target: { value: 'abcxyz' } });
      expect(payButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // 3. BOUNDARY CONDITIONS ON TICKET QUANTITIES (MAX 4 PER CATEGORY)
  // ==========================================================================
  describe('3. Boundary Conditions on Ticket Quantities (Max 4 & Stock Limits)', () => {
    it('[Online Order] Stepper tiket dibatasi maksimal 4 lembar meskipun sisa kuota melimpah', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: [{ id: 10, tier: 'VIP', harga: 150000, sisa_kuota: 50 }],
            }),
        })
      );

      render(<OrderPage />);

      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      // Klik "+ Pilih" pertama kali (qty: 1)
      const selectBtn = screen.getByRole('button', { name: /\+ Pilih/i });
      fireEvent.click(selectBtn);

      expect(screen.getByText('1')).toBeInTheDocument();

      // Cari tombol stepper "+"
      const plusBtn = screen.getByRole('button', { name: /Tambah 1 VIP/i });

      // Klik ke qty 2
      fireEvent.click(plusBtn);
      expect(screen.getByText('2')).toBeInTheDocument();

      // Klik ke qty 3
      fireEvent.click(plusBtn);
      expect(screen.getByText('3')).toBeInTheDocument();

      // Klik ke qty 4 (Batas maksimum SKPL)
      fireEvent.click(plusBtn);
      expect(screen.getByText('4')).toBeInTheDocument();

      // Pada qty 4, tombol "+" wajib disabled
      expect(plusBtn).toBeDisabled();

      // Coba klik tombol yang disabled, kuantitas tidak boleh bertambah menjadi 5
      fireEvent.click(plusBtn);
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('[Online Order] Stepper tiket dibatasi oleh sisa kuota jika kuota < 4 (misal sisa 2)', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: [{ id: 11, tier: 'VVIP Langka', harga: 250000, sisa_kuota: 2 }],
            }),
        })
      );

      render(<OrderPage />);

      await waitFor(() => {
        expect(screen.getByText('VVIP Langka')).toBeInTheDocument();
      });

      // Pilih pertama kali (qty: 1)
      fireEvent.click(screen.getByRole('button', { name: /\+ Pilih/i }));
      expect(screen.getByText('1')).toBeInTheDocument();

      const plusBtn = screen.getByRole('button', { name: /Tambah 1 VVIP Langka/i });

      // Tambah ke qty 2 (Mencapai batas kuota 2)
      fireEvent.click(plusBtn);
      expect(screen.getByText('2')).toBeInTheDocument();

      // Tombol "+" harus disabled karena sisa kuota hanya 2
      expect(plusBtn).toBeDisabled();
      fireEvent.click(plusBtn);
      expect(screen.queryByText('3')).not.toBeInTheDocument();
    });

    it('[Online Order] Pengurangan kuantitas hingga 0 menghapus tiket dari keranjang secara bersih', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: [{ id: 12, tier: 'Batch 2', harga: 100000, sisa_kuota: 20 }],
            }),
        })
      );

      render(<OrderPage />);

      await waitFor(() => {
        expect(screen.getByText('Batch 2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /\+ Pilih/i }));
      expect(screen.getByText('1')).toBeInTheDocument();

      const minusBtn = screen.getByRole('button', { name: /Kurangi 1 Batch 2/i });
      fireEvent.click(minusBtn);

      // Kuantitas kembali ke nol dan tombol "+ Pilih" muncul kembali
      expect(screen.getByRole('button', { name: /\+ Pilih/i })).toBeInTheDocument();
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4. INVALID / EXPIRED PROMO CODES (OPENING10 & KODE PALSU)
  // ==========================================================================
  describe('4. Invalid & Expired Promo Codes Handling', () => {
    it('[PoS] Menolak kode promo kadaluarsa/habis (OPENING10) tanpa error crash dan diskon tetap 0', async () => {
      global.fetch = jest.fn((url) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/tickets')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: [{ id: 1, tier: 'Batch 1', harga: 100000, sisa_kuota: 10 }],
              }),
          });
        }
        if (urlStr.includes('/api/addons')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) });
        }
        if (urlStr.includes('/api/promos/validate')) {
          // OPENING10 memiliki kuota 0 dan kadaluarsa
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: false,
                valid: false,
                discount: 0,
                message: 'Voucher promo "OPENING10" telah kadaluarsa atau kuota habis.',
              }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) });
      });

      render(<PosPage />);

      await waitFor(() => {
        expect(screen.getByText('Tiket Batch 1')).toBeInTheDocument();
      });

      // Tambah item ke keranjang
      fireEvent.click(screen.getByRole('button', { name: /\+ Tambah/i }));

      // Masukkan kode promo OPENING10
      const promoInput = screen.getByPlaceholderText(/Contoh: KETAWA10/i);
      const applyBtn = screen.getByRole('button', { name: /Terapkan/i });

      fireEvent.change(promoInput, { target: { value: 'OPENING10' } });
      fireEvent.click(applyBtn);

      // Verifikasi pesan error promo ditampilkan
      await waitFor(() => {
        expect(
          screen.getByText(/telah kadaluarsa atau kuota habis/i)
        ).toBeInTheDocument();
      });

      // Pastikan total bayar TIDAK terpotong diskon (tetap Rp 100.000)
      const payButton = screen.getByRole('button', { name: /Bayar Transaksi/i });
      expect(payButton).toHaveTextContent(/Rp\s*100\.000/i);
    });

    it('[Online Checkout] Validasi kode promo tidak ditemukan menampilkan pesan kesalahan ramah', async () => {
      sessionStorage.setItem(
        'impal_order_tickets_data',
        JSON.stringify([{ id: 1, tier: 'Batch 1', harga: 75000, qty: 1 }])
      );

      global.fetch = jest.fn((url) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/promos/validate')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: false,
                valid: false,
                discount: 0,
                message: 'Kode voucher promo "PALSU99" tidak ditemukan.',
              }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) });
      });

      render(<OrderCheckoutPage />);

      const promoInput = screen.getByPlaceholderText(/Kode Promo \(misal: ROAST20\)/i);

      fireEvent.change(promoInput, { target: { value: 'PALSU99' } });
      fireEvent.submit(promoInput.closest('form'));

      await waitFor(() => {
        expect(screen.getByText(/tidak ditemukan/i)).toBeInTheDocument();
      });

      // Total tetap Rp 75.000 tanpa potongan
      expect(screen.getAllByText(/Rp\s*75\.000/i).length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 5. DOUBLE CHECK-IN PREVENTION (409 CONFLICT)
  // ==========================================================================
  describe('5. Double Check-in Prevention (409 Conflict)', () => {
    it('[Gate Scanner] Menampilkan kartu merah "409 Conflict - TIKET SUDAH DIGUNAKAN" dan riwayat tercatat', async () => {
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
                alreadyCheckedIn: true,
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

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: /Tiket sudah digunakan/i })).toBeInTheDocument();
        expect(screen.getAllByText(/TKT-BATCH1-001/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/18:30 WIB/i)).toBeInTheDocument();
        expect(screen.getByText(/Proteksi Anti-Double Check-in Aktif!/i)).toBeInTheDocument();
      });

      // Periksa statistik Ditolak bertambah menjadi 1
      const ditolakCard = screen.getByText(/^Ditolak$/i).closest('div');
      expect(ditolakCard).toHaveTextContent('1');
    });
  });

  // ==========================================================================
  // 6. UNKNOWN TICKET HASH (404 NOT FOUND)
  // ==========================================================================
  describe('6. Unknown Ticket Hash (404 Not Found)', () => {
    it('[Gate Scanner] Menampilkan kartu merah gelap "404 Not Found - TIKET TIDAK TERDAFTAR"', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () =>
            Promise.resolve({
              success: false,
              message: 'Tiket palsu atau tidak terdaftar dalam sistem.',
              data: {
                isValid: false,
              },
            }),
        })
      );

      render(<GatePage />);

      const presetFakeBtn = screen.getByText(/\[3\] Tiket Palsu \(404\)/i);
      fireEvent.click(presetFakeBtn);

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: /Tiket tidak terdaftar/i })).toBeInTheDocument();
        expect(screen.getByText(/Meja Bantuan/i)).toBeInTheDocument();
      });

      // Statistik Ditolak bertambah
      const ditolakCard = screen.getByText(/^Ditolak$/i).closest('div');
      expect(ditolakCard).toHaveTextContent('1');
    });
  });

  // ==========================================================================
  // 7. NETWORK FAILURE AND MALFORMED DATA RESILIENCE
  // ==========================================================================
  describe('7. Network Failure & Malformed Data Resilience (No Page Crashes)', () => {
    it('[Gate Scanner] Tidak mengalami crash saat jaringan server terputus (Fetch Error)', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network Connection Refused')));

      render(<GatePage />);

      const fakeBtn = screen.getByText(/\[3\] Tiket Palsu \(404\)/i);
      fireEvent.click(fakeBtn);

      await waitFor(() => {
        expect(screen.getByText(/KONEKSI TERPUTUS/i)).toBeInTheDocument();
        expect(screen.getByText(/Gagal menghubungi server verifikasi gate/i)).toBeInTheDocument();
      });
    });

    it('[PoS] Menangani kegagalan load API tanpa fatal crash dan menampilkan tombol "Coba Lagi"', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Database Down 500')));

      render(<PosPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gagal memuat katalog:/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Coba Lagi/i })).toBeInTheDocument();
      });
    });

    it('[Admin Dashboard] Merender seluruh tab tanpa error dan menangani pencarian add-on kosong', async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) }));

      render(<AdminDashboardPage />);

      // Periksa 4 tab navigasi dasbor
      const tabEvents = screen.getByRole('button', { name: /Master Event & Kuota/i });
      const tabAddons = screen.getByRole('button', { name: /Katalog Add-on/i });
      const tabPromos = screen.getByRole('button', { name: /Kode Promo/i });
      const tabReports = screen.getByRole('button', { name: /Laporan Penjualan/i });

      expect(tabEvents).toBeInTheDocument();
      expect(tabAddons).toBeInTheDocument();
      expect(tabPromos).toBeInTheDocument();
      expect(tabReports).toBeInTheDocument();

      // Beralih ke tab Addons dan cari item fiktif
      fireEvent.click(tabAddons);
      const searchAddon = screen.getByPlaceholderText(/Cari nama produk add-on\.\.\./i);
      fireEvent.change(searchAddon, { target: { value: 'BarangNonExistent999' } });

      expect(screen.getByText(/Tidak ada produk yang cocok dengan pencarian atau filter/i)).toBeInTheDocument();

      // Beralih ke tab Promo
      fireEvent.click(tabPromos);
      expect(screen.getByText('OPENING10')).toBeInTheDocument();
      expect(screen.getAllByText('KETAWA10').length).toBeGreaterThanOrEqual(1);

      // Beralih ke tab Laporan
      fireEvent.click(tabReports);
      expect(screen.getByText(/Penjualan Bersih/i)).toBeInTheDocument();
      expect(screen.getByText(/Transaksi Dibayar/i)).toBeInTheDocument();
    });

    it('[Order Addons Page] Menampilkan ringkasan add-on yang dipilih dan navigasi ke checkout', async () => {
      sessionStorage.setItem(
        'impal_order_tickets_data',
        JSON.stringify([{ id: 1, tier: 'Batch 1', harga: 75000, qty: 2 }])
      );

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                { id: 1, nama_item: 'Popcorn Jumbo', harga: 20000, stok: 50 },
                { id: 2, nama_item: 'Air Mineral', harga: 5000, stok: 100 },
              ],
            }),
        })
      );

      render(<OrderAddonsPage />);

      await waitFor(() => {
        expect(screen.getByText('Popcorn Jumbo')).toBeInTheDocument();
      });

      // Tambah 1 Popcorn
      const addButtons = screen.getAllByRole('button', { name: /\+ Tambah/i });
      fireEvent.click(addButtons[0]);

      // Klik tombol Lanjut ke Checkout
      const checkoutNavBtn = screen.getByRole('button', { name: /Lanjut ke Checkout/i });
      fireEvent.click(checkoutNavBtn);

      expect(mockPush).toHaveBeenCalledWith('/order/checkout');
    });
  });
});
