/**
 * ============================================================================
 * MODUL          : Beranda Portal Sistem Pemesanan Tiket (page.js)
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL (Overview Aplikasi Stand-Up Comedy)
 * PENGEMBANG     : Keishin Naufa Alfaridzhi - 103112400061 (Lead UI/UX & Frontend)
 * DESKRIPSI      : Halaman beranda utama sistem tiket dan PoS Stand-Up Comedy
 *                  dengan identitas visual resmi Tiket., hero banner acara,
 *                  dan navigasi cepat (Quick Access Hub) ke 5 modul utama.
 * ============================================================================
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8 lg:p-12 font-sans">
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-6xl w-full mx-auto pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="3" cy="12" r="2" fill="#2563EB" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="21" cy="12" r="2" fill="#2563EB" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Tiket<span className="text-blue-600">.</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                PoS &amp; E-Ticketing
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Stand-Up Comedy Night &bull; Tubes ImPal Kelompok 4
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link
            href="/order"
            className="flex-1 sm:flex-initial text-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors"
          >
            Pesan Online
          </Link>
          <Link
            href="/pos"
            className="flex-1 sm:flex-initial text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Buka Kasir PoS
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto my-6 sm:my-8 space-y-8">
        {/* Quick Access Hub (Navigasi Cepat Pengujian Dosen & Asisten) */}
        <section aria-label="Quick Access Hub" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Portal Akses Cepat Pengujian
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Navigasi Instan Modul Sistem
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Akses langsung tanpa hambatan login
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Kasir PoS */}
            <Link
              href="/pos"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  Kasir PoS
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Katalog, keranjang, diskon promo, dan hitung kembalian.
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-600 mt-3 inline-block">
                /pos &rarr;
              </span>
            </Link>

            {/* 2. Beli Tiket Online */}
            <Link
              href="/order"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  Beli Tiket Online
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Storefront pemesanan mandiri, add-on, checkout QRIS/VA.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 mt-3 inline-block">
                /order &rarr;
              </span>
            </Link>

            {/* 3. Gate Scanner */}
            <Link
              href="/gate"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  Gate Scanner
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Simulasi scan QR tiket, validasi kehadiran, anti double check-in.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-900 mt-3 inline-block">
                /gate &rarr;
              </span>
            </Link>

            {/* 4. Admin Dasbor */}
            <Link
              href="/admin"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  Admin Dasbor
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kelola event, kuota tiket, add-on, voucher promo, laporan omzet.
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-700 mt-3 inline-block">
                /admin &rarr;
              </span>
            </Link>

            {/* 5. Login Multi-Role */}
            <Link
              href="/login"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  Login Multi-Role
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Akses login peran Kasir, Admin Utama, dan Petugas Gate.
                </p>
              </div>
              <span className="text-xs font-semibold text-purple-700 mt-3 inline-block">
                /login &rarr;
              </span>
            </Link>
          </div>
        </section>

        {/* Navy Hero Banner Acara (DESIGN.md Section 2.B) */}
        <section className="bg-slate-900 rounded-2xl p-6 sm:p-10 text-white border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">
              Stand-Up Comedy Night
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Sistem Pemesanan Tiket <br className="hidden sm:inline" />
              <span className="text-blue-400">Siap Ketawa Bareng?</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
              Platform terintegrasi kasir PoS offline, storefront pemesanan mandiri daring,
              katalog add-on snack &amp; merchandise, serta validasi e-tiket QR code pintu masuk (Gate).
            </p>

            {/* Info Waktu & Tempat Acara */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300 mb-8">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>24 Okt 2026 &bull; 16.00 WIB</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Gedung Serbaguna, Purwokerto</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/order"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Pesan Tiket Sekarang
              </Link>
              <Link
                href="/pos"
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-medium rounded-xl border border-slate-700 transition-all text-center focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Buka Layar Kasir PoS
              </Link>
            </div>
          </div>
        </section>

        {/* Katalog Tier Tiket (Referensi 09-mobile-pilih-tiket.png) */}
        <section id="katalog-tiket" className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Pilih Tiket
              </h2>
              <p className="text-xs text-slate-500">
                Kategori tiket resmi panggung Stand-Up Comedy Night
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Maks. 4 tiket / kategori
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Batch 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-900 text-base">Batch 1</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Tersedia
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  Rp75.000
                </div>
                <p className="text-xs text-slate-500">
                  120 tiket tersedia
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Akses reguler panggung</span>
                <Link
                  href="/order"
                  className="font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
                >
                  Pesan Online &rarr;
                </Link>
              </div>
            </div>

            {/* Batch 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-900 text-base">Batch 2</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Tersedia
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  Rp100.000
                </div>
                <p className="text-xs text-slate-500">
                  80 tiket tersedia
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Akses reguler panggung</span>
                <Link
                  href="/order"
                  className="font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
                >
                  Pesan Online &rarr;
                </Link>
              </div>
            </div>

            {/* VIP */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between opacity-80">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-500 text-base">VIP</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Habis
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-400 mb-1">
                  Rp150.000
                </div>
                <p className="text-xs text-slate-400">
                  Kuota habis &bull; Tidak tersedia
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Kursi baris depan + merchandise</span>
                <span className="font-medium text-slate-400">Sold out</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Modul Sistem Terintegrasi
            </h2>
            <p className="text-xs text-slate-500">
              Komponen aplikasi sesuai spesifikasi dokumen DPPL &amp; SKPL Kelompok 4
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">PoS Kasir Cepat</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencatatan transaksi kasir, kalkulasi otomatis subtotal, diskon voucher promo, dan kalkulasi uang kembalian tunai.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">E-Tiket QR &amp; Gate</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penerbitan barcode QR unik per tiket fisik maupun daring untuk verifikasi status kehadiran pengunjung di gate.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Arsitektur MVC / BCE</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Struktur kode modular berbasis OOP (Boundary/View Next.js, Controller, dan Entity terenkapsulasi dengan MySQL).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          &copy; 2026 ImPal Kelompok 4 &bull; S1 Rekayasa Perangkat Lunak Telkom University
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">MySQL db_tiket_pos</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">Next.js App Router</span>
        </div>
      </footer>
    </div>
  );
}
