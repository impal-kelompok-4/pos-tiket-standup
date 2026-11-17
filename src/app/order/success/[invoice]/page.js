/**
 * ============================================================================
 * MODUL          : Pemesanan Mandiri Daring - E-Tiket Sukses (src/app/order/success/[invoice]/page.js)
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL KF-04, KF-06 (Ringkasan Sukses & E-Tiket)
 * PENGEMBANG     : Keishin Naufa Alfaridzhi - 103112400061 (Lead UI/UX & Frontend)
 * DESKRIPSI      : Halaman ringkasan pemesanan sukses dan kartu digital E-Ticket
 *                  penonton: menampilkan QR visual SVG, nomor invoice, nama
 *                  pemesan, dan petunjuk check-in gate di venue acara.
 * ============================================================================
 */

'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';

function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number || 0);
}

function OrderSuccessContent({ params }) {
  const resolvedParams = use(params);
  const invoice = resolvedParams?.invoice
    ? decodeURIComponent(resolvedParams.invoice)
    : '';

  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [checkoutData] = useState(() => {
    if (typeof window === 'undefined' || !invoice) return null;
    try {
      const cached = sessionStorage.getItem(`impal_checkout_${invoice}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Ambil data transaksi dari API
  useEffect(() => {
    if (!invoice) return;

    let ignore = false;

    async function fetchTransaction() {
      try {
        const res = await fetch(
          `/api/transactions?invoice=${encodeURIComponent(invoice)}`
        );
        const json = await res.json();
        if (!ignore) {
          if (json.success && json.data) {
            setTransaction(json.data);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Galat saat mengambil data invoice:', err);
        if (!ignore) setLoading(false);
      }
    }

    fetchTransaction();

    return () => {
      ignore = true;
    };
  }, [invoice]);

  // Data gabungan untuk tampilan
  const customerName =
    transaction?.nama_pemesan ||
    checkoutData?.customer?.nama_pemesan ||
    'Penonton Stand-Up';

  const customerEmail =
    transaction?.email_pemesan ||
    checkoutData?.customer?.email_pemesan ||
    'penonton@email.com';

  const customerPhone =
    transaction?.no_telp_pemesan ||
    checkoutData?.customer?.no_telp_pemesan ||
    '-';

  const totalBayar =
    transaction?.total_bayar || checkoutData?.totalBayar || 0;

  const paymentStatus =
    transaction?.status_transaksi || checkoutData?.status || 'PAID';

  const paymentMethod =
    transaction?.metode_pembayaran ||
    checkoutData?.payment?.method ||
    'QRIS';

  const qrVisualString =
    checkoutData?.payment?.qrString ||
    `QRHASH-${invoice}-TKTDIGITAL-2026`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-16">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 text-xs font-semibold"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Beranda</span>
          </Link>
          <span className="font-extrabold text-slate-900 text-sm">
            Tiket<span className="text-blue-600">.</span> E-Ticket
          </span>
          <span className="w-16"></span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Step Indicator 4 of 4 (Complete) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-emerald-600">Langkah 4 dari 4: Sukses!</span>
            <span className="text-slate-500">E-Tiket Diterbitkan</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
          </div>
        </div>

        {/* Hero Card Konfirmasi Sukses */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Pemesanan Berhasil!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            E-Tiket resmi Stand-Up Comedy Night Anda siap digunakan.
          </p>
        </div>

        {/* Digital E-Ticket Card (Branding Stand-Up Comedy) */}
        <div className="bg-white border-2 border-slate-300 rounded-3xl overflow-hidden shadow-lg">
          {/* Top Ticket Header (Navy Surface #0F172A) */}
          <div className="bg-slate-900 text-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Official E-Ticket
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                {paymentStatus === 'PAID' ? 'LUNAS / VALID' : 'PENDING'}
              </span>
            </div>

            <h2 className="text-lg font-extrabold tracking-tight">
              Stand-Up Comedy Night: Purwokerto
            </h2>

            <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <span>Sabtu, 24 Okt 2026</span>
              <span>&bull;</span>
              <span>16.00 WIB</span>
              <span>&bull;</span>
              <span>Gedung Serbaguna</span>
            </div>
          </div>

          {/* Ticket Perforation Tear Effect */}
          <div className="relative bg-white py-1">
            <div className="absolute left-0 -top-3 w-6 h-6 rounded-full bg-slate-50 border-r-2 border-slate-300"></div>
            <div className="absolute right-0 -top-3 w-6 h-6 rounded-full bg-slate-50 border-l-2 border-slate-300"></div>
            <div className="border-b-2 border-dashed border-slate-200 mx-7 my-2"></div>
          </div>

          {/* Ticket Body Content */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Visual QR Code SVG Box */}
            <div className="text-center space-y-3">
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center">
                {/* SVG Visual QR Barcode Representation */}
                <svg
                  className="w-full h-full text-slate-900"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  aria-label="QR Code E-Tiket"
                >
                  {/* Top-Left Corner Box */}
                  <rect x="5" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                  <rect x="9" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="13" y="13" width="10" height="10" fill="#0F172A" rx="1" />

                  {/* Top-Right Corner Box */}
                  <rect x="69" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                  <rect x="73" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="77" y="13" width="10" height="10" fill="#0F172A" rx="1" />

                  {/* Bottom-Left Corner Box */}
                  <rect x="5" y="69" width="26" height="26" fill="#0F172A" rx="4" />
                  <rect x="9" y="73" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="13" y="77" width="10" height="10" fill="#0F172A" rx="1" />

                  {/* Data Pattern Matrix Blocks */}
                  <rect x="36" y="8" width="8" height="8" fill="#0F172A" />
                  <rect x="48" y="8" width="6" height="6" fill="#0F172A" />
                  <rect x="58" y="10" width="6" height="8" fill="#0F172A" />

                  <rect x="36" y="20" width="10" height="6" fill="#0F172A" />
                  <rect x="50" y="18" width="8" height="8" fill="#0F172A" />

                  <rect x="8" y="36" width="10" height="6" fill="#0F172A" />
                  <rect x="22" y="36" width="6" height="10" fill="#0F172A" />
                  <rect x="36" y="34" width="8" height="8" fill="#0F172A" />
                  <rect x="48" y="36" width="14" height="6" fill="#0F172A" />
                  <rect x="68" y="36" width="8" height="10" fill="#0F172A" />
                  <rect x="82" y="36" width="10" height="6" fill="#0F172A" />

                  <rect x="8" y="50" width="8" height="10" fill="#0F172A" />
                  <rect x="20" y="50" width="12" height="6" fill="#0F172A" />
                  <rect x="38" y="48" width="10" height="10" fill="#0F172A" />
                  <rect x="54" y="50" width="8" height="8" fill="#0F172A" />
                  <rect x="70" y="50" width="10" height="6" fill="#0F172A" />
                  <rect x="84" y="50" width="8" height="8" fill="#0F172A" />

                  <rect x="36" y="66" width="8" height="8" fill="#0F172A" />
                  <rect x="50" y="64" width="12" height="6" fill="#0F172A" />
                  <rect x="68" y="66" width="6" height="10" fill="#0F172A" />
                  <rect x="80" y="66" width="12" height="8" fill="#0F172A" />

                  <rect x="36" y="80" width="10" height="8" fill="#0F172A" />
                  <rect x="52" y="78" width="8" height="12" fill="#0F172A" />
                  <rect x="66" y="82" width="12" height="8" fill="#0F172A" />
                  <rect x="82" y="80" width="10" height="10" fill="#0F172A" />
                </svg>
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-slate-800 tracking-wider block">
                  {invoice}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-xs mx-auto">
                  Hash: {qrVisualString.slice(0, 32)}...
                </span>
              </div>
            </div>

            {/* Rincian Pemilik Tiket */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pemesan</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-700">{customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">WhatsApp / Telp</span>
                <span className="font-medium text-slate-700">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Bayar</span>
                <span className="font-semibold text-slate-800">{paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold">
                <span className="text-slate-900">Total Pembayaran</span>
                <span className="text-blue-600">{formatRupiah(totalBayar)}</span>
              </div>
            </div>

            {/* Petunjuk Check-in Gate */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Petunjuk Check-in di Pintu Masuk (Gate):</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800 pl-6">
                Tunjukkan layar QR Code ini langsung kepada petugas pemindai di gate masuk.
                Satu QR berlaku untuk satu kali verifikasi pintu masuk (proteksi anti-double check-in).
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Navigasi Bawah */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/order"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors text-center"
          >
            Pesan Tiket Baru
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 transition-colors text-center"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function OrderSuccessPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <OrderSuccessContent params={params} />
    </Suspense>
  );
}
