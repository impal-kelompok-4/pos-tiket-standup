/**
 * ============================================================================
 * MODUL          : API Route Manajemen Tiket (tickets/route.js)
 * REFERENSI      : DPPL-01 CLS-12 / SKPL KF-08
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Endpoint API untuk mengambil daftar tier tiket dan memperbarui
 *                  alokasi kuota tiket Stand-Up Comedy oleh Administrator.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { EventController } from '@/controllers/EventController';

export async function GET() {
  try {
    const eventController = new EventController();
    const tickets = await eventController.getTickets();
    const data = tickets.map((t) => (typeof t.toJSON === 'function' ? t.toJSON() : t));

    return NextResponse.json(
      {
        success: true,
        message: 'Daftar tier tiket berhasil diambil.',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Terjadi galat pada GET /api/tickets:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data tier tiket.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const tierId = body.tierId || body.id;
    const quota =
      body.sisa_kuota !== undefined
        ? body.sisa_kuota
        : body.quota !== undefined
        ? body.quota
        : body.qty;

    if (tierId === undefined || quota === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Parameter tierId dan sisa_kuota wajib disertakan.',
        },
        { status: 400 }
      );
    }

    if (Number(quota) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Sisa kuota tiket tidak boleh bernilai negatif.',
        },
        { status: 400 }
      );
    }

    const eventController = new EventController();
    const updated = await eventController.updateQuota(Number(tierId), Number(quota));

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tier tiket tidak ditemukan atau pembaruan kuota gagal.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Kuota tiket berhasil diperbarui.',
        data: {
          tierId: Number(tierId),
          sisa_kuota: Number(quota),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Terjadi galat pada POST /api/tickets:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan internal server saat memperbarui kuota tiket.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  return POST(request);
}
