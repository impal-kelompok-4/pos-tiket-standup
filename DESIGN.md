# DESIGN.md — Panduan Desain & Visual Sistem Pemesanan Tiket

Dokumen ini mendefinisikan sistem desain visual, identitas produk, palet warna, tipografi, dan spesifikasi antarmuka untuk aplikasi **Stand-Up Comedy PoS & E-Ticketing ("Tiket.")**. Pedoman ini disarikan langsung dari referensi rancangan antarmuka resmi pada direktori `docs/doc_tugas1/UI/` serta spesifikasi dokumen DPPL.

---

## 1. Identitas & Karakter Desain (Brand Identity)

* **Nama Produk**: `Tiket.` (dengan ikon tiket rounded berlatar biru royal dan penulisan tebal dengan titik aksen).
* **Topik Aplikasi**: Sistem Kasir PoS & Pemesanan Tiket Mandiri *Stand-Up Comedy Night*.
* **Karakter Visual**: Bersih (*clean*), fungsional, modern, dan berkontras tinggi. Menggabungkan efisiensi operasional kasir cepat dengan atmosfer acara komedi malam hari (*night show*) tanpa jatuh ke dalam tren klise AI (*anti-slop*).
* **Dials Visual (Tuned Parameters)**:
  * **ENERGY**: `2` (Fokus fungsional, dinamis, tanpa dekorasi grafis yang mengalihkan perhatian dari transaksi).
  * **RHYTHM**: `3` (Struktur modular yang teratur antara kartu tiket, kolom kasir, panel metrik, dan tabel ringkasan).
  * **MOTION**: `1` (Transisi mikro 150–200ms untuk *hover*, status tombol, dan penekanan aktif; tanpa animasi parallax berlebihan).

---

## 2. Palet Warna & Token Desain (Color Tokens)

Palet warna diekstraksi dari mockup antarmuka [09-mobile-pilih-tiket.png](docs/doc_tugas1/UI/09-mobile-pilih-tiket.png) dan antarmuka desktop PoS [1791434437699-5b2aadb6-c872-4e20-a07d-0862ff0852cd_1.jpg](docs/doc_tugas1/UI/1791434437699-5b2aadb6-c872-4e20-a07d-0862ff0852cd_1.jpg):

### A. Warna Utama (Primary Brand)
* **Brand Primary**: `#2563EB` (Tailwind `blue-600`) — Digunakan untuk CTA utama (*Lanjut checkout*, *Bayar sekarang*, *Validasi*), status aktif, dan aksen navigasi.
* **Brand Primary Hover**: `#1D4ED8` (Tailwind `blue-700`) — Keadaan *hover* interaktif.
* **Brand Primary Light**: `#EFF6FF` (Tailwind `blue-50`) — Latar belakang tombol sekunder (*Tambah*, *Terapkan*, *Pakai*) dan border seleksi kartu.
* **Brand Border Active**: `#3B82F6` (Tailwind `blue-500`) — Indikator border kartu tiket saat terpilih.

### B. Warna Aksen Acara (Show & Nighttime Accent)
* **Navy Hero Surface**: `#0F1E36` / `#0F172A` (Tailwind `slate-900`) — Digunakan khusus untuk *Hero Banner* promosi acara komedi malam dan latar bingkai kamera scanner gate. Memberikan nuansa panggung malam tanpa mengorbankan keterbacaan teks putih di atasnya.

### C. Warna Latar & Permukaan (Surfaces & Neutrals)
* **App Canvas (Background)**: `#F8FAFC` (Tailwind `slate-50`) — Latar belakang aplikasi yang sejuk dan bersih.
* **Card Surface**: `#FFFFFF` (Pure White) — Permukaan kartu produk, formulir, dan tabel data.
* **Card Border**: `#E2E8F0` (Tailwind `slate-200`) — Garis batas kontur kartu 1px yang tegas dan halus.
* **Muted Surface**: `#F1F5F9` (Tailwind `slate-100`) — Latar belakang kolom input non-aktif, tab tidak terpilih, dan *stepper container*.

### D. Tipografi & Kontras Teks (Text Hierarchy)
* **Text Primary**: `#0F172A` (Tailwind `slate-900`) — Judul utama, harga angka tebal, dan label esensial (Rasio kontras > 12:1).
* **Text Secondary**: `#475569` (Tailwind `slate-600`) — Deskripsi produk, rincian kuantitas, tanggal acara.
* **Text Muted**: `#94A3B8` (Tailwind `slate-400`) — Teks bantuan, penanda kuota habis, dan shortcut keyboard.
* **Text Inverted**: `#FFFFFF` (White) — Teks di atas tombol biru dan banner navy.

### E. Status & Validasi Fungsional (Status Indicators)
* **Success (Tersedia / Terbayar / Valid)**:
  * Text: `#16A34A` (Green-600)
  * Background: `#DCFCE7` (Green-100)
  * Contoh: Badge `Tersedia`, `Promo aktif`, `Printer terhubung`, `Tiket valid`, `PAID`, `Checked-In`.
* **Danger / Sold Out (Habis / Ditolak)**:
  * Text: `#DC2626` (Red-600)
  * Background: `#FEE2E2` (Red-100)
  * Contoh: Badge `Habis`, `Sold out`, `Sudah digunakan`, ikon hapus item.
* **Warning / Pending (Menunggu Pembayaran)**:
  * Text: `#D97706` (Amber-600)
  * Background: `#FEF3C7` (Amber-100)
  * Contoh: Badge `Menunggu pembayaran`, timer sisa waktu bayar (`14:32`).

---

## 3. Tipografi & Skala Teks

Menggunakan font sans-serif modern yang mudah dibaca (*Inter*, *Plus Jakarta Sans*, atau *system-ui*):

| Level | Ukuran / Leading | Weight | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Display / H1** | `28px - 32px` / `1.2` | Bold (`700`) | Judul banner acara komedi, headline halaman utama. |
| **Section Title** | `20px - 22px` / `1.3` | Bold (`700`) | `Pilih tiket`, `Transaksi kasir`, `Master event & kuota`. |
| **Card Heading** | `16px - 18px` / `1.4` | Bold (`700`) | Nama tier tiket (`Batch 1`), judul kartu ringkasan. |
| **Monetary Price** | `18px - 24px` / `1.2` | Bold (`700`) | Angka harga (`Rp75.000`, `Rp170.000`). |
| **Body Regular** | `14px` / `1.5` | Regular (`400`) | Nilai field form, teks rincian, teks tabel data. |
| **Label / Subtitle** | `12px - 13px` / `1.4` | Medium (`500`) | Keterangan kuota (`120 tiket tersedia`), placeholder. |
| **Micro / Badge** | `11px - 12px` / `1.2` | Semibold (`600`) | Status badge (`Aktif`, `Tersedia`), tag hotkey (`[F2]`). |

---

## 4. Pola Komponen Inti (Component Patterns)

### A. Kartu Tiket & Kuantitas Stepper
* **Wadah Kartu**: Latar putih, radius `rounded-2xl` (16px), border 1px `#E2E8F0`. Jika dipilih (*selected*), border berubah menjadi `#3B82F6` dengan background tipis `#EFF6FF`.
* **Komponen Stepper**:
  * Wadah berbentuk kapsul/rounded (`rounded-xl`), background `#F8FAFC`, border `#E2E8F0`.
  * Tombol decrement (`-`) dan increment (`+`) dengan tap-target minimal `36px x 36px`.
  * Angka kuantitas diapit di tengah dengan font tebal (`font-bold`).
* **Kondisi Kuota Habis (*Sold Out*)**:
  * Teks judul tiket dan harga menjadi redup (`text-slate-400`).
  * Stepper digantikan dengan badge teks `Habis` / `Tidak tersedia`.

### B. Badge Status & Tag Fungsional
* **Dimensi**: Padding horizontal `px-2.5`, vertical `py-1`, radius `rounded-lg` atau `rounded-full`.
* **Semantik**: Selalu memadukan warna latar lembut (*soft tint*) dengan teks berwarna solid kontras (misal latar `#DCFCE7` dengan teks `#16A34A`).

### C. Kolom Input & Form Kontrol
* **Spesifikasi**: Tinggi `44px - 48px`, padding horizontal `px-4`, border 1px `#E2E8F0`, radius `rounded-xl`.
* **Focus State**: Ring fokus 2px warna `#2563EB` dengan offset bersih tanpa bayangan buram.
* **Komponen Promo**: Input kode voucher yang berdampingan langsung dengan tombol aksi `Pakai` / `Terapkan`, disertai teks umpan balik langsung (*feedback alert*) berwarna hijau saat kode promo sukses memotong harga.

### D. Panel Transaksi Kasir PoS (Tampilan Desktop 3 Kolom)
Berdasarkan antarmuka kasir [1791434437699-5b2aadb6-c872-4e20-a07d-0862ff0852cd_1.jpg](docs/doc_tugas1/UI/1791434437699-5b2aadb6-c872-4e20-a07d-0862ff0852cd_1.jpg):
1. **Kolom Kiri (Katalog Tiket & Add-on)**: Pencarian cepat + kartu item bertombol `+ Tambah` dan indikator kuota *real-time*.
2. **Kolom Tengah (Keranjang & Diskon Promo)**: Daftar rincian kuantitas, kalkulasi diskon otomatis, dan tombol faktur cetak.
3. **Kolom Kanan (Pembayaran & Kembalian)**: Tab `Tunai` vs `QRIS`, input nominal uang diterima, kalkulasi kembalian otomatis dengan warna hijau kontras tinggi, serta legend tombol pintas keyboard di bagian footer (`F2 Cari`, `F8 Bayar`, `F9 Cetak`, `Esc Batal`).

### E. Portal Pemesanan Mobile (Storefront Customer)
Berdasarkan antarmuka [09-mobile-pilih-tiket.png](docs/doc_tugas1/UI/09-mobile-pilih-tiket.png) dan [10-mobile-checkout.png](docs/doc_tugas1/UI/10-mobile-checkout.png):
* **Struktur Linear**: Header Banner Acara &rarr; Pemilihan Kategori Tiket &rarr; Tambah Add-on &rarr; Formulir Identitas Pemesan &rarr; Ringkasan & Persetujuan Ketentuan.
* **Sticky Bottom Checkout Bar**: Bilah navigasi melayang di bawah layar (*sticky bottom*) dengan rincian total bayar di sebelah kiri dan tombol aksi lebar `Lanjut checkout` / `Bayar sekarang` di sebelah kanan.

### F. Antarmuka Pemindaian Gerbang Masuk (Gate Scanner)
Berdasarkan antarmuka [1791434437699-5b2aadb6-c872-4e20-a07d-0862ff0852cd_4.jpg](docs/doc_tugas1/UI/1791434437699-5b2aadb6-c872-4e20-a07d-0862ff0852cd_4.jpg):
* **Viewport Kamera**: Latar gelap terisolasi (`#0F172A`) dengan garis bidik QR Code dan garis pemindai biru horizontal.
* **Input Cadangan Manual**: Input teks untuk mengetik kode tiket fisik secara manual jika barcode buram.
* **Kartu Hasil Validasi Cepat**: Area verifikasi visual besar di sisi kanan: ikon centang hijau besar saat tiket valid, nama penonton, tier tiket, waktu check-in, serta total statistik pengunjung yang telah masuk venue.

### G. Dasbor Administrator (Master Event, Add-on, Promo, & Laporan)
Berdasarkan antarmuka [1791434437699-5b2aadb6-c872-4e20-a07d-0862ff0852cd_5.jpg](docs/doc_tugas1/UI/1791434437699-5b2aadb6-c872-4e20-a07d-0862ff0852cd_5.jpg) s.d. `_8.jpg`:
* **Navigasi Sidebar Kiri**: Ikon menu vertikal sederhana dengan latar aktif biru lembut (`#EFF6FF`).
* **Kartu Ringkasan Metrik**: Metrik angka besar 3-4 kolom (Total Kuota, Tiket Terjual, Sisa Kuota, Omset Bersih).
* **Tata Letak Master-Detail Split**: Tabel data utama di sisi kiri (60–65%) dan panel formulir tambah/ubah di sisi kanan (35–40%) untuk alur kerja pengelolaan data yang cepat tanpa berpindah halaman.

---

## 5. Standar Anti-Slop (Negative Filter Rules)

Dalam pengembangan UI sistem tiket ini, aturan ketat berikut wajib dipatuhi:
1. **Tidak Ada Gradien Ungu-Indigo Template AI**: Warna aksen adalah biru royal (`#2563EB`) dan navy gelap (`#0F1E36`). Jangan gunakan gradien ungu-pink atau neon orbs.
2. **Tidak Ada Ikon Sparkle / Magic AI**: Jangan menambahkan ikon sparkle ✨ atau robot yang tidak relevan dengan konteks ticketing. Gunakan ikon semantik SVG yang bermakna (mikrofon 🎙️, kalender 📅, pin lokasi 📍, printer 🖨️, tiket 🎫).
3. **Komponen Bekerja Penuh (*Functional Completeness*)**: Setiap tombol harus memiliki status interaktif nyata, bukan sekadar elemen pajangan visual.
4. **Resiliensi Multi-Screen**: Antarmuka kasir dan admin dioptimasi untuk tablet/desktop (min. 1024px), sementara alur pemesanan penonton responsif dari ponsel 360px hingga layar lebar.
