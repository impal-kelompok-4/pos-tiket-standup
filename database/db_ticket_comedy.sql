-- ============================================================================
-- MODUL          : Skema Fisik Basis Data & Data Seeding (db_tiket_pos.sql)
-- REFERENSI      : DPPL-01 Bab 2.4 (Hal. 50) & SKPL Bab 4.7
-- TOPIK TUBES    : Sistem Pemesanan Tiket Stand-Up Comedy (PoS & Self-Service)
-- PENGEMBANG     : 1. Abisar Fathir (103112400068) - DDL Create Tables
--                  2. Dimas Ramadhani (103112400065) - DML Seed 5 Dummy Data
-- ============================================================================

-- 1. INISIALISASI DATABASE
CREATE DATABASE IF NOT EXISTS db_tiket_pos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_tiket_pos;

-- Matikan sementara pengecekan Foreign Key agar bisa di-reset tanpa error
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS TIKET_ITEM;
DROP TABLE IF EXISTS TRANSAKSI_DETAIL;
DROP TABLE IF EXISTS TRANSAKSI;
DROP TABLE IF EXISTS ADDON;
DROP TABLE IF EXISTS TIKET;
DROP TABLE IF EXISTS PROMO;
DROP TABLE IF EXISTS PENGGUNA;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- BAGIAN 1: DDL (CREATE TABLE) - 7 TABEL UTAMA SESUAI ERD DPPL
-- ============================================================================

-- 1. Tabel PENGGUNA (Menyimpan kredensial Admin, Kasir PoS, dan Petugas Gate)
CREATE TABLE PENGGUNA (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'admin, kasir, gate'
) ENGINE=InnoDB;

-- 2. Tabel PROMO (Menyimpan kode voucher diskon & batas kuota)
CREATE TABLE PROMO (
    kode_promo VARCHAR(30) PRIMARY KEY,
    nominal_potongan INT NOT NULL CHECK (nominal_potongan >= 0),
    kuota_promo INT NOT NULL CHECK (kuota_promo >= 0),
    tanggal_kadaluarsa DATE NOT NULL
) ENGINE=InnoDB;

-- 3. Tabel TIKET (Master kategori/tier tiket Stand-Up Comedy & sisa kuota)
CREATE TABLE TIKET (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tier VARCHAR(50) NOT NULL,
    harga INT NOT NULL CHECK (harga >= 0),
    sisa_kuota INT NOT NULL CHECK (sisa_kuota >= 0)
) ENGINE=InnoDB;

-- 4. Tabel ADDON (Katalog produk tambahan snack, minuman, & merchandise)
CREATE TABLE ADDON (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_item VARCHAR(100) NOT NULL,
    harga INT NOT NULL CHECK (harga >= 0),
    stok INT NOT NULL CHECK (stok >= 0)
) ENGINE=InnoDB;

-- 5. Tabel TRANSAKSI (Header pencatatan transaksi kasir PoS & Online)
CREATE TABLE TRANSAKSI (
    no_invoice VARCHAR(30) PRIMARY KEY,
    waktu_transaksi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_pengguna INT NULL COMMENT 'Nullable jika self-service online',
    kode_promo VARCHAR(30) NULL COMMENT 'Nullable jika tanpa promo',
    nama_pemesan VARCHAR(100) NOT NULL,
    email_pemesan VARCHAR(100) NOT NULL,
    no_telp_pemesan VARCHAR(20) NOT NULL,
    metode_pembayaran VARCHAR(20) NOT NULL COMMENT 'CASH, QRIS, VA',
    status_transaksi VARCHAR(20) NOT NULL COMMENT 'PENDING, PAID, EXPIRED',
    total_bayar INT NOT NULL CHECK (total_bayar >= 0),
    nominal_kembalian INT NOT NULL DEFAULT 0 CHECK (nominal_kembalian >= 0),
    CONSTRAINT fk_transaksi_pengguna
        FOREIGN KEY (id_pengguna) REFERENCES PENGGUNA(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_transaksi_promo
        FOREIGN KEY (kode_promo) REFERENCES PROMO(kode_promo)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Tabel TRANSAKSI_DETAIL (Rincian item tiket atau add-on dalam 1 invoice)
CREATE TABLE TRANSAKSI_DETAIL (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    no_invoice VARCHAR(30) NOT NULL,
    id_tiket INT NULL COMMENT 'Nullable jika item adalah addon',
    id_addon INT NULL COMMENT 'Nullable jika item adalah tiket',
    kuantitas INT NOT NULL CHECK (kuantitas > 0),
    subtotal INT NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detail_transaksi
        FOREIGN KEY (no_invoice) REFERENCES TRANSAKSI(no_invoice)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_detail_tiket
        FOREIGN KEY (id_tiket) REFERENCES TIKET(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_detail_addon
        FOREIGN KEY (id_addon) REFERENCES ADDON(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Tabel TIKET_ITEM (E-Tiket individual & QR Code untuk Gate Check-In)
CREATE TABLE TIKET_ITEM (
    kode_tiket VARCHAR(40) PRIMARY KEY,
    id_detail INT NOT NULL,
    qr_code_hash VARCHAR(255) NOT NULL UNIQUE,
    status_kehadiran VARCHAR(20) NOT NULL DEFAULT 'Belum Hadir' COMMENT 'Belum Hadir, Checked-In',
    waktu_checkin DATETIME NULL,
    CONSTRAINT fk_tiketitem_detail
        FOREIGN KEY (id_detail) REFERENCES TRANSAKSI_DETAIL(id_detail)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================================================
-- BAGIAN 2: DML (INSERT INTO) - 5 DATA DUMMY UNTUK SETIAP TABEL (TUGAS 5)
-- ============================================================================

-- 1. Insert 5 Data PENGGUNA (Catatan: password_hash diisi plain/simulasi untuk memudahkan tes Login Tugas 6)
INSERT INTO PENGGUNA (id, username, password_hash, role) VALUES
(1, 'admin_utama', 'admin123', 'admin'),
(2, 'kasir_pos01', 'kasir123', 'kasir'),
(3, 'kasir_pos02', 'kasir123', 'kasir'),
(4, 'petugas_gate1', 'gate123', 'gate'),
(5, 'supervisor_acara', 'super123', 'admin');

-- 2. Insert 5 Data PROMO (Sesuai mockup UI DPPL: KETAWA10, ROAST20, OPENING10, dll.)
INSERT INTO PROMO (kode_promo, nominal_potongan, kuota_promo, tanggal_kadaluarsa) VALUES
('KETAWA10', 10000, 62, '2026-10-24'),
('ROAST20', 20000, 38, '2026-10-24'),
('OPENING10', 10000, 0, '2026-10-20'),
('KOMIKA25', 25000, 25, '2026-11-15'),
('MAHASISWA15', 15000, 50, '2026-11-01');

-- Kode promo MAHASISWA15 siap digunakan tanpa whitespace
-- (Telah dinormalisasi langsung pada pernyataan INSERT di atas)

-- 3. Insert 5 Data TIKET (Kategori/Tier Tiket Stand-Up Comedy Night)
INSERT INTO TIKET (id, tier, harga, sisa_kuota) VALUES
(1, 'Early Bird', 50000, 0),
(2, 'Batch 1', 75000, 120),
(3, 'Batch 2', 100000, 80),
(4, 'VIP', 150000, 25),
(5, 'VVIP (Meet & Greet)', 250000, 10);

-- 4. Insert 5 Data ADDON (Menu Snack, Minuman, & Merchandise)
INSERT INTO ADDON (id, nama_item, harga, stok) VALUES
(1, 'Paket Snack (Popcorn + Cola)', 15000, 100),
(2, 'Popcorn Caramel Large', 20000, 75),
(3, 'Es Kopi Susu Komika', 18000, 60),
(4, 'Air Mineral 600ml', 5000, 150),
(5, 'Official Stiker Pack Stand-Up', 12000, 50);

-- 5. Insert 5 Data TRANSAKSI (Kombinasi Transaksi Kasir PoS & Online Self-Service)
INSERT INTO TRANSAKSI (
    no_invoice, waktu_transaksi, id_pengguna, kode_promo,
    nama_pemesan, email_pemesan, no_telp_pemesan,
    metode_pembayaran, status_transaksi, total_bayar, nominal_kembalian
) VALUES
-- TRX 1: Sesuai persis dengan Mockup UI Halaman Transaksi Kasir PoS (Gambar 3 DPPL Hal. 15)
('TRX-20261024-042', '2026-10-24 19:20:00', 2, 'KETAWA10', 'Budi Santoso', 'budi.s@email.com', '081234567801', 'CASH', 'PAID', 170000, 30000),
-- TRX 2: Transaksi Kasir PoS menggunakan QRIS tanpa promo
('TRX-20261024-043', '2026-10-24 19:25:10', 2, NULL, 'Siti Aminah', 'siti.aminah@email.com', '081234567802', 'QRIS', 'PAID', 100000, 0),
-- TRX 3: Transaksi Online Self-Service (id_pengguna NULL) pakai promo ROAST20
('TRX-20261024-044', '2026-10-24 19:30:45', NULL, 'ROAST20', 'Andi Pratama', 'andi.p@email.com', '081234567803', 'VA', 'PAID', 300000, 0),
-- TRX 4: Transaksi Online Self-Service status masih PENDING
('TRX-20261024-045', '2026-10-24 19:35:12', NULL, NULL, 'Dewi Lestari', 'dewi.l@email.com', '081234567804', 'QRIS', 'PENDING', 75000, 0),
-- TRX 5: Transaksi Kasir PoS 02 dengan tunai dan promo MAHASISWA15
('TRX-20261024-046', '2026-10-24 19:40:00', 3, 'MAHASISWA15', 'Rizky Ramadhan', 'rizky.r@email.com', '081234567805', 'CASH', 'PAID', 253000, 47000);

-- 6. Insert 5 Data TRANSAKSI_DETAIL
INSERT INTO TRANSAKSI_DETAIL (id_detail, no_invoice, id_tiket, id_addon, kuantitas, subtotal) VALUES
-- Detail 1 & 2 milik TRX-20261024-042 (2 Tiket Batch 1 @75rb + 2 Paket Snack @15rb = 180rb, dipotong promo 10rb jadi 170rb)
(1, 'TRX-20261024-042', 2, NULL, 2, 150000),
(2, 'TRX-20261024-042', NULL, 1, 2, 30000),
-- Detail 3 milik TRX-20261024-043 (1 Tiket Batch 2 @100rb)
(3, 'TRX-20261024-043', 3, NULL, 1, 100000),
-- Detail 4 milik TRX-20261024-044 (2 Tiket VIP @150rb = 300rb)
(4, 'TRX-20261024-044', 4, NULL, 2, 300000),
-- Detail 5 milik TRX-20261024-046 (1 Tiket VVIP @250rb)
(5, 'TRX-20261024-046', 5, NULL, 1, 250000);

-- 7. Insert 5 Data TIKET_ITEM (E-Tiket & Hash QR Code untuk Gate Scanner)
INSERT INTO TIKET_ITEM (kode_tiket, id_detail, qr_code_hash, status_kehadiran, waktu_checkin) VALUES
('TKT-2026-001', 1, 'QRHASH-8f9d2a1b-001', 'Checked-In', '2026-10-24 19:45:10'),
('TKT-2026-002', 1, 'QRHASH-8f9d2a1b-002', 'Checked-In', '2026-10-24 19:45:25'),
('TKT-2026-003', 3, 'QRHASH-3c4e5f6a-003', 'Belum Hadir', NULL),
('TKT-2026-004', 4, 'QRHASH-7b8c9d0e-004', 'Belum Hadir', NULL),
('TKT-2026-005', 4, 'QRHASH-7b8c9d0e-005', 'Belum Hadir', NULL);

-- ============================================================================
-- BAGIAN 3: QUERY VERIFIKASI (UNTUK SCREENSHOT LAPORAN PDF TUGAS 5)
-- ============================================================================
SELECT * FROM PENGGUNA;
SELECT * FROM PROMO;
SELECT * FROM TIKET;
SELECT * FROM ADDON;
SELECT * FROM TRANSAKSI;
SELECT * FROM TRANSAKSI_DETAIL;
SELECT * FROM TIKET_ITEM;