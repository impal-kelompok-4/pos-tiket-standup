/**
 * ============================================================================
 * MODUL          : API Route Katalog & Penambahan Addon (addons/route.js)
 * REFERENSI      : DPPL-01 CLS-13 / SKPL KF-09
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Endpoint API untuk mengambil katalog menu snack, minuman,
 *                  dan merchandise serta menambahkan produk baru oleh Administrator.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { AddonController } from '@/controllers/AddonController';

export async function GET() {
  try {
    const addonController = new AddonController();
    const addons = await addonController.getAddons();
    const data = addons.map((a) => (typeof a.toJSON === 'function' ? a.toJSON() : a));

    return NextResponse.json(
      {
        success: true,
        message: 'Katalog add-on berhasil diambil.',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Terjadi galat pada GET /api/addons:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil katalog add-on.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nama_item, harga, stok } = body;

    if (!nama_item || typeof nama_item !== 'string' || nama_item.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama item produk add-on wajib diisi.',
        },
        { status: 400 }
      );
    }

    if (harga === undefined || Number(harga) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Harga produk tidak boleh kosong atau bernilai negatif.',
        },
        { status: 400 }
      );
    }

    if (stok === undefined || Number(stok) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Stok produk tidak boleh kosong atau bernilai negatif.',
        },
        { status: 400 }
      );
    }

    const addonController = new AddonController();
    const result = await addonController.saveAddon({
      nama_item: nama_item.trim(),
      harga: Number(harga),
      stok: Number(stok),
    });

    const data = typeof result?.toJSON === 'function' ? result.toJSON() : result;

    return NextResponse.json(
      {
        success: true,
        message: 'Produk add-on berhasil ditambahkan.',
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Terjadi galat pada POST /api/addons:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan internal server saat menyimpan produk add-on.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
