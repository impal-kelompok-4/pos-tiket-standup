/**
 * ============================================================================
 * MODUL          : API Route Ringkasan Laporan Penjualan (reports/summary/route.js)
 * REFERENSI      : DPPL-01 CLS-15 / SKPL KF-13
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Endpoint API GET untuk menyajikan agregasi omzet total,
 *                  total tiket terjual, total transaksi, dan omzet harian.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { ReportController } from '@/controllers/ReportController';

export async function GET() {
  try {
    const reportController = new ReportController();
    const summary = await reportController.fetchReportData();

    return NextResponse.json(
      {
        success: true,
        message: 'Ringkasan laporan penjualan berhasil diambil.',
        data: summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Terjadi galat pada GET /api/reports/summary:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data ringkasan laporan penjualan.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
