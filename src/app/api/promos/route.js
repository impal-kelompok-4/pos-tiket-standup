/**
 * ============================================================================
 * MODUL          : API Route Manajemen Promo (promos/route.js)
 * REFERENSI      : DPPL-01 CLS-14 / SKPL KF-10
 * PENGEMBANG     : Abisar Fathir - 103112400068 (Admin Dashboard UI)
 * DESKRIPSI      : Endpoint API untuk mengambil daftar seluruh voucher promo
 *                  dan membuat kode promo baru untuk sistem Stand-Up Comedy.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { PromoController } from '@/controllers/PromoController';

export async function GET() {
  try {
    const promoController = new PromoController();
    const promos = await promoController.getAllPromos();
    const data = (promos || []).map((p) =>
      typeof p.toJSON === 'function' ? p.toJSON() : p
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Daftar kode voucher promo berhasil diambil.',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Terjadi galat pada GET /api/promos:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data voucher promo.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const kode_promo = body.kode_promo || body.kode;
    const nominal_potongan =
      body.nominal_potongan !== undefined
        ? body.nominal_potongan
        : body.potongan !== undefined
        ? body.potongan
        : body.discount;
    const kuota_promo =
      body.kuota_promo !== undefined
        ? body.kuota_promo
        : body.kuota !== undefined
        ? body.kuota
        : body.quota;
    const tanggal_kadaluarsa =
      body.tanggal_kadaluarsa || body.expiry_date || body.berakhir || null;

    if (!kode_promo || typeof kode_promo !== 'string' || kode_promo.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Kode promo wajib diisi.',
        },
        { status: 400 }
      );
    }

    if (kuota_promo !== undefined && Number(kuota_promo) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kuota promo harus lebih dari 0.',
        },
        { status: 400 }
      );
    }

    if (nominal_potongan !== undefined && Number(nominal_potongan) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nominal potongan promo tidak boleh negatif.',
        },
        { status: 400 }
      );
    }

    const promoController = new PromoController();
    const created = await promoController.createPromo({
      kode_promo: String(kode_promo).trim().toUpperCase(),
      nominal_potongan: Number(nominal_potongan) || 0,
      kuota_promo: Number(kuota_promo) || 0,
      tanggal_kadaluarsa,
    });

    const responseData =
      created && typeof created.toJSON === 'function'
        ? created.toJSON()
        : {
            kode_promo: String(kode_promo).trim().toUpperCase(),
            nominal_potongan: Number(nominal_potongan) || 0,
            kuota_promo: Number(kuota_promo) || 0,
            tanggal_kadaluarsa,
          };

    return NextResponse.json(
      {
        success: true,
        message: 'Kode voucher promo berhasil ditambahkan.',
        data: responseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Terjadi galat pada POST /api/promos:', error);
    const isValidationErr =
      error.message?.includes('wajib diisi') ||
      error.message?.includes('harus lebih dari') ||
      error.message?.includes('tidak boleh negatif');

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Gagal menambahkan voucher promo baru.',
        error: error.message,
      },
      { status: isValidationErr ? 400 : 500 }
    );
  }
}
