/**
 * ============================================================================
 * MODUL          : API Route Autentikasi Login (route.js)
 * REFERENSI      : DPPL-01 Bab 2.4 & SKPL KF-01 (Autentikasi Pengguna)
 * PENGEMBANG     : 1. Ariel Ahnaf Kusuma (103112400050) - Endpoint Handler
 *                  2. Abisar Fathir (103112400068) - Integrasi Database
 * DESKRIPSI      : Endpoint POST /api/auth/login untuk memproses autentikasi pengguna
 *                  dengan memanggil method login() pada entitas Pengguna.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import Pengguna from '@/models/Pengguna';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validasi input kelengkapan parameter
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username dan password wajib diisi.',
        },
        { status: 400 }
      );
    }

    // Eksekusi method login pada class Pengguna
    const user = await Pengguna.login(username.trim(), password);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username atau password tidak sesuai.',
        },
        { status: 401 }
      );
    }

    // Berhasil autentikasi
    return NextResponse.json(
      {
        success: true,
        message: 'Autentikasi berhasil.',
        data: user.toJSON(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Terjadi galat pada API Login:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal terhubung ke basis data atau server internal bermasalah.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
