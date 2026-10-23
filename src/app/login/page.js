/**
 * ============================================================================
 * MODUL          : Halaman Antarmuka Login (page.js)
 * REFERENSI      : DPPL-01 Bab 2.3 (Mockup UI Hal. 12) & SKPL KF-01
 * PENGEMBANG     : Keishin Naufa Alfaridzhi (103112400061) - UI/UX & Frontend Next.js
 * DESKRIPSI      : Boundary/View antarmuka Login sistem PoS Tiket Stand-Up Comedy
 *                  dengan validasi input, status interaktif, dan integrasi API autentikasi.
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessUser(null);

    if (!username.trim() || !password) {
      setErrorMessage('Username dan kata sandi tidak boleh kosong.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || 'Gagal masuk. Periksa kembali akun Anda.');
      } else {
        setSuccessUser(result.data);
      }
    } catch (err) {
      setErrorMessage('Koneksi server terganggu. Pastikan basis data MySQL aktif.');
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mengisi cepat akun dummy saat pengujian / evaluasi dosen
  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage('');
    setSuccessUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-8 sm:py-12 font-sans">
      {/* Container Kartu Login */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        
        {/* Header Branding PoS Stand-Up Comedy */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
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
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Tiket<span className="text-blue-600">.</span>
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Stand-Up Comedy PoS
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sistem Kasir &amp; Manajemen Tiket (Kelompok 4 ImPal)
          </p>
        </div>

        {/* Notifikasi Sukses */}
        {successUser && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Login Berhasil!</span>
            </div>
            <p className="mt-1 text-emerald-800">
              Selamat datang, <strong className="font-bold text-slate-900">{successUser.username}</strong>!
            </p>
            <div className="mt-2 text-xs inline-block uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
              Role: {successUser.role}
            </div>
          </div>
        )}

        {/* Notifikasi Gagal */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username kasir / admin"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white transition-all disabled:bg-slate-100 disabled:text-slate-400"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white transition-all disabled:bg-slate-100 disabled:text-slate-400"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Memvalidasi...</span>
              </>
            ) : (
              <span>Masuk ke Sistem</span>
            )}
          </button>
        </form>

        {/* Shortcut Akun Cepat Pengujian (Testing / Demo Tugas 6 ImPal) */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-600 text-center mb-3">
            Akun Demo Pengujian (Data Seeding Tugas 5):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('kasir_pos01', 'kasir123')}
              className="py-2 px-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-lg border border-slate-200 transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Kasir PoS
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin_utama', 'admin123')}
              className="py-2 px-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-lg border border-slate-200 transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('petugas_gate1', 'gate123')}
              className="py-2 px-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-lg border border-slate-200 transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Gate
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1.5 py-0.5"
          >
            <span>&larr; Kembali ke Beranda</span>
          </Link>
        </div>

      </div>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-slate-500">
        &copy; 2026 ImPal Kelompok 4 &bull; Sistem Pemesanan Tiket Stand-Up Comedy
      </footer>
    </div>
  );
}
