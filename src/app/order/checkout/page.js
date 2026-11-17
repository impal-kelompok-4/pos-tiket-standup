/**
 * ============================================================================
 * MODUL          : Pemesanan Mandiri Daring - Checkout (src/app/order/checkout/page.js)
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL KF-04, KF-11 (Checkout & Pembayaran)
 * PENGEMBANG     : Keishin Naufa Alfaridzhi - 103112400061 (Lead UI/UX & Frontend)
 * DESKRIPSI      : Langkah 3 alur pemesanan tiket mandiri daring (mobile-first):
 *                  Formulir identitas pemesan (nama, email, nomor telepon),
 *                  rincian ringkasan pesanan, validasi kode promo, pilihan metode
 *                  pembayaran (QRIS / VA), dan submit checkout ke /api/checkout.
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

export default function OrderCheckoutPage() {
  const router = useRouter();

  // Data pesanan dari session
  const [tickets] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedTickets = sessionStorage.getItem('impal_order_tickets_data');
      return savedTickets ? JSON.parse(savedTickets) || [] : [];
    } catch {
      return [];
    }
  });

  const [addons] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedAddons = sessionStorage.getItem('impal_order_addons_data');
      return savedAddons ? JSON.parse(savedAddons) || [] : [];
    } catch {
      return [];
    }
  });

  // Form Identitas Pemesan
  const [formData, setFormData] = useState({
    nama_pemesan: '',
    email_pemesan: '',
    no_telp_pemesan: '',
  });

  // Validasi form error
  const [formErrors, setFormErrors] = useState({});

  // Promo
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [activePromo, setActivePromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Metode Pembayaran ('QRIS' | 'VA')
  const [paymentMethod, setPaymentMethod] = useState('QRIS');

  // Status proses checkout
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Kalkulasi Rincian Biaya
  const subtotalTickets = useMemo(() => {
    return tickets.reduce((sum, t) => sum + Number(t.harga) * Number(t.qty), 0);
  }, [tickets]);

  const subtotalAddons = useMemo(() => {
    return addons.reduce((sum, a) => sum + Number(a.harga) * Number(a.qty), 0);
  }, [addons]);

  const rawSubtotal = subtotalTickets + subtotalAddons;

  const discountAmount = useMemo(() => {
    if (!activePromo) return 0;
    return Math.min(rawSubtotal, Number(activePromo.nominal_potongan) || 0);
  }, [rawSubtotal, activePromo]);

  const grandTotal = Math.max(0, rawSubtotal - discountAmount);

  // Handle Input Form
  const handleChangeInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validasi Voucher Promo
  const handleValidatePromo = async (e) => {
    e?.preventDefault();
    if (!promoCodeInput.trim()) {
      setPromoError('Masukkan kode promo.');
      return;
    }
    if (rawSubtotal <= 0) {
      setPromoError('Keranjang belanja kosong.');
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
          subtotal: rawSubtotal,
        }),
      });

      const data = await res.json();

      if (data.valid && data.promo) {
        setActivePromo(data.promo);
        setPromoError('');
      } else {
        setActivePromo(null);
        setPromoError(data.message || 'Kode promo tidak valid atau kuota habis.');
      }
    } catch (err) {
      console.error('Galat promo:', err);
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

  // Validasi Form sebelum submit
  const validateForm = () => {
    const errors = {};
    if (!formData.nama_pemesan.trim()) {
      errors.nama_pemesan = 'Nama lengkap pemesan wajib diisi.';
    }
    if (!formData.email_pemesan.trim()) {
      errors.email_pemesan = 'Alamat email aktif wajib diisi.';
    } else if (!formData.email_pemesan.includes('@')) {
      errors.email_pemesan = 'Format email tidak valid (harus ada @).';
    }
    if (!formData.no_telp_pemesan.trim()) {
      errors.no_telp_pemesan = 'Nomor telepon / WhatsApp wajib diisi.';
    } else if (formData.no_telp_pemesan.length < 8) {
      errors.no_telp_pemesan = 'Nomor telepon minimal 8 digit.';
    }

    if (tickets.length === 0 && addons.length === 0) {
      errors.cart = 'Keranjang belanja tidak boleh kosong.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Checkout Pemesanan
  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        customer: {
          nama_pemesan: formData.nama_pemesan.trim(),
          email_pemesan: formData.email_pemesan.trim(),
          no_telp_pemesan: formData.no_telp_pemesan.trim(),
          metode_pembayaran: paymentMethod,
        },
        tickets: tickets.map((t) => ({ id: t.id, qty: t.qty })),
        addons: addons.map((a) => ({ id: a.id, qty: a.qty })),
        kode_promo: activePromo ? activePromo.kode_promo : undefined,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const noInvoice = json.data.noInvoice;

        // Simpan data konfirmasi untuk fallback tampilan sukses
        try {
          sessionStorage.setItem(
            `impal_checkout_${noInvoice}`,
            JSON.stringify(json.data)
          );
          // Bersihkan keranjang sementara
          sessionStorage.removeItem('impal_order_tickets');
          sessionStorage.removeItem('impal_order_tickets_data');
          sessionStorage.removeItem('impal_order_addons');
          sessionStorage.removeItem('impal_order_addons_data');
        } catch {
          // Fallback
        }

        router.push(`/order/success/${noInvoice}`);
      } else {
        setSubmitError(json.message || 'Gagal memproses pesanan.');
      }
    } catch (err) {
      console.error('Galat submit checkout:', err);
      setSubmitError('Terjadi kesalahan jaringan saat checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-28">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/order/addons"
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
            <span>Kembali ke Add-on</span>
          </Link>
          <span className="font-extrabold text-slate-900 text-sm">
            Tiket<span className="text-blue-600">.</span> Checkout
          </span>
          <span className="w-16"></span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Step Indicator 3 of 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-blue-600">Langkah 3 dari 4</span>
            <span className="text-slate-500">Checkout &amp; Pembayaran</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full w-3/4"></div>
          </div>
        </div>

        {/* Ringkasan Item Pesanan */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Ringkasan Pesanan
            </h2>
            <Link
              href="/order"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Ubah Tiket
            </Link>
          </div>

          {tickets.length === 0 && addons.length === 0 ? (
            <div className="py-4 text-center text-slate-400 text-xs">
              <p>Belum ada tiket atau add-on yang dipilih.</p>
              <Link
                href="/order"
                className="mt-2 inline-block font-semibold text-blue-600"
              >
                Pilih Tiket Sekarang &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {tickets.map((t) => (
                <div
                  key={`t-${t.id}`}
                  className="flex items-center justify-between py-1 border-b border-slate-50"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Tiket {t.tier}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {formatRupiah(t.harga)} &times; {t.qty} tiket
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(t.harga * t.qty)}
                  </span>
                </div>
              ))}

              {addons.map((a) => (
                <div
                  key={`a-${a.id}`}
                  className="flex items-center justify-between py-1 border-b border-slate-50"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {a.nama_item}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {formatRupiah(a.harga)} &times; {a.qty} item
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(a.harga * a.qty)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Formulir Identitas Pemesan */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Data Identitas Pemesan
            </h2>
            <p className="text-xs text-slate-500">
              E-Tiket QR akan diterbitkan atas nama ini
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="nama_pemesan"
                className="text-xs font-bold text-slate-700 block mb-1"
              >
                Nama Lengkap Pemesan *
              </label>
              <input
                id="nama_pemesan"
                name="nama_pemesan"
                type="text"
                value={formData.nama_pemesan}
                onChange={handleChangeInput}
                placeholder="Contoh: Budi Santoso"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all ${
                  formErrors.nama_pemesan
                    ? 'border-rose-400 ring-1 ring-rose-300'
                    : 'border-slate-200'
                }`}
              />
              {formErrors.nama_pemesan && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {formErrors.nama_pemesan}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email_pemesan"
                className="text-xs font-bold text-slate-700 block mb-1"
              >
                Alamat Email Aktif *
              </label>
              <input
                id="email_pemesan"
                name="email_pemesan"
                type="email"
                value={formData.email_pemesan}
                onChange={handleChangeInput}
                placeholder="budi.santoso@email.com"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all ${
                  formErrors.email_pemesan
                    ? 'border-rose-400 ring-1 ring-rose-300'
                    : 'border-slate-200'
                }`}
              />
              {formErrors.email_pemesan && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {formErrors.email_pemesan}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="no_telp_pemesan"
                className="text-xs font-bold text-slate-700 block mb-1"
              >
                Nomor Telepon / WhatsApp *
              </label>
              <input
                id="no_telp_pemesan"
                name="no_telp_pemesan"
                type="tel"
                value={formData.no_telp_pemesan}
                onChange={handleChangeInput}
                placeholder="081234567890"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all ${
                  formErrors.no_telp_pemesan
                    ? 'border-rose-400 ring-1 ring-rose-300'
                    : 'border-slate-200'
                }`}
              />
              {formErrors.no_telp_pemesan && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {formErrors.no_telp_pemesan}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Voucher Promo */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Voucher Promo Diskon
            </h2>
          </div>

          {activePromo ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-emerald-800">
                    {activePromo.kode_promo}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
                    Diterapkan
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Potongan {formatRupiah(activePromo.nominal_potongan)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
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
                placeholder="Kode Promo (misal: ROAST20)"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={validatingPromo || !promoCodeInput.trim() || rawSubtotal <= 0}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
              >
                {validatingPromo ? 'Cek...' : 'Terapkan'}
              </button>
            </form>
          )}

          {promoError && (
            <p className="text-xs text-rose-600 font-medium">{promoError}</p>
          )}
        </section>

        {/* Pilihan Metode Pembayaran */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Metode Pembayaran
            </h2>
            <p className="text-xs text-slate-500">
              Pilih kanal pembayaran daring yang diinginkan
            </p>
          </div>

          <div className="space-y-2">
            <label
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'QRIS'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="QRIS"
                  checked={paymentMethod === 'QRIS'}
                  onChange={() => setPaymentMethod('QRIS')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                    QRIS (Scan Instan Seluruh E-Wallet &amp; Mobile Banking)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    GoPay, OVO, ShopeePay, DANA, BCA, Mandiri, dll.
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600">Instan</span>
            </label>

            <label
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'VA'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VA"
                  checked={paymentMethod === 'VA'}
                  onChange={() => setPaymentMethod('VA')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                    Virtual Account (VA Bank Transfer)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    BCA, Bank Mandiri, BNI, BRI Virtual Account
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">Otomatis</span>
            </label>
          </div>
        </section>

        {/* Ringkasan Biaya Akhir */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Tiket</span>
            <span>{formatRupiah(subtotalTickets)}</span>
          </div>
          {subtotalAddons > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Add-on</span>
              <span>{formatRupiah(subtotalAddons)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Potongan Promo ({activePromo?.kode_promo})</span>
              <span>-{formatRupiah(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Tagihan</span>
            <span className="text-blue-600">{formatRupiah(grandTotal)}</span>
          </div>
        </section>

        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <p className="font-semibold mb-1">Gagal memproses checkout:</p>
            <p>{submitError}</p>
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 block">
              Total Pembayaran:
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-blue-600">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            disabled={submitting || (tickets.length === 0 && addons.length === 0)}
            onClick={handleSubmitCheckout}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Bayar Sekarang</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
