/**
 * ============================================================================
 * MODUL          : Antarmuka Kasir PoS Desktop 3 Kolom (src/app/pos/page.js)
 * REFERENSI      : DPPL-01 Bab 2.3 POS-01 / SKPL KF-01, KF-02, KF-10, KF-11
 * PENGEMBANG     : Keishin Naufa Alfaridzhi - 103112400061 (Lead UI/UX & Frontend)
 * DESKRIPSI      : Layar terminal kasir PoS offline berbasis 3-kolom desktop:
 *                  Katalog Tiket & Add-on (Kolom 1), Keranjang Belanja & Validasi
 *                  Promo (Kolom 2), Pembayaran CASH/QRIS & Kalkulasi Kembalian
 *                  Otomatis (Kolom 3), serta Modal Konfirmasi Pembayaran Sukses.
 * ============================================================================
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';

// Format angka ke format mata uang Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number || 0);
}

export default function PosPage() {
  // State data katalog
  const [tickets, setTickets] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'TICKET' | 'ADDON'

  // State Keranjang Belanja
  // Item format: { id, type: 'ticket' | 'addon', name, price, qty, maxStock }
  const [cart, setCart] = useState([]);

  // State Promo
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [activePromo, setActivePromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // State Pembayaran
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'QRIS'
  const [cashReceived, setCashReceived] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // State Modal Sukses
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [showThermalTooltip, setShowThermalTooltip] = useState(false);

  // Ref input pencarian untuk shortcut keyboard [F2]
  const searchInputRef = useRef(null);

  // Ambil data tiket & add-on dari REST API
  const fetchCatalogData = async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      const [ticketsRes, addonsRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/addons'),
      ]);

      const ticketsJson = await ticketsRes.json();
      const addonsJson = await addonsRes.json();

      if (ticketsJson.success && Array.isArray(ticketsJson.data)) {
        setTickets(ticketsJson.data);
      } else {
        throw new Error(ticketsJson.message || 'Gagal memuat katalog tiket.');
      }

      if (addonsJson.success && Array.isArray(addonsJson.data)) {
        setAddons(addonsJson.data);
      } else {
        throw new Error(addonsJson.message || 'Gagal memuat katalog add-on.');
      }
    } catch (err) {
      console.error('Galat saat mengambil data katalog PoS:', err);
      setLoadError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function initCatalog() {
      try {
        const [ticketsRes, addonsRes] = await Promise.all([
          fetch('/api/tickets'),
          fetch('/api/addons'),
        ]);

        const ticketsJson = await ticketsRes.json();
        const addonsJson = await addonsRes.json();

        if (!ignore) {
          if (ticketsJson.success && Array.isArray(ticketsJson.data)) {
            setTickets(ticketsJson.data);
          }
          if (addonsJson.success && Array.isArray(addonsJson.data)) {
            setAddons(addonsJson.data);
          }
          setLoadingData(false);
        }
      } catch (err) {
        if (!ignore) {
          setLoadError(err.message || 'Gagal terhubung ke server.');
          setLoadingData(false);
        }
      }
    }

    initCatalog();
    return () => {
      ignore = true;
    };
  }, []);

  // Shortcut Keyboard Listener ([F2] Cari, [Esc] Tutup Modal)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (showSuccessModal) {
          setShowSuccessModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuccessModal]);

  // Gabungkan dan filter katalog
  const filteredCatalog = useMemo(() => {
    const list = [];

    if (activeTab === 'ALL' || activeTab === 'TICKET') {
      tickets.forEach((t) => {
        list.push({
          id: t.id,
          type: 'ticket',
          name: `Tiket ${t.tier}`,
          category: 'Tiket Panggung',
          price: Number(t.harga),
          stock: Number(t.sisa_kuota),
        });
      });
    }

    if (activeTab === 'ALL' || activeTab === 'ADDON') {
      addons.forEach((a) => {
        list.push({
          id: a.id,
          type: 'addon',
          name: a.nama_item,
          category: 'Snack & Merchandise',
          price: Number(a.harga),
          stock: Number(a.stok),
        });
      });
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [tickets, addons, activeTab, searchQuery]);

  // Kalkulasi Keranjang Belanja
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!activePromo) return 0;
    return Math.min(subtotal, Number(activePromo.nominal_potongan) || 0);
  }, [subtotal, activePromo]);

  const totalBayar = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Kalkulasi Kembalian Tunai
  const numericCash = Number(cashReceived) || 0;
  const changeAmount = numericCash - totalBayar;
  const isCashSufficient = numericCash >= totalBayar && totalBayar > 0;

  // Operasi Keranjang
  const handleAddToCart = (catalogItem) => {
    if (catalogItem.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find(
        (i) => i.id === catalogItem.id && i.type === catalogItem.type
      );
      if (existing) {
        if (existing.qty >= catalogItem.stock) return prevCart; // Batas stok
        return prevCart.map((i) =>
          i.id === catalogItem.id && i.type === catalogItem.type
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [
        ...prevCart,
        {
          id: catalogItem.id,
          type: catalogItem.type,
          name: catalogItem.name,
          price: catalogItem.price,
          qty: 1,
          maxStock: catalogItem.stock,
        },
      ];
    });
  };

  const handleUpdateQty = (item, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((i) => {
          if (i.id === item.id && i.type === item.type) {
            const nextQty = i.qty + delta;
            if (nextQty <= 0) return null;
            if (nextQty > i.maxStock) return i; // Melebihi kuota
            return { ...i, qty: nextQty };
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveItem = (item) => {
    setCart((prevCart) =>
      prevCart.filter((i) => !(i.id === item.id && i.type === item.type))
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setActivePromo(null);
    setPromoCodeInput('');
    setPromoError('');
    setCashReceived('');
    setPaymentError('');
  };

  // Validasi Voucher Promo
  const handleValidatePromo = async (e) => {
    e?.preventDefault();
    if (!promoCodeInput.trim()) {
      setPromoError('Masukkan kode promo terlebih dahulu.');
      return;
    }
    if (subtotal <= 0) {
      setPromoError('Keranjang belanja masih kosong.');
      return;
    }

    setValidatingPromo(true);
    setPromoError('');

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: promoCodeInput.trim(),
          subtotal,
        }),
      });
      const data = await res.json();

      if (data.valid && data.promo) {
        setActivePromo(data.promo);
        setPromoError('');
      } else {
        setActivePromo(null);
        setPromoError(data.message || 'Kode promo tidak valid atau kadaluarsa.');
      }
    } catch (err) {
      console.error('Galat validasi promo:', err);
      setPromoError('Gagal memvalidasi kode promo.');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setActivePromo(null);
    setPromoCodeInput('');
    setPromoError('');
  };

  // Proses Transaksi PoS
  const handleProcessPayment = async () => {
    if (cart.length === 0) {
      setPaymentError('Keranjang belanja masih kosong.');
      return;
    }

    if (paymentMethod === 'CASH' && !isCashSufficient) {
      setPaymentError('Nominal uang tunai yang diterima kurang.');
      return;
    }

    setProcessingPayment(true);
    setPaymentError('');

    try {
      const payload = {
        items: cart.map((i) => ({
          type: i.type,
          id: i.id,
          qty: i.qty,
          price: i.price,
        })),
        promoCode: activePromo ? activePromo.kode_promo : undefined,
        metode_pembayaran: paymentMethod,
        cashAmount: paymentMethod === 'CASH' ? numericCash : totalBayar,
        customerData: {
          nama_pemesan: 'Customer Kasir PoS',
          email_pemesan: 'kasir@standupcomedy.id',
          no_telp_pemesan: '081234567890',
          id_pengguna: 2, // ID Kasir
        },
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Berhasil diproses
        setSuccessReceipt({
          noInvoice: result.data.noInvoice,
          totalBayar: result.data.totalBayar,
          change: result.data.change || 0,
          cashReceived: paymentMethod === 'CASH' ? numericCash : totalBayar,
          paymentMethod,
          tickets: result.data.tickets || [],
          items: cart,
          waktu: new Date().toLocaleString('id-ID'),
        });
        setShowSuccessModal(true);

        // Perbarui data katalog sisa kuota secara riil
        fetchCatalogData();
      } else {
        setPaymentError(
          result.message || 'Terjadi kesalahan saat memproses transaksi.'
        );
      }
    } catch (err) {
      console.error('Galat transaksi kasir:', err);
      setPaymentError('Gagal mengirim data transaksi ke server.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Reset setelah transaksi baru
  const handleNewTransaction = () => {
    setShowSuccessModal(false);
    setSuccessReceipt(null);
    handleClearCart();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar Kasir */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            title="Kembali ke Beranda"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M7 8v8M17 8v8M12 11v2" />
              </svg>
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Tiket<span className="text-blue-600">.</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Terminal PoS 01</span>
            <span className="sr-only">Online &bull; Terminal 01</span>
          </div>
          <span className="text-slate-400 hidden sm:inline">24 Okt 2026 &middot; 10.24 WIB</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              KS
            </div>
            <span className="font-semibold text-slate-800 hidden sm:inline">Kasir 01</span>
          </div>
          <Link
            href="/gate"
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
          >
            Gate &rarr;
          </Link>
        </div>
      </header>

      {/* Subheader Title & Printer Status */}
      <div className="max-w-[1700px] w-full mx-auto px-3 sm:px-5 pt-4 pb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transaksi kasir <span className="sr-only">Kasir PoS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stand Up Comedy Night &middot; Gedung Serbaguna, Purwokerto
          </p>
        </div>
        <div>
          <span className="px-3 py-1 rounded-md bg-[#DCFCE7] text-[#166534] border border-green-200 text-xs font-semibold">
            Printer terhubung
          </span>
        </div>
      </div>

      {/* Main 3-Column Desktop Grid Layout */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ============================================================ */}
        {/* KOLOM 1: KATALOG PRODUK & ADD-ON (lg:col-span-5) */}
        {/* ============================================================ */}
        <section
          aria-label="Katalog Produk"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-full"
        >
          {/* Header & Tab Filter */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Katalog Produk</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredCatalog.length} item)
                </span>
              </h2>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                [F2] Cari
              </span>
            </div>

            {/* Input Pencarian */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tiket atau add-on... [F2]"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('TICKET')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'TICKET'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tiket
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ADDON')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'ADDON'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Add-on
              </button>
            </div>
          </div>

          {/* List Katalog Scrollable */}
          <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2.5 max-h-[600px] lg:max-h-[calc(100vh-220px)]">
            {loadingData ? (
              <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p>Memuat katalog produk...</p>
              </div>
            ) : loadError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <p className="font-semibold mb-1">Gagal memuat katalog:</p>
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={fetchCatalogData}
                  className="mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700"
                >
                  Coba Lagi
                </button>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                <p>Tidak ada produk yang cocok dengan pencarian.</p>
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const isSoldOut = item.stock <= 0;
                const inCartItem = cart.find(
                  (c) => c.id === item.id && c.type === item.type
                );
                const cartQty = inCartItem ? inCartItem.qty : 0;
                const isMax = cartQty >= item.stock;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSoldOut
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : cartQty > 0
                        ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.type === 'ticket'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.type === 'ticket' ? 'TIKET' : 'ADD-ON'}
                        </span>
                        {isSoldOut ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                            Habis
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Sisa {item.stock}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    {/* Stepper atau Tombol Tambah */}
                    <div>
                      {isSoldOut ? (
                        <span className="text-xs font-medium text-slate-400 px-3 py-1.5 rounded-lg bg-slate-100 block">
                          Sold Out
                        </span>
                      ) : cartQty > 0 ? (
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(inCartItem, -1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 font-bold text-xs"
                            aria-label={`Kurangi ${item.name}`}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {cartQty}
                          </span>
                          <button
                            type="button"
                            disabled={isMax}
                            onClick={() => handleUpdateQty(inCartItem, 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Tambah ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors shadow-xs"
                        >
                          + Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* KOLOM 2: KERANJANG BELANJA & PROMO (lg:col-span-4) */}
        {/* ============================================================ */}
        <section
          aria-label="Keranjang Belanja"
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-full"
        >
          {/* Header Keranjang */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Keranjang Belanja
              </h2>
              <p className="text-xs text-slate-500">
                {cart.reduce((n, i) => n + i.qty, 0)} item terpilih
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Itemized List Keranjang */}
          <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2.5 max-h-[340px] lg:max-h-[calc(100vh-420px)]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <svg
                  className="w-12 h-12 text-slate-300 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-xs sm:text-sm font-medium">Keranjang masih kosong</p>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih tiket atau add-on dari katalog di sebelah kiri.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`cart-${item.type}-${item.id}`}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {formatRupiah(item.price)} x {item.qty}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                        aria-label="Kurangi 1"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        disabled={item.qty >= item.maxStock}
                        onClick={() => handleUpdateQty(item, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold disabled:opacity-30"
                        aria-label="Tambah 1"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold text-slate-900 min-w-[70px] text-right">
                      {formatRupiah(item.price * item.qty)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                      title="Hapus item"
                      aria-label={`Hapus ${item.name}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Section Voucher Promo */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Kode Voucher Promo
            </span>

            {activePromo ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-emerald-800">
                      {activePromo.kode_promo}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
                      Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Potongan {formatRupiah(activePromo.nominal_potongan)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <form onSubmit={handleValidatePromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: KETAWA10"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={validatingPromo || !promoCodeInput.trim() || cart.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors shadow-xs"
                >
                  {validatingPromo ? 'Cek...' : 'Terapkan'}
                </button>
              </form>
            )}

            {promoError && (
              <p className="text-xs text-rose-600 font-medium">{promoError}</p>
            )}
          </div>

          {/* Rincian Kalkulasi Harga */}
          <div className="pt-3 border-t border-slate-100 mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Item</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Diskon Promo ({activePromo?.kode_promo})</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Tagihan</span>
              <span className="text-blue-600">{formatRupiah(totalBayar)}</span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* KOLOM 3: PEMBAYARAN & EKSEKUSI (lg:col-span-3) */}
        {/* ============================================================ */}
        <section
          aria-label="Panel Pembayaran"
          className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full"
        >
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Metode Pembayaran
              </h2>
              <p className="text-xs text-slate-500">
                Pilih metode pembayaran kasir
              </p>
            </div>

            {/* Tab Metode Pembayaran */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                aria-label="CASH (Tunai)"
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tunai
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                aria-label="QRIS Dinamis"
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  paymentMethod === 'QRIS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                QRIS
              </button>
            </div>

            {/* Panel Khusus CASH: Input Uang Tunai & Shortcut */}
            {paymentMethod === 'CASH' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Contoh: 100000"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Preset Shortcut Nominal Cepat */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Nominal Cepat:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashReceived(String(totalBayar))}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors text-center"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived('50000')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors text-center"
                    >
                      50.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived('100000')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors text-center"
                    >
                      100.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived('200000')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors text-center"
                    >
                      200.000
                    </button>
                  </div>
                </div>

                {/* Indikator Kembalian Real-time */}
                {totalBayar > 0 && numericCash > 0 && (
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      isCashSufficient
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {isCashSufficient ? 'Uang Kembalian:' : 'Uang Kurang:'}
                    </div>
                    <div className="text-xl font-extrabold mt-0.5">
                      {isCashSufficient
                        ? formatRupiah(changeAmount)
                        : formatRupiah(Math.abs(changeAmount))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Panel Khusus QRIS */
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                  {/* SVG Simulasi QRIS */}
                  <svg
                    className="w-full h-full text-slate-900"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                  >
                    <rect x="5" y="5" width="25" height="25" fill="#0F172A" />
                    <rect x="10" y="10" width="15" height="15" fill="#FFFFFF" />
                    <rect x="13" y="13" width="9" height="9" fill="#0F172A" />

                    <rect x="70" y="5" width="25" height="25" fill="#0F172A" />
                    <rect x="75" y="10" width="15" height="15" fill="#FFFFFF" />
                    <rect x="78" y="13" width="9" height="9" fill="#0F172A" />

                    <rect x="5" y="70" width="25" height="25" fill="#0F172A" />
                    <rect x="10" y="75" width="15" height="15" fill="#FFFFFF" />
                    <rect x="13" y="78" width="9" height="9" fill="#0F172A" />

                    <rect x="40" y="10" width="10" height="10" fill="#0F172A" />
                    <rect x="40" y="30" width="20" height="10" fill="#0F172A" />
                    <rect x="10" y="40" width="15" height="10" fill="#0F172A" />
                    <rect x="35" y="50" width="30" height="15" fill="#0F172A" />
                    <rect x="75" y="40" width="15" height="15" fill="#0F172A" />
                    <rect x="45" y="75" width="20" height="15" fill="#0F172A" />
                    <rect x="75" y="75" width="15" height="15" fill="#0F172A" />
                  </svg>
                </div>
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-900">QRIS Kasir Stand-Up</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scan via GoPay, OVO, BCA, Dana, atau LinkAja
                  </p>
                </div>
              </div>
            )}

            {paymentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {paymentError}
              </div>
            )}
          </div>

          {/* Tombol Eksekusi Bayar */}
          <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
            <button
              type="button"
              disabled={
                processingPayment ||
                cart.length === 0 ||
                (paymentMethod === 'CASH' && !isCashSufficient)
              }
              onClick={handleProcessPayment}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-extrabold rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Transaksi...</span>
                </>
              ) : (
                <>
                  <span>Bayar Transaksi</span>
                  <span>&bull;</span>
                  <span>{formatRupiah(totalBayar)}</span>
                </>
              )}
            </button>

            {/* Legend Pintas Keyboard */}
            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-2 pt-1">
              <span>[F2] Cari Katalog</span>
              <span>&bull;</span>
              <span>[Esc] Tutup Modal</span>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================ */}
      {/* MODAL KONFIRMASI PEMBAYARAN SUKSES (STRUK & E-TIKET) */}
      {/* ============================================================ */}
      {showSuccessModal && successReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            {/* Header Modal */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Pembayaran Berhasil!
              </h3>
              <p className="text-xs text-slate-500">
                Transaksi kasir telah tercatat dan tersimpan di sistem.
              </p>
            </div>

            {/* Rincian Struk */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200 font-sans">
                <span className="text-slate-500">No. Invoice</span>
                <span className="font-bold text-slate-900">
                  {successReceipt.noInvoice}
                </span>
              </div>
              <div className="flex justify-between font-sans text-slate-600">
                <span>Waktu</span>
                <span>{successReceipt.waktu}</span>
              </div>
              <div className="flex justify-between font-sans text-slate-600">
                <span>Metode</span>
                <span className="font-semibold">{successReceipt.paymentMethod}</span>
              </div>

              {/* Items List */}
              <div className="py-2 border-y border-dashed border-slate-300 space-y-1">
                {successReceipt.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-slate-800">
                    <span className="truncate max-w-[200px]">
                      {i.name} x{i.qty}
                    </span>
                    <span>{formatRupiah(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 font-sans">
                <span>Total Bayar</span>
                <span className="text-blue-600">
                  {formatRupiah(successReceipt.totalBayar)}
                </span>
              </div>

              {successReceipt.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between font-sans text-slate-600">
                    <span>Uang Diterima</span>
                    <span>{formatRupiah(successReceipt.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-sans text-emerald-700 font-bold">
                    <span>Kembalian</span>
                    <span>{formatRupiah(successReceipt.change)}</span>
                  </div>
                </>
              )}

              {/* Tiket Terbit */}
              {successReceipt.tickets.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-sans text-[11px] font-bold text-slate-700 block mb-1">
                    Kode Tiket Diterbitkan:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {successReceipt.tickets.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold"
                      >
                        {t.kode_tiket}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Aksi */}
            <div className="space-y-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowThermalTooltip(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Cetak Struk Thermal (ESC/POS)</span>
                </button>

                {showThermalTooltip && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg whitespace-nowrap z-20 border border-slate-700">
                    Fitur Cetak Struk dialokasikan untuk Fase 4 (Dimas Ramadhani)
                    <button
                      type="button"
                      onClick={() => setShowThermalTooltip(false)}
                      className="ml-2 text-slate-400 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleNewTransaction}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Transaksi Baru
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
