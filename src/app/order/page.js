/**
 * ============================================================================
 * MODUL          : Pemesanan Mandiri Daring - Pemilihan Tiket (src/app/order/page.js)
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL KF-03, KF-04 (Pemesanan Mandiri Penonton)
 * PENGEMBANG     : Keishin Naufa Alfaridzhi - 103112400061 (Lead UI/UX & Frontend)
 * DESKRIPSI      : Langkah 1 alur pemesanan tiket mandiri online (mobile-first):
 *                  Banner acara Stand-Up Comedy Night (#0F172A), pemilihan tier
 *                  tiket (Batch 1, Batch 2, VIP), stepper kuantitas (maks. 4),
 *                  dan sticky bottom bar untuk navigasi ke pemilihan add-on.
 * ============================================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number || 0);
}

export default function OrderPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected ticket quantities: { [ticketId]: quantity }
  const [selectedTickets, setSelectedTickets] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = sessionStorage.getItem('impal_order_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch {
      // Abaikan jika storage tidak tersedia
    }
    return {};
  });

  // Muat data tier tiket dari API
  useEffect(() => {
    let ignore = false;
    async function loadTickets() {
      try {
        const res = await fetch('/api/tickets');
        const json = await res.json();
        if (!ignore) {
          if (json.success && Array.isArray(json.data)) {
            setTickets(json.data);
          } else {
            setError(json.message || 'Gagal memuat tier tiket.');
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Gagal terhubung ke server tiket.');
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      ignore = true;
    };
  }, []);

  // Update kuantitas tiket (Maksimal 4 per kategori sesuai SKPL)
  const handleUpdateQty = (ticketId, delta, maxAvailable) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const next = current + delta;

      if (next <= 0) {
        const copy = { ...prev };
        delete copy[ticketId];
        return copy;
      }

      // Validasi batas maksimum 4 tiket per tier atau sisa kuota
      const limit = Math.min(4, maxAvailable);
      if (next > limit) return prev;

      return {
        ...prev,
        [ticketId]: next,
      };
    });
  };

  // Kalkulasi total lembar tiket & subtotal
  const { totalQty, subtotal, selectedList } = useMemo(() => {
    let qty = 0;
    let sum = 0;
    const list = [];

    tickets.forEach((t) => {
      const count = selectedTickets[t.id] || 0;
      if (count > 0) {
        qty += count;
        sum += Number(t.harga) * count;
        list.push({
          id: t.id,
          tier: t.tier,
          harga: Number(t.harga),
          qty: count,
        });
      }
    });

    return { totalQty: qty, subtotal: sum, selectedList: list };
  }, [tickets, selectedTickets]);

  // Simpan state dan lanjut ke langkah Add-on
  const handleContinue = () => {
    if (totalQty === 0) return;

    try {
      sessionStorage.setItem(
        'impal_order_tickets',
        JSON.stringify(selectedTickets)
      );
      sessionStorage.setItem(
        'impal_order_tickets_data',
        JSON.stringify(selectedList)
      );
    } catch {
      // Fallback
    }

    router.push('/order/addons');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-28">
      {/* Top Header Mobile-First */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">
              Tiket<span className="text-blue-600">.</span> Order
            </span>
          </div>
          <Link
            href="/pos"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            Kasir PoS
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Step Indicator 1 of 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-blue-600">Langkah 1 dari 4</span>
            <span className="text-slate-500">Pilih Tiket</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full w-1/4"></div>
          </div>
        </div>

        {/* Navy Hero Banner Acara (#0F172A) */}
        <section className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
              STAND-UP COMEDY NIGHT
            </span>
            <span className="text-xs text-slate-400">Tubes ImPal 2026</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
            Panggung Ketawa: Spesial Purwokerto
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Malam penuh tawa bersama jajaran komika terbaik tanah air. Siapkan diri
            untuk tawa lepas tanpa henti!
          </p>

          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Sabtu, 24 Okt 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>16.00 WIB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Gedung Serbaguna, Purwokerto</span>
            </div>
          </div>
        </section>

        {/* Section Pemilihan Tier Tiket */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Pilih Kategori Tiket
              </h2>
              <p className="text-xs text-slate-500">
                Maksimal 4 tiket per kategori
              </p>
            </div>
            {totalQty > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {totalQty} tiket dipilih
              </span>
            )}
          </div>

          {/* List Kartu Tiket */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
              <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p>Memuat tier tiket...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <p className="font-semibold mb-1">Gagal memuat tiket:</p>
              <p>{error}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
              Belum ada kategori tiket yang tersedia saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const isSoldOut = Number(t.sisa_kuota) <= 0;
                const qty = selectedTickets[t.id] || 0;
                const isSelected = qty > 0;
                const isMax = qty >= 4 || qty >= Number(t.sisa_kuota);

                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSoldOut
                        ? 'bg-slate-50/70 border-slate-200 opacity-60'
                        : isSelected
                        ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-base">
                            {t.tier}
                          </h3>
                          {isSoldOut ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                              Habis
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Sisa {t.sisa_kuota}
                            </span>
                          )}
                        </div>

                        <div className="text-lg font-extrabold text-blue-600 mb-1">
                          {formatRupiah(t.harga)}
                        </div>

                        <p className="text-xs text-slate-500">
                          {t.tier.toLowerCase().includes('vvip')
                            ? 'Kursi paling depan + Meet & Greet eksklusif bersama komika'
                            : t.tier.toLowerCase().includes('vip')
                            ? 'Kursi baris depan panggung + souvenir resmi'
                            : 'Akses masuk panggung reguler festival'}
                        </p>
                      </div>

                      {/* Stepper Kuantitas */}
                      <div className="shrink-0 pt-1">
                        {isSoldOut ? (
                          <span className="text-xs font-medium text-slate-400 px-3 py-1.5 rounded-lg bg-slate-100 block">
                            Sold Out
                          </span>
                        ) : qty > 0 ? (
                          <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(t.id, -1, t.sisa_kuota)}
                              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold text-base"
                              aria-label={`Kurangi 1 ${t.tier}`}
                            >
                              -
                            </button>
                            <span className="w-9 text-center text-sm font-bold text-slate-900">
                              {qty}
                            </span>
                            <button
                              type="button"
                              disabled={isMax}
                              onClick={() => handleUpdateQty(t.id, 1, t.sisa_kuota)}
                              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label={`Tambah 1 ${t.tier}`}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(t.id, 1, t.sisa_kuota)}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors shadow-xs"
                          >
                            + Pilih
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Sticky Bottom Checkout Bar (Mobile First) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 block">
              Total ({totalQty} tiket):
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <button
            type="button"
            disabled={totalQty === 0}
            onClick={handleContinue}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>Lanjut ke Add-on</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
