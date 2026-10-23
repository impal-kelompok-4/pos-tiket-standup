# PROJECT CONTEXT: Sistem Pemesanan Tiket Stand-Up Comedy (PoS & Online Storefront)
Mata Kuliah: Implementasi dan Pengujian Perangkat Lunak (ImPal) - Kelompok 4

## 1. Tech Stack & Lingkungan
- **Framework**: Next.js (App Router) menggunakan bahasa **JavaScript** (bukan TypeScript).
- **Styling / IMK**: Tailwind CSS.
- **Database**: MySQL / MariaDB (diakses langsung menggunakan library `mysql2/promise` tanpa ORM berat agar sesuai dengan desain Entity class OOP).
- **Testing**: Jest & React Testing Library.
- **Arsitektur**: Pola BCE / MVC (Boundary/View di `src/app/`, Controller di `src/controllers/`, Entity di `src/models/`).

## 2. Daftar Anggota Tim & PIC (Untuk Header Comment)
1. Dimas Ramadhani (103112400065) - Data Seeding & Modul Cetak Struk
2. Ryan Akeyla Novianto Widodo (103112400081) - Testing QA & Evaluasi Kelas
3. Keishin Naufa Alfaridzhi (103112400061) - UI/UX & Frontend Next.js (IMK)
4. Ariel Ahnaf Kusuma (103112400050) - Backend API, Business Logic, & Unit Test
5. Abisar Fathir (103112400068) - Database MySQL & Endpoint Admin

## 3. Aturan Wajib Penulisan Kode (Standar Slide #25 ImPal)
Setiap file kode (.js) WAJIB memiliki blok komentar header di bagian paling atas dengan format:
```
/**
 * ============================================================================
 * MODUL          : [Nama File / Kelas]
 * REFERENSI      : DPPL-01 [Kode Kelas CLS-xx] / SKPL [Kode KF-xx]
 * PENGEMBANG     : [Nama Anggota & NIM sesuai PIC]
 * DESKRIPSI      : [Penjelasan singkat fungsi modul]
 * ============================================================================
 */
```

## 4. Skema Basis Data MySQL (7 Tabel Utama - DPPL Hal. 50)
1. `PENGGUNA`: `id` (PK, int), `username` (varchar), `password_hash` (varchar), `role` (varchar: 'admin'/'kasir'/'customer'/'gate')
2. `PROMO`: `kode_promo` (PK, varchar), `nominal_potongan` (int), `kuota_promo` (int), `tanggal_kadaluarsa` (date)
3. `TIKET`: `id` (PK, int), `tier` (varchar: Batch 1, Batch 2, VIP), `harga` (int), `sisa_kuota` (int)
4. `ADDON`: `id` (PK, int), `nama_item` (varchar), `harga` (int), `stok` (int)
5. `TRANSAKSI`: `no_invoice` (PK, varchar), `waktu_transaksi` (datetime), `id_pengguna` (FK, int, nullable), `kode_promo` (FK, varchar, nullable), `nama_pemesan` (varchar), `email_pemesan` (varchar), `no_telp_pemesan` (varchar), `metode_pembayaran` (varchar: CASH, QRIS, VA), `status_transaksi` (varchar: PENDING, PAID, EXPIRED), `total_bayar` (int), `nominal_kembalian` (int)
6. `TRANSAKSI_DETAIL`: `id_detail` (PK, int), `no_invoice` (FK, varchar), `id_tiket` (FK, int, nullable), `id_addon` (FK, int, nullable), `kuantitas` (int), `subtotal` (int)
7. `TIKET_ITEM`: `kode_tiket` (PK, varchar), `id_detail` (FK, int), `qr_code_hash` (varchar), `status_kehadiran` (varchar: 'Belum Hadir', 'Checked-In'), `waktu_checkin` (datetime, nullable)

## 5. Spesifikasi Class Diagram (DPPL Tabel 38 - Evaluasi Tugas 6)
Gunakan Enkapsulasi OOP (Private attributes `#` / `-`, Public methods `+`):
- `CLS-01 PenggunaEntity`: `#id`, `#username`, `#password_hash`, `#role` | Methods: `+login()`, `+logout()`
- `CLS-02 TransaksiEntity`: `#no_invoice`, `#waktu_transaksi`, `#id_pengguna`, `#kode_promo`, `#nama_pemesan`, `#email_pemesan`, `#no_telp_pemesan`, `#metode_pembayaran`, `#status_transaksi`, `#total_bayar`, `#nominal_kembalian` | Methods: `+saveTransaction()`, `+updateStatus()`
- `CLS-03 TransaksiDetailEntity`: `#id_detail`, `#no_invoice`, `#id_tiket`, `#id_addon`, `#kuantitas`, `#subtotal`
- `TiketEntity`: `#id`, `#tier`, `#harga`, `#sisa_kuota` | Methods: `+checkQuota(tierId, qty)`
- `AddonEntity`: `#id`, `#nama_item`, `#harga`, `#stok` | Methods: `+checkStok(id, qty)`
- `PromoEntity`: `#kode_promo`, `#nominal_potongan`, `#kuota_promo`, `#tanggal_kadaluarsa` | Methods: `+validatePromo(kode)`
- `TiketItemEntity`: `#kode_tiket`, `#id_detail`, `#qr_code_hash`, `#status_kehadiran`, `#waktu_checkin` | Methods: `+verifyAndMarkCheckedIn(qrPayload)`
- Controllers: `TransactionController`, `OrderController`, `PaymentController`, `EventController`, `AddonController` (`CLS-13`), `PromoController` (`CLS-14`), `ReportController` (`CLS-15`), `ValidationController`.