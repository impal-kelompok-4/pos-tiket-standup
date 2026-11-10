/**
 * ============================================================================
 * MODUL          : API Route Gate Scanner & Verifikasi (gate/verify/route.js)
 * REFERENSI      : DPPL-01 CLS-16 / SKPL KF-06, KF-07
 * PENGEMBANG     : Ariel Ahnaf Kusuma (103112400050)
 * DESKRIPSI      : Endpoint API untuk verifikasi QR Code e-tiket pada scanner
 *                  pintu masuk gate acara dan proteksi anti-double-checkin.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { ValidationController } from '@/controllers/ValidationController';

export async function POST(request) {
  try {
    const body = await request.json();
    const qrPayload =
      body.qrPayload || body.qr_code_hash || body.qrHash || body.ticketCode;

    if (!qrPayload || String(qrPayload).trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Payload QR code atau hash e-tiket wajib disertakan.',
        },
        { status: 400 }
      );
    }

    const controller = new ValidationController();
    const result = await controller.validateQR(String(qrPayload).trim());

    if (result.isValid) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: result,
        },
        { status: 200 }
      );
    }

    // Tangani kondisi tiket sudah pernah check-in sebelumnya (Anti-Double-Checkin)
    if (result.alreadyCheckedIn) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          data: result,
        },
        { status: 409 }
      );
    }

    // Tangani kondisi tiket palsu atau tidak terdaftar
    return NextResponse.json(
      {
        success: false,
        message: result.message,
        data: result,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Terjadi galat pada POST /api/gate/verify:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan internal server saat memverifikasi QR e-tiket.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
