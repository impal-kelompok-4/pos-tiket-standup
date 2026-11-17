/**
 * ============================================================================
 * MODUL          : Pemesanan Mandiri Daring - Pemilihan Add-on (src/app/order/addons/page.js)
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL KF-03, KF-04 (Pemesanan Mandiri Penonton)
 * PENGEMBANG     : Keishin Naufa Alfaridzhi - 103112400061 (Lead UI/UX & Frontend)
 * DESKRIPSI      : Langkah 2 alur pemesanan tiket mandiri daring (mobile-first):
 *                  Katalog snack, minuman, dan merchandise resmi Stand-Up Comedy,
 *                  stepper kuantitas, tombol lewati, dan sticky bottom bar.
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

export default function OrderAddonsPage() {
  const router = useRouter();
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected addon quantities: { [addonId]: quantity }
  const [selectedAddons, setSelectedAddons] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = sessionStorage.getItem('impal_order_addons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch {
      // Abaikan
    }
    return {};
  });

  // Simpan data tiket dari langkah 1
  const [ticketSummary] = useState(() => {
    if (typeof window === 'undefined') return { totalQty: 0, subtotal: 0 };
    try {
      const savedTicketData = sessionStorage.getItem('impal_order_tickets_data');
      if (savedTicketData) {
        const parsed = JSON.parse(savedTicketData);
        if (Array.isArray(parsed)) {
          const qty = parsed.reduce((n, t) => n + t.qty, 0);
          const sub = parsed.reduce((n, t) => n + t.harga * t.qty, 0);
          return { totalQty: qty, subtotal: sub };
        }
      }
    } catch {
      // Abaikan
    }
    return { totalQty: 0, subtotal: 0 };
  });

  // Muat data add-on dari API
  useEffect(() => {
    let ignore = false;

    async function loadAddons() {
      try {
        const res = await fetch('/api/addons');
        const json = await res.json();
        if (!ignore) {
          if (json.success && Array.isArray(json.data)) {
            setAddons(json.data);
          } else {
            setError(json.message || 'Gagal memuat katalog add-on.');
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Gagal terhubung ke server add-on.');
          setLoading(false);
        }
      }
    }

    loadAddons();

    return () => {
      ignore = true;
    };
  }, []);

  // Update kuantitas add-on
  const handleUpdateQty = (addonId, delta, maxStock) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      const next = current + delta;

      if (next <= 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }

      if (next > maxStock) return prev;

      return {
        ...prev,
        [addonId]: next,
      };
    });
  };

  // Kalkulasi total add-on
  const { addonQty, addonSubtotal, selectedAddonList } = useMemo(() => {
    let qty = 0;
    let sum = 0;
    const list = [];

    addons.forEach((a) => {
      const count = selectedAddons[a.id] || 0;
      if (count > 0) {
        qty += count;
        sum += Number(a.harga) * count;
        list.push({
          id: a.id,
          nama_item: a.nama_item,
          harga: Number(a.harga),
          qty: count,
        });
      }
    });

    return { addonQty: qty, addonSubtotal: sum, selectedAddonList: list };
  }, [addons, selectedAddons]);

  const grandSubtotal = ticketSummary.subtotal + addonSubtotal;

  // Lanjut ke Checkout
  const handleProceedToCheckout = () => {
    try {
      sessionStorage.setItem('impal_order_addons', JSON.stringify(selectedAddons));
      sessionStorage.setItem(
        'impal_order_addons_data',
        JSON.stringify(selectedAddonList)
      );
    } catch {
      // Fallback
    }

    router.push('/order/checkout');
  };

  // Lewati Add-on
  const handleSkipAddons = () => {
    try {
      sessionStorage.removeItem('impal_order_addons');
      sessionStorage.setItem('impal_order_addons_data', JSON.stringify([]));
    } catch {
      // Fallback
    }

    router.push('/order/checkout');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-28">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/order"
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
            <span>Kembali ke Tiket</span>
          </Link>
          <span className="font-extrabold text-slate-900 text-sm">
            Tiket<span className="text-blue-600">.</span> Add-on
          </span>
          <button
            type="button"
            onClick={handleSkipAddons}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Lewati
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Step Indicator 2 of 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-blue-600">Langkah 2 dari 4</span>
            <span className="text-slate-500">Camilan &amp; Merchandise</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full w-2/4"></div>
          </div>
        </div>

        {/* Ringkasan Tiket Terpilih */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-900 block">
              Tiket Terpilih
            </span>
            <span className="text-xs text-blue-700">
              {ticketSummary.totalQty > 0
                ? `${ticketSummary.totalQty} tiket (${formatRupiah(ticketSummary.subtotal)})`
                : 'Belum ada tiket terpilih'}
            </span>
          </div>
          <Link
            href="/order"
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Ubah
          </Link>
        </div>

        {/* Header Add-on */}
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Lengkapi Nontonmu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tambah camilan gurih, minuman segar, atau cinderamata resmi stand-up
            comedy.
          </p>
        </div>

        {/* List Add-on */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Memuat katalog add-on...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <p className="font-semibold mb-1">Gagal memuat add-on:</p>
            <p>{error}</p>
          </div>
        ) : addons.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
            Katalog add-on sedang kosong. Silakan langsung ke checkout.
          </div>
        ) : (
          <div className="space-y-3">
            {addons.map((a) => {
              const isSoldOut = Number(a.stok) <= 0;
              const qty = selectedAddons[a.id] || 0;
              const isSelected = qty > 0;
              const isMax = qty >= Number(a.stok);

              return (
                <div
                  key={a.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSoldOut
                      ? 'bg-slate-50/70 border-slate-200 opacity-60'
                      : isSelected
                      ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          ADD-ON
                        </span>
                        {isSoldOut ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                            Stok Habis
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Stok {a.stok}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {a.nama_item}
                      </h3>

                      <div className="text-base font-extrabold text-blue-600 mt-1">
                        {formatRupiah(a.harga)}
                      </div>
                    </div>

                    {/* Stepper Kuantitas */}
                    <div className="shrink-0">
                      {isSoldOut ? (
                        <span className="text-xs font-medium text-slate-400 px-3 py-1.5 rounded-lg bg-slate-100 block">
                          Habis
                        </span>
                      ) : qty > 0 ? (
                        <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(a.id, -1, a.stok)}
                            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold text-base"
                            aria-label={`Kurangi 1 ${a.nama_item}`}
                          >
                            -
                          </button>
                          <span className="w-9 text-center text-sm font-bold text-slate-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={isMax}
                            onClick={() => handleUpdateQty(a.id, 1, a.stok)}
                            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Tambah 1 ${a.nama_item}`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(a.id, 1, a.stok)}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors shadow-xs"
                        >
                          + Tambah
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 block">
              Total Sementara:
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">
              {formatRupiah(grandSubtotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkipAddons}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors"
            >
              Lewati
            </button>
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>Lanjut ke Checkout</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
