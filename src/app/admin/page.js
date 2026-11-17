/**
 * ============================================================================
 * MODUL          : AdminDashboardView (src/app/admin/page.js)
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL KF-07, KF-08, KF-09, KF-10, KF-13
 * PENGEMBANG     : Abisar Fathir - 103112400068 (Admin Dashboard UI)
 * DESKRIPSI      : Antarmuka Dasbor Admin terpadu dengan 4 tab navigasi
 *                  (Master Event & Kuota, Katalog Add-on, Voucher Promo,
 *                  dan Laporan Penjualan) untuk tata kelola tiket komedi.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// Tanggal acuan pelaksanaan event untuk pembandingan masa berlaku promo
const CURRENT_EVENT_DATE = '2026-10-24';

// Format angka ke format mata uang Rupiah
function formatRupiah(angka) {
  const number = Number(angka) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

// Format string tanggal secara deterministik tanpa new Date() langsung pada render
function formatTanggal(strTanggal) {
  if (!strTanggal) return '-';
  try {
    const parts = String(strTanggal).split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (mIdx >= 0 && mIdx < 12 && !isNaN(day)) {
        return `${day} ${monthNames[mIdx]} ${year}`;
      }
    }
    return String(strTanggal);
  } catch {
    return String(strTanggal);
  }
}

export default function AdminDashboardPage() {
  // --- STATE UTAMA NAVIGASI TAB ---
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'addons' | 'promos' | 'reports'

  // --- STATE NOTIFIKASI FEEDBACK ---
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // --- STATE DATA TIKET & EVENT (TAB 1) ---
  const [tickets, setTickets] = useState([
    { id: 1, tier: 'Early Bird', harga: 50000, sisa_kuota: 0, total_kuota: 50 },
    { id: 2, tier: 'Batch 1', harga: 75000, sisa_kuota: 120, total_kuota: 150 },
    { id: 3, tier: 'Batch 2', harga: 100000, sisa_kuota: 80, total_kuota: 100 },
    { id: 4, tier: 'VIP', harga: 150000, sisa_kuota: 25, total_kuota: 50 },
    { id: 5, tier: 'VVIP (Meet & Greet)', harga: 250000, sisa_kuota: 10, total_kuota: 20 },
  ]);
  const [selectedTicketId, setSelectedTicketId] = useState(2);
  const [editTicketQuota, setEditTicketQuota] = useState(120);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // State untuk form panel "Ubah acara & tiket" (Sisi Kanan)
  const [eventDetails, setEventDetails] = useState({
    namaAcara: 'Stand Up Comedy Night',
    tanggalAcaraDisplay: '24/10/2026',
    jamMulai: '16:00',
    lokasi: 'Purwokerto',
    isEventActive: true,
  });

  // --- STATE DATA ADD-ON (TAB 2) ---
  const [addons, setAddons] = useState([
    { id: 1, nama_item: 'Paket Snack (Popcorn + Cola)', harga: 15000, stok: 100 },
    { id: 2, nama_item: 'Popcorn Caramel Large', harga: 20000, stok: 75 },
    { id: 3, nama_item: 'Es Kopi Susu Komika', harga: 18000, stok: 60 },
    { id: 4, nama_item: 'Air Mineral 600ml', harga: 5000, stok: 150 },
    { id: 5, nama_item: 'Official Stiker Pack Stand-Up', harga: 12000, stok: 50 },
  ]);
  const [addonSearch, setAddonSearch] = useState('');
  const [addonFilter, setAddonFilter] = useState('semua'); // 'semua' | 'tersedia' | 'habis'
  const [newAddon, setNewAddon] = useState({ nama_item: '', harga: '', stok: '' });
  const [isSubmittingAddon, setIsSubmittingAddon] = useState(false);

  // --- STATE DATA PROMO (TAB 3) ---
  const [promos, setPromos] = useState([
    { kode_promo: 'KETAWA10', nominal_potongan: 10000, kuota_promo: 62, total_kuota: 100, tanggal_kadaluarsa: '2026-10-24' },
    { kode_promo: 'ROAST20', nominal_potongan: 20000, kuota_promo: 38, total_kuota: 100, tanggal_kadaluarsa: '2026-10-24' },
    { kode_promo: 'OPENING10', nominal_potongan: 10000, kuota_promo: 0, total_kuota: 50, tanggal_kadaluarsa: '2026-10-20' },
    { kode_promo: 'KOMIKA25', nominal_potongan: 25000, kuota_promo: 25, total_kuota: 50, tanggal_kadaluarsa: '2026-11-15' },
    { kode_promo: 'MAHASISWA15', nominal_potongan: 15000, kuota_promo: 50, total_kuota: 100, tanggal_kadaluarsa: '2026-11-01' },
  ]);
  const [selectedPromoCode, setSelectedPromoCode] = useState('KETAWA10');
  const [promoFilter, setPromoFilter] = useState('semua'); // 'semua' | 'aktif' | 'habis'
  const [newPromo, setNewPromo] = useState({
    kode_promo: '',
    nominal_potongan: '',
    kuota_promo: '',
    tanggal_kadaluarsa: '2026-12-31',
  });
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);

  // --- STATE DATA LAPORAN PENJUALAN (TAB 4) ---
  const [reportSummary, setReportSummary] = useState({
    totalRevenue: 7080000,
    totalTicketsSold: 70,
    totalTransactions: 42,
    addonRevenue: 450000,
    dailyRevenue: [
      { tanggal: '2026-10-18', omzet: 850000, jumlah_transaksi: 5 },
      { tanggal: '2026-10-19', omzet: 600000, jumlah_transaksi: 4 },
      { tanggal: '2026-10-20', omzet: 950000, jumlah_transaksi: 6 },
      { tanggal: '2026-10-21', omzet: 1100000, jumlah_transaksi: 7 },
      { tanggal: '2026-10-22', omzet: 800000, jumlah_transaksi: 5 },
      { tanggal: '2026-10-23', omzet: 1200000, jumlah_transaksi: 7 },
      { tanggal: '2026-10-24', omzet: 1580000, jumlah_transaksi: 8 },
    ],
  });
  const [recentTransactions, setRecentTransactions] = useState([
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
    {
      no_invoice: 'TRX-20261024-040',
      waktu_transaksi: '2026-10-24 17:15:00',
      nama_pemesan: 'Dimas Wicaksono',
      metode_pembayaran: 'QRIS',
      status_transaksi: 'PAID',
      total_bayar: 220000,
    },
    {
      no_invoice: 'TRX-20261024-039',
      waktu_transaksi: '2026-10-24 16:30:00',
      nama_pemesan: 'Ahmad Fauzi',
      metode_pembayaran: 'CASH',
      status_transaksi: 'PAID',
      total_bayar: 85000,
    },
    {
      no_invoice: 'TRX-20261024-038',
      waktu_transaksi: '2026-10-24 15:10:00',
      nama_pemesan: 'Rina Kartika',
      metode_pembayaran: 'QRIS',
      status_transaksi: 'PAID',
      total_bayar: 300000,
    },
  ]);
  const [reportMethodFilter, setReportMethodFilter] = useState('semua');

  // --- STATE INDIKATOR LOADING ---
  const [isLoading, setIsLoading] = useState(false);

  // --- AUTO DISMISS NOTIFIKASI FEEDBACK ---
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // --- FETCH DATA SAAT KOMPONEN DIMUAT ---
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        // 1. Ambil daftar tiket
        const resTickets = await fetch('/api/tickets');
        if (resTickets.ok) {
          const json = await resTickets.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setTickets((prev) =>
              json.data.map((item) => {
                const existing = prev.find((p) => p.id === item.id);
                return {
                  ...item,
                  total_kuota: existing?.total_kuota || (Number(item.sisa_kuota) + 30),
                };
              })
            );
          }
        }

        // 2. Ambil daftar add-on
        const resAddons = await fetch('/api/addons');
        if (resAddons.ok) {
          const json = await resAddons.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setAddons(json.data);
          }
        }

        // 3. Ambil daftar promo
        const resPromos = await fetch('/api/promos');
        if (resPromos.ok) {
          const json = await resPromos.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setPromos((prev) =>
              json.data.map((item) => {
                const existing = prev.find((p) => p.kode_promo === item.kode_promo);
                return {
                  ...item,
                  total_kuota: existing?.total_kuota || 100,
                };
              })
            );
          }
        }

        // 4. Ambil ringkasan laporan
        const resSummary = await fetch('/api/reports/summary');
        if (resSummary.ok) {
          const json = await resSummary.json();
          if (json.success && json.data) {
            setReportSummary((prev) => ({
              ...prev,
              ...json.data,
              totalRevenue: json.data.totalRevenue || prev.totalRevenue,
              totalTicketsSold: json.data.totalTicketsSold || prev.totalTicketsSold,
              totalTransactions: json.data.totalTransactions || prev.totalTransactions,
              dailyRevenue:
                Array.isArray(json.data.dailyRevenue) && json.data.dailyRevenue.length > 0
                  ? json.data.dailyRevenue
                  : prev.dailyRevenue,
            }));
          }
        }

        // 5. Ambil riwayat transaksi
        const resTrx = await fetch('/api/transactions');
        if (resTrx.ok) {
          const json = await resTrx.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setRecentTransactions(json.data.slice(0, 10));
          }
        }
      } catch (err) {
        console.warn('Gagal memuat beberapa data API awal (menggunakan fallback seeded):', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Sinkronisasi pilihan tier tiket dengan input kuota pada form
  function handleSelectTicketTier(tierId) {
    const idNum = Number(tierId);
    setSelectedTicketId(idNum);
    const currentTicket = tickets.find((t) => t.id === idNum);
    if (currentTicket) {
      setEditTicketQuota(currentTicket.sisa_kuota);
    }
  }

  // --- HANDLER TAB 1: UBAH KUOTA TIKET ---
  async function handleUpdateTicketQuota(e) {
    e.preventDefault();
    const quotaNumber = Number(editTicketQuota);
    if (isNaN(quotaNumber) || quotaNumber < 0) {
      setFeedback({ type: 'error', message: 'Sisa kuota tiket tidak boleh bernilai negatif.' });
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: Number(selectedTicketId),
          sisa_kuota: quotaNumber,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === Number(selectedTicketId)
              ? { ...t, sisa_kuota: quotaNumber }
              : t
          )
        );
        const updatedTier = tickets.find((t) => t.id === Number(selectedTicketId));
        setFeedback({
          type: 'success',
          message: `Berhasil memperbarui kuota tiket ${updatedTier?.tier || ''} menjadi ${quotaNumber}.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: json.message || 'Gagal memperbarui kuota tiket.',
        });
      }
    } catch (err) {
      // Fallback update jika koneksi putus
      setTickets((prev) =>
        prev.map((t) =>
          t.id === Number(selectedTicketId) ? { ...t, sisa_kuota: quotaNumber } : t
        )
      );
      setFeedback({
        type: 'success',
        message: `Kuota tiket berhasil diperbarui menjadi ${quotaNumber} (offline mode).`,
      });
    } finally {
      setIsSubmittingTicket(false);
    }
  }

  // --- HANDLER TAB 2: TAMBAH PRODUK ADD-ON ---
  async function handleAddAddon(e) {
    e.preventDefault();
    if (!newAddon.nama_item.trim()) {
      setFeedback({ type: 'error', message: 'Nama item produk add-on wajib diisi.' });
      return;
    }
    const hargaNum = Number(newAddon.harga);
    const stokNum = Number(newAddon.stok);
    if (isNaN(hargaNum) || hargaNum < 0) {
      setFeedback({ type: 'error', message: 'Harga produk tidak boleh kosong atau negatif.' });
      return;
    }
    if (isNaN(stokNum) || stokNum < 0) {
      setFeedback({ type: 'error', message: 'Stok produk tidak boleh kosong atau negatif.' });
      return;
    }

    setIsSubmittingAddon(true);
    try {
      const res = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_item: newAddon.nama_item.trim(),
          harga: hargaNum,
          stok: stokNum,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const itemCreated = json.data || {
          id: Date.now(),
          nama_item: newAddon.nama_item.trim(),
          harga: hargaNum,
          stok: stokNum,
        };
        setAddons((prev) => [...prev, itemCreated]);
        setNewAddon({ nama_item: '', harga: '', stok: '' });
        setFeedback({
          type: 'success',
          message: `Produk "${itemCreated.nama_item}" berhasil ditambahkan ke katalog.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: json.message || 'Gagal menambahkan produk add-on.',
        });
      }
    } catch (err) {
      const fallbackItem = {
        id: Date.now(),
        nama_item: newAddon.nama_item.trim(),
        harga: hargaNum,
        stok: stokNum,
      };
      setAddons((prev) => [...prev, fallbackItem]);
      setNewAddon({ nama_item: '', harga: '', stok: '' });
      setFeedback({
        type: 'success',
        message: `Produk "${fallbackItem.nama_item}" berhasil ditambahkan (offline mode).`,
      });
    } finally {
      setIsSubmittingAddon(false);
    }
  }

  // --- HANDLER TAB 3: TAMBAH VOUCHER PROMO ---
  async function handleAddPromo(e) {
    e.preventDefault();
    if (!newPromo.kode_promo.trim()) {
      setFeedback({ type: 'error', message: 'Kode voucher promo wajib diisi.' });
      return;
    }
    const potonganNum = Number(newPromo.nominal_potongan);
    const kuotaNum = Number(newPromo.kuota_promo);
    if (isNaN(potonganNum) || potonganNum < 0) {
      setFeedback({ type: 'error', message: 'Nominal potongan tidak boleh bernilai negatif.' });
      return;
    }
    if (isNaN(kuotaNum) || kuotaNum <= 0) {
      setFeedback({ type: 'error', message: 'Kuota promo harus lebih dari 0.' });
      return;
    }

    setIsSubmittingPromo(true);
    const cleanKode = newPromo.kode_promo.trim().toUpperCase();
    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode_promo: cleanKode,
          nominal_potongan: potonganNum,
          kuota_promo: kuotaNum,
          tanggal_kadaluarsa: newPromo.tanggal_kadaluarsa,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const itemCreated = json.data || {
          kode_promo: cleanKode,
          nominal_potongan: potonganNum,
          kuota_promo: kuotaNum,
          total_kuota: kuotaNum,
          tanggal_kadaluarsa: newPromo.tanggal_kadaluarsa,
        };
        setPromos((prev) => [
          ...prev.filter((p) => p.kode_promo !== cleanKode),
          { ...itemCreated, total_kuota: kuotaNum },
        ]);
        setSelectedPromoCode(cleanKode);
        setNewPromo({
          kode_promo: '',
          nominal_potongan: '',
          kuota_promo: '',
          tanggal_kadaluarsa: '2026-12-31',
        });
        setFeedback({
          type: 'success',
          message: `Kode promo "${cleanKode}" berhasil dibuat.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: json.message || 'Gagal menambahkan voucher promo.',
        });
      }
    } catch (err) {
      const fallbackPromo = {
        kode_promo: cleanKode,
        nominal_potongan: potonganNum,
        kuota_promo: kuotaNum,
        total_kuota: kuotaNum,
        tanggal_kadaluarsa: newPromo.tanggal_kadaluarsa,
      };
      setPromos((prev) => [
        ...prev.filter((p) => p.kode_promo !== cleanKode),
        fallbackPromo,
      ]);
      setSelectedPromoCode(cleanKode);
      setNewPromo({
        kode_promo: '',
        nominal_potongan: '',
        kuota_promo: '',
        tanggal_kadaluarsa: '2026-12-31',
      });
      setFeedback({
        type: 'success',
        message: `Kode promo "${cleanKode}" berhasil dibuat (offline mode).`,
      });
    } finally {
      setIsSubmittingPromo(false);
    }
  }

  // --- FILTERED ADDONS (TAB 2) ---
  const filteredAddons = useMemo(() => {
    return addons.filter((item) => {
      const matchSearch = item.nama_item.toLowerCase().includes(addonSearch.toLowerCase());
      if (!matchSearch) return false;
      if (addonFilter === 'tersedia') return Number(item.stok) > 0;
      if (addonFilter === 'habis') return Number(item.stok) <= 0;
      return true;
    });
  }, [addons, addonSearch, addonFilter]);

  // --- FILTERED PROMOS (TAB 3) ---
  const filteredPromos = useMemo(() => {
    return promos.filter((promo) => {
      const expDate = promo.tanggal_kadaluarsa ? String(promo.tanggal_kadaluarsa).split('T')[0] : '';
      const isExpired = expDate ? expDate < CURRENT_EVENT_DATE : false;
      const isOutOfQuota = Number(promo.kuota_promo) <= 0;
      const isActive = !isExpired && !isOutOfQuota;

      if (promoFilter === 'aktif') return isActive;
      if (promoFilter === 'habis') return isExpired || isOutOfQuota;
      return true;
    });
  }, [promos, promoFilter]);

  // Promo terpilih untuk rincian kuota bawah
  const currentPromo = useMemo(() => {
    return promos.find((p) => p.kode_promo === selectedPromoCode) || promos[0] || null;
  }, [promos, selectedPromoCode]);

  // --- FILTERED TRANSACTIONS (TAB 4) ---
  const filteredTransactions = useMemo(() => {
    if (reportMethodFilter === 'semua') return recentTransactions;
    return recentTransactions.filter(
      (trx) => trx.metode_pembayaran?.toUpperCase() === reportMethodFilter.toUpperCase()
    );
  }, [recentTransactions, reportMethodFilter]);

  // Perhitungan ringkasan kuota tiket (Tab 1)
  const totalQuotaAll = useMemo(() => {
    return tickets.reduce((acc, t) => acc + (Number(t.total_kuota) || (Number(t.sisa_kuota) + 30)), 0);
  }, [tickets]);

  const totalRemainingQuota = useMemo(() => {
    return tickets.reduce((acc, t) => acc + Number(t.sisa_kuota || 0), 0);
  }, [tickets]);

  const totalSoldTickets = useMemo(() => {
    const diff = totalQuotaAll - totalRemainingQuota;
    return diff > 0 ? diff : reportSummary.totalTicketsSold || 0;
  }, [totalQuotaAll, totalRemainingQuota, reportSummary.totalTicketsSold]);

  // Maksimum omzet harian untuk penskalaan grafik batang (Tab 4)
  const maxDailyOmzet = useMemo(() => {
    if (!reportSummary.dailyRevenue || reportSummary.dailyRevenue.length === 0) return 1000000;
    const maxVal = Math.max(...reportSummary.dailyRevenue.map((d) => Number(d.omzet) || 0));
    return maxVal > 0 ? maxVal : 1000000;
  }, [reportSummary.dailyRevenue]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* ==================================================================== */}
      {/* SIDEBAR NAVIGASI DASBOR ADMIN (Sisi Kiri)                            */}
      {/* ==================================================================== */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Logo Brand Acara */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Tiket<span className="text-blue-600">.</span>
              </span>
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Admin
            </span>
          </div>

          {/* Navigasi Vertikal 4 Tab */}
          <nav className="p-4 space-y-1.5" aria-label="Menu Admin">
            {/* Tab 1: Master Event & Kuota */}
            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'events'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Master Event & Kuota</span>
            </button>

            {/* Tab 2: Katalog Add-on */}
            <button
              onClick={() => setActiveTab('addons')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'addons'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span>Katalog Add-on</span>
            </button>

            {/* Tab 3: Kode Promo */}
            <button
              onClick={() => setActiveTab('promos')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'promos'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <span>Kode Promo</span>
            </button>

            {/* Tab 4: Laporan Penjualan */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Laporan Penjualan</span>
            </button>
          </nav>

          {/* Quick links ke portal sistem lainnya */}
          <div className="px-4 py-3 border-t border-slate-100">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Pintas Navigasi
            </p>
            <div className="space-y-1">
              <Link
                href="/pos"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Kasir PoS Desktop</span>
              </Link>
              <Link
                href="/order"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Pemesanan Mandiri Online</span>
              </Link>
              <Link
                href="/gate"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Gate Scanner Check-in</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Profil Bawah & Keluar */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">Admin Acara</p>
                <p className="text-[11px] text-slate-500 truncate">Administrator</p>
              </div>
            </div>
            <Link
              href="/login"
              title="Keluar dari akun admin"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </Link>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* KONTEN UTAMA DASBOR (Sisi Kanan)                                     */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-10 shadow-2xs">
          <div>
            <nav className="flex items-center gap-2 text-xs text-slate-500 mb-1" aria-label="Breadcrumb">
              <span>Sistem Pemesanan Tiket</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">
                {activeTab === 'events' && 'Master Event & Kuota'}
                {activeTab === 'addons' && 'Katalog Add-on'}
                {activeTab === 'promos' && 'Voucher Promo'}
                {activeTab === 'reports' && 'Laporan Penjualan'}
              </span>
            </nav>
            <h1 className="text-xl font-bold text-slate-900">
              {activeTab === 'events' && 'Master Event & Kuota'}
              {activeTab === 'addons' && 'Katalog Produk Add-on'}
              {activeTab === 'promos' && 'Manajemen Voucher Promo'}
              {activeTab === 'reports' && 'Laporan & Analitik Penjualan'}
            </h1>
            {activeTab === 'events' && (
              <p className="text-xs text-slate-500 mt-0.5">
                Atur informasi acara, kategori tiket dan kapasitas penjualan.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'events' && (
              <button
                type="button"
                onClick={() => setFeedback({ type: 'success', message: 'Formulir tambah acara baru siap dikonfigurasi.' })}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 shadow-xs"
              >
                + Tambah acara
              </button>
            )}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>24 Oktober 2026</span>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Lihat Portal Beranda
            </Link>
          </div>
        </header>

        {/* FEEDBACK TOAST / BANNER ALERT */}
        {feedback.message && (
          <div className="px-6 pt-4">
            <div
              className={`p-4 rounded-xl flex items-center justify-between border ${
                feedback.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {feedback.type === 'error' ? (
                  <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback({ type: '', message: '' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 1: MASTER EVENT & KUOTA                                          */}
        {/* ==================================================================== */}
        {activeTab === 'events' && (
          <div className="p-6 space-y-6">
            {/* 3 Kartu Metrik Kuota */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Kuota
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{totalQuotaAll}</div>
                <p className="text-xs text-slate-500 mt-1">{tickets.length} kategori tiket</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tiket Terjual
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{totalSoldTickets}</div>
                <p className="text-xs text-slate-500 mt-1">Transaksi dibayar</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sisa Kuota
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{totalRemainingQuota}</div>
                <p className="text-xs text-slate-500 mt-1">Diperbarui setelah pembayaran</p>
              </div>
            </div>

            {/* Layout Master-Detail Split 65% : 35% */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Kolom Kiri: Detail Acara & Kategori Tiket dalam Satu Kartu Putih Bersih */}
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  {/* Header Acara */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        {eventDetails.namaAcara}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          24 Okt 2026 · {eventDetails.jamMulai} WIB
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {eventDetails.lokasi}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {eventDetails.isEventActive ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>

                  {/* Sub-bagian Tabel: Judul & Tombol Tambah Kategori */}
                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-slate-900">Kategori tiket & kuota</h3>
                      <button
                        type="button"
                        onClick={() => setFeedback({ type: 'success', message: 'Formulir tambah kategori siap dikonfigurasi.' })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        + Tambah kategori
                      </button>
                    </div>

                    {/* Tabel 6 Kolom Sesuai Mockup */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-y border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Kategori</th>
                            <th className="px-4 py-3 font-semibold">Harga</th>
                            <th className="px-4 py-3 font-semibold text-center">Kuota</th>
                            <th className="px-4 py-3 font-semibold text-center">Terjual</th>
                            <th className="px-4 py-3 font-semibold text-center">Sisa</th>
                            <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tickets.map((t) => {
                            const isSelected = t.id === Number(selectedTicketId);
                            const totalKuota = Number(t.total_kuota) || (Number(t.sisa_kuota) + 30);
                            const soldCount = Math.max(0, totalKuota - Number(t.sisa_kuota));
                            const isSoldOut = Number(t.sisa_kuota) <= 0;

                            return (
                              <tr
                                key={t.id}
                                className={`transition-colors ${
                                  isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                                }`}
                              >
                                <td className="px-4 py-3.5">
                                  <div className="font-bold text-slate-900">{t.tier}</div>
                                  <div className="mt-1">
                                    {isSoldOut ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                        Sold out
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                        Aktif
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-slate-600 font-medium">
                                  {formatRupiah(t.harga)}
                                </td>
                                <td className="px-4 py-3.5 text-center text-slate-700 font-medium">
                                  {totalKuota}
                                </td>
                                <td className="px-4 py-3.5 text-center text-slate-700 font-medium">
                                  {soldCount}
                                </td>
                                <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                                  {t.sisa_kuota}
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      aria-label={`Edit ${t.tier}`}
                                      title="Edit kategori tiket"
                                      onClick={() => handleSelectTicketTier(t.id)}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        isSelected
                                          ? 'text-blue-700 bg-blue-100'
                                          : 'text-blue-600 hover:bg-blue-50'
                                      }`}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Hapus ${t.tier}`}
                                      title="Hapus kategori tiket"
                                      onClick={() => setFeedback({ type: 'error', message: 'Kategori tiket utama tidak dapat dihapus saat acara aktif.' })}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Alert Info Bawah Tabel Sesuai Mockup */}
                    <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Kategori dengan kuota habis otomatis tidak dapat dipesan.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Panel Form Ubah Acara & Tiket */}
              <div className="lg:col-span-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-20">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Ubah acara & tiket</h3>
                      <p className="text-xs text-slate-500">Ubah kuota tiket dan detail acara</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateTicketQuota} className="space-y-3.5">
                    {/* 1. Nama Acara */}
                    <div>
                      <label htmlFor="input-event-name" className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama acara
                      </label>
                      <input
                        id="input-event-name"
                        type="text"
                        value={eventDetails.namaAcara}
                        onChange={(e) => setEventDetails({ ...eventDetails, namaAcara: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>

                    {/* 2. Tanggal Acara */}
                    <div>
                      <label htmlFor="input-event-date" className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal acara
                      </label>
                      <input
                        id="input-event-date"
                        type="text"
                        value={eventDetails.tanggalAcaraDisplay}
                        onChange={(e) => setEventDetails({ ...eventDetails, tanggalAcaraDisplay: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>

                    {/* 3. Grid: Jam Mulai & Kategori */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="input-event-time" className="block text-xs font-semibold text-slate-700 mb-1">
                          Jam mulai
                        </label>
                        <input
                          id="input-event-time"
                          type="text"
                          value={eventDetails.jamMulai}
                          onChange={(e) => setEventDetails({ ...eventDetails, jamMulai: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label htmlFor="select-ticket-tier" className="block text-xs font-semibold text-slate-700 mb-1">
                          Kategori
                        </label>
                        <select
                          id="select-ticket-tier"
                          value={selectedTicketId}
                          onChange={(e) => handleSelectTicketTier(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        >
                          {tickets.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.tier} ({formatRupiah(t.harga)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 4. Lokasi */}
                    <div>
                      <label htmlFor="input-event-location" className="block text-xs font-semibold text-slate-700 mb-1">
                        Lokasi
                      </label>
                      <input
                        id="input-event-location"
                        type="text"
                        value={eventDetails.lokasi}
                        onChange={(e) => setEventDetails({ ...eventDetails, lokasi: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>

                    {/* 5. Grid: Harga Tiket & Total Kuota */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="input-ticket-price" className="block text-xs font-semibold text-slate-700 mb-1">
                          Harga tiket (Rp)
                        </label>
                        <input
                          id="input-ticket-price"
                          type="number"
                          value={tickets.find((t) => t.id === Number(selectedTicketId))?.harga || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setTickets((prev) =>
                              prev.map((t) => (t.id === Number(selectedTicketId) ? { ...t, harga: val } : t))
                            );
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label htmlFor="input-ticket-quota" className="block text-xs font-semibold text-slate-700 mb-1">
                          Total kuota tiket
                        </label>
                        <input
                          id="input-ticket-quota"
                          type="number"
                          min="0"
                          value={editTicketQuota}
                          onChange={(e) => setEditTicketQuota(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                          required
                        />
                      </div>
                    </div>

                    {/* 6. Switch Toggle: Acara aktif */}
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-semibold text-slate-700">Acara aktif</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={eventDetails.isEventActive}
                        onClick={() => setEventDetails((prev) => ({ ...prev, isEventActive: !prev.isEventActive }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                          eventDetails.isEventActive ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            eventDetails.isEventActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 7. Tombol Aksi: Simpan perubahan & Batal */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        aria-label="Simpan Perubahan Kuota"
                        disabled={isSubmittingTicket}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
                      >
                        {isSubmittingTicket ? 'Menyimpan...' : 'Simpan perubahan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = tickets.find((t) => t.id === Number(selectedTicketId));
                          if (current) setEditTicketQuota(current.sisa_kuota);
                          setFeedback({ type: 'success', message: 'Perubahan dibatalkan.' });
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MANAJEMEN KATALOG ADD-ON                                      */}
        {/* ==================================================================== */}
        {activeTab === 'addons' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Kolom Kiri: Tabel Produk Add-on */}
              <div className="lg:col-span-8 space-y-4">
                {/* Search Bar & Filter Status */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="Cari nama produk add-on..."
                      value={addonSearch}
                      onChange={(e) => setAddonSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                    <svg
                      className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setAddonFilter('semua')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        addonFilter === 'semua'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddonFilter('tersedia')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        addonFilter === 'tersedia'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tersedia
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddonFilter('habis')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        addonFilter === 'habis'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Stok Habis
                    </button>
                  </div>
                </div>

                {/* Tabel Produk Add-on */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Katalog Produk Pendukung</h3>
                      <p className="text-xs text-slate-500">
                        Total {filteredAddons.length} produk terdaftar
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nama Produk</th>
                          <th className="px-4 py-3 font-semibold">Harga</th>
                          <th className="px-4 py-3 font-semibold">Stok</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAddons.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-xs text-slate-500">
                              Tidak ada produk yang cocok dengan pencarian atau filter.
                            </td>
                          </tr>
                        ) : (
                          filteredAddons.map((item) => {
                            const isOutOfStock = Number(item.stok) <= 0;
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3.5 font-bold text-slate-900">
                                  {item.nama_item}
                                </td>
                                <td className="px-4 py-3.5 text-slate-600">
                                  {formatRupiah(item.harga)}
                                </td>
                                <td className="px-4 py-3.5 font-semibold text-slate-800">
                                  {item.stok} unit
                                </td>
                                <td className="px-4 py-3.5">
                                  {isOutOfStock ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                      Habis
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                      Tersedia
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3.5 bg-blue-50/40 border-t border-slate-100 flex items-center gap-2 text-xs text-blue-700">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Produk dengan stok habis tidak dapat ditambahkan ke keranjang pesanan kasir maupun online.</span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Panel Form Tambah Add-on */}
              <div className="lg:col-span-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-20">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Tambah Produk Add-on</h3>
                    <p className="text-xs text-slate-500">Daftarkan makanan, minuman, atau merchandise</p>
                  </div>

                  <form onSubmit={handleAddAddon} className="space-y-4">
                    <div>
                      <label htmlFor="input-addon-name" className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Produk
                      </label>
                      <input
                        id="input-addon-name"
                        type="text"
                        placeholder="Contoh: Popcorn Balado"
                        value={newAddon.nama_item}
                        onChange={(e) => setNewAddon({ ...newAddon, nama_item: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="input-addon-price" className="block text-xs font-semibold text-slate-700 mb-1">
                        Harga (Rp)
                      </label>
                      <input
                        id="input-addon-price"
                        type="number"
                        min="0"
                        placeholder="Contoh: 15000"
                        value={newAddon.harga}
                        onChange={(e) => setNewAddon({ ...newAddon, harga: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="input-addon-stock" className="block text-xs font-semibold text-slate-700 mb-1">
                        Stok Awal
                      </label>
                      <input
                        id="input-addon-stock"
                        type="number"
                        min="0"
                        placeholder="Contoh: 50"
                        value={newAddon.stok}
                        onChange={(e) => setNewAddon({ ...newAddon, stok: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingAddon}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50"
                      >
                        {isSubmittingAddon ? 'Menyimpan...' : 'Simpan Produk Baru'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: MANAJEMEN VOUCHER PROMO                                       */}
        {/* ==================================================================== */}
        {activeTab === 'promos' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Kolom Kiri: Tabel Voucher Promo */}
              <div className="lg:col-span-8 space-y-4">
                {/* Filter Status Promo */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Filter Promo:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPromoFilter('semua')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        promoFilter === 'semua'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoFilter('aktif')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        promoFilter === 'aktif'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoFilter('habis')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        promoFilter === 'habis'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Berakhir / Habis
                    </button>
                  </div>
                </div>

                {/* Tabel Promo */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Daftar Voucher Promo</h3>
                      <p className="text-xs text-slate-500">Potongan harga dan masa berlaku</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Kode Promo</th>
                          <th className="px-4 py-3 font-semibold">Potongan</th>
                          <th className="px-4 py-3 font-semibold">Berakhir</th>
                          <th className="px-4 py-3 font-semibold">Sisa Kuota</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPromos.map((p) => {
                          const isSelected = p.kode_promo === selectedPromoCode;
                          const expDate = p.tanggal_kadaluarsa ? String(p.tanggal_kadaluarsa).split('T')[0] : '';
                          const isExpired = expDate ? expDate < CURRENT_EVENT_DATE : false;
                          const isOutOfQuota = Number(p.kuota_promo) <= 0;
                          const isInactive = isExpired || isOutOfQuota;

                          return (
                            <tr
                              key={p.kode_promo}
                              className={`transition-colors ${
                                isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'
                              }`}
                            >
                              <td className="px-4 py-3.5">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                  {p.kode_promo}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-blue-600">
                                {formatRupiah(p.nominal_potongan)}
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">
                                {formatTanggal(p.tanggal_kadaluarsa)}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-slate-800">
                                {p.kuota_promo} tiket
                              </td>
                              <td className="px-4 py-3.5">
                                {isInactive ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    {isExpired ? 'Kadaluarsa' : 'Habis'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                    Aktif
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPromoCode(p.kode_promo)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  Detail
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Detail Kuota Promo Terpilih */}
                  {currentPromo && (
                    <div className="p-4 bg-slate-50/80 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">
                          Detail Pemakaian Voucher: <span className="text-blue-600 font-mono">{currentPromo.kode_promo}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          Diskon: {formatRupiah(currentPromo.nominal_potongan)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <p className="text-[11px] text-slate-500">Kuota Awal</p>
                          <p className="text-base font-bold text-slate-800">{currentPromo.total_kuota || 100}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <p className="text-[11px] text-slate-500">Terpakai</p>
                          <p className="text-base font-bold text-slate-800">
                            {Math.max(0, (currentPromo.total_kuota || 100) - Number(currentPromo.kuota_promo))}
                          </p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <p className="text-[11px] text-slate-500">Sisa Kuota</p>
                          <p className="text-base font-bold text-emerald-600">{currentPromo.kuota_promo}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Panel Form Tambah Promo */}
              <div className="lg:col-span-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-20">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Tambah Voucher Promo</h3>
                    <p className="text-xs text-slate-500">Buat kode diskon baru untuk pembeli</p>
                  </div>

                  <form onSubmit={handleAddPromo} className="space-y-4">
                    <div>
                      <label htmlFor="input-promo-code" className="block text-xs font-semibold text-slate-700 mb-1">
                        Kode Promo
                      </label>
                      <input
                        id="input-promo-code"
                        type="text"
                        placeholder="Contoh: TAWA25"
                        value={newPromo.kode_promo}
                        onChange={(e) =>
                          setNewPromo({ ...newPromo, kode_promo: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="input-promo-discount" className="block text-xs font-semibold text-slate-700 mb-1">
                        Nominal Potongan (Rp)
                      </label>
                      <input
                        id="input-promo-discount"
                        type="number"
                        min="0"
                        placeholder="Contoh: 15000"
                        value={newPromo.nominal_potongan}
                        onChange={(e) =>
                          setNewPromo({ ...newPromo, nominal_potongan: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="input-promo-quota" className="block text-xs font-semibold text-slate-700 mb-1">
                        Kuota Pemakaian
                      </label>
                      <input
                        id="input-promo-quota"
                        type="number"
                        min="1"
                        placeholder="Contoh: 50"
                        value={newPromo.kuota_promo}
                        onChange={(e) => setNewPromo({ ...newPromo, kuota_promo: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="input-promo-expiry" className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal Berakhir
                      </label>
                      <input
                        id="input-promo-expiry"
                        type="date"
                        value={newPromo.tanggal_kadaluarsa}
                        onChange={(e) =>
                          setNewPromo({ ...newPromo, tanggal_kadaluarsa: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingPromo}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50"
                      >
                        {isSubmittingPromo ? 'Menyimpan...' : 'Simpan Kode Promo'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: LAPORAN PENJUALAN                                             */}
        {/* ==================================================================== */}
        {activeTab === 'reports' && (
          <div className="p-6 space-y-6">
            {/* Header Filter Bar Laporan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Metode:
                </span>
                <select
                  value={reportMethodFilter}
                  onChange={(e) => setReportMethodFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="semua">Semua Metode</option>
                  <option value="CASH">CASH (Tunai)</option>
                  <option value="QRIS">QRIS Dinamis</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  <span>Ekspor / Cetak Laporan</span>
                </button>
              </div>
            </div>

            {/* 4 Kartu Metrik Ringkasan Omzet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Penjualan Bersih
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {formatRupiah(reportSummary.totalRevenue)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Akumulasi transaksi PAID</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Transaksi Dibayar
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {reportSummary.totalTransactions}
                </div>
                <p className="text-xs text-slate-500 mt-1">Faktur sukses selesai</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tiket Terjual
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {reportSummary.totalTicketsSold}
                </div>
                <p className="text-xs text-slate-500 mt-1">Total kursi terkonfirmasi</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Penjualan Add-on
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {formatRupiah(reportSummary.addonRevenue || 450000)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Snack dan merchandise</p>
              </div>
            </div>

            {/* Area Tengah: Grafik Batang Omzet & Penjualan per Kategori */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Grafik Batang Omzet Harian */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Grafik Penjualan Harian</h3>
                    <p className="text-xs text-slate-500">Omzet 7 hari terakhir</p>
                  </div>
                </div>

                <div className="h-56 flex items-end justify-between gap-2 pt-6 px-2">
                  {reportSummary.dailyRevenue && reportSummary.dailyRevenue.map((d, idx) => {
                    const omzetNum = Number(d.omzet) || 0;
                    const heightPercent = Math.max(12, Math.round((omzetNum / maxDailyOmzet) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                        {/* Tooltip Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded-md mb-1.5 whitespace-nowrap pointer-events-none shadow-md">
                          {formatRupiah(omzetNum)} ({d.jumlah_transaksi} trx)
                        </div>
                        {/* Batang Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[36px] bg-blue-600 group-hover:bg-blue-700 rounded-t-lg transition-all"
                        ></div>
                        {/* Label Tanggal */}
                        <span className="text-[10px] text-slate-500 font-medium mt-2 truncate w-full text-center">
                          {d.tanggal?.slice(-5) || d.tanggal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar Penjualan per Kategori */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Penjualan per Kategori</h3>
                  <p className="text-xs text-slate-500">Persentase tiket teralokasi</p>
                </div>

                <div className="space-y-4">
                  {tickets.map((t) => {
                    const totalTier = Number(t.total_kuota) || (Number(t.sisa_kuota) + 30);
                    const soldTier = Math.max(0, totalTier - Number(t.sisa_kuota));
                    const percent = Math.min(100, Math.round((soldTier / totalTier) * 100));
                    return (
                      <div key={t.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800">{t.tier}</span>
                          <span className="text-slate-500">
                            {soldTier} / {totalTier} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all ${
                              percent >= 100
                                ? 'bg-red-500'
                                : percent >= 75
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tabel Riwayat Transaksi Terbaru */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Transaksi Penjualan Terbaru</h3>
                  <p className="text-xs text-slate-500">Daftar transaksi terbayar dari kasir & online</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">No. Invoice / Waktu</th>
                      <th className="px-4 py-3 font-semibold">Pembeli</th>
                      <th className="px-4 py-3 font-semibold">Metode</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Total Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((trx) => (
                      <tr key={trx.no_invoice} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {trx.no_invoice}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {trx.waktu_transaksi}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {trx.nama_pemesan || 'Pelanggan Kasir'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                              trx.metode_pembayaran === 'CASH'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {trx.metode_pembayaran}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            {trx.status_transaksi || 'PAID'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          {formatRupiah(trx.total_bayar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
