/**
 * ============================================================================
 * MODUL          : API Route Validasi Voucher Promo (promos/validate/route.js)
 * REFERENSI      : DPPL-01 CLS-14 / SKPL KF-10, KF-12
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Endpoint API POST untuk memvalidasi kelayakan kode promo,
 *                  tanggal kadaluarsa, sisa kuota, dan nominal potongan diskon.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { PromoController } from '@/controllers/PromoController';

export async function POST(request) {
  try {
    const body = await request.json();
    const { kode, subtotal } = body;

    if (!kode || typeof kode !== 'string' || kode.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          discount: 0,
          message: 'Kode voucher promo wajib diisi.',
        },
        { status: 400 }
      );
    }

    const subtotalNum = subtotal !== undefined ? Number(subtotal) : 0;
    if (subtotalNum < 0) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          discount: 0,
          message: 'Nilai subtotal transaksi tidak boleh negatif.',
        },
        { status: 400 }
      );
    }

    const promoController = new PromoController();
    const result = await promoController.applyPromo(kode.trim(), subtotalNum);

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          discount: 0,
          message: result.message || 'Kode promo tidak valid atau kuota habis.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        discount: result.discount,
        promo: result.promo,
        message: 'Kode voucher promo valid dan berhasil diterapkan.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Terjadi galat pada POST /api/promos/validate:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: 'Terjadi kesalahan internal server saat memvalidasi kode promo.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
