/**
 * ============================================================================
 * MODUL          : API Route Transaksi Kasir PoS & Online (transactions/route.js)
 * REFERENSI      : DPPL-01 CLS-09 / SKPL KF-01, KF-02
 * PENGEMBANG     : Ariel Ahnaf Kusuma (103112400050)
 * DESKRIPSI      : Endpoint API untuk memproses transaksi penjualan kasir PoS
 *                  (pembayaran tunai dan kembalian), inisiasi transaksi pending,
 *                  serta mengambil daftar riwayat transaksi.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { TransactionController } from '@/controllers/TransactionController';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoice = searchParams.get('invoice') || searchParams.get('no_invoice');
    const controller = new TransactionController();

    if (invoice) {
      const trx = await controller.getTransaction(invoice);
      if (!trx) {
        return NextResponse.json(
          {
            success: false,
            message: `Transaksi dengan nomor invoice "${invoice}" tidak ditemukan.`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Data transaksi berhasil diambil.',
          data: typeof trx.toJSON === 'function' ? trx.toJSON() : trx,
        },
        { status: 200 }
      );
    }

    const transactions = await controller.getAllTransactions();
    const data = transactions.map((t) =>
      typeof t.toJSON === 'function' ? t.toJSON() : t
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Daftar riwayat transaksi berhasil diambil.',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Terjadi galat pada GET /api/transactions:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil riwayat transaksi.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const items = body.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Daftar item belanja (items) wajib disertakan.',
        },
        { status: 400 }
      );
    }

    const controller = new TransactionController();

    // Tambahkan setiap item ke dalam transaksi
    for (const item of items) {
      const qty = Number(item.qty || item.kuantitas) || 1;
      const itemId = item.id || item.ticketId || item.addonId;

      if (!itemId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Setiap item wajib memiliki ID tiket atau add-on yang valid.',
          },
          { status: 400 }
        );
      }

      if (item.type === 'addon') {
        const added = await controller.addAddon(itemId, qty);
        if (!added) {
          return NextResponse.json(
            {
              success: false,
              message: `Stok untuk produk add-on ID ${itemId} tidak mencukupi kuantitas ${qty}.`,
            },
            { status: 400 }
          );
        }
      } else {
        const added = await controller.addItem(itemId, qty);
        if (!added) {
          return NextResponse.json(
            {
              success: false,
              message: `Kuota tiket untuk tier ID ${itemId} tidak mencukupi kuantitas ${qty}.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Terapkan promo jika kode voucher diberikan
    if (body.promoCode) {
      const promoResult = await controller.applyPromo(body.promoCode);
      if (!promoResult.valid) {
        return NextResponse.json(
          {
            success: false,
            message: promoResult.message,
          },
          { status: 400 }
        );
      }
    }

    // Pemrosesan berdasarkan metode pembayaran
    const metode = String(body.metode_pembayaran || 'CASH').toUpperCase();

    if (metode !== 'CASH' || body.status === 'PENDING') {
      const pendingResult = await controller.createPendingTransaction({
        ...body,
        items,
        promoCode: body.promoCode,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Transaksi online pending berhasil dibuat.',
          data: pendingResult,
        },
        { status: 201 }
      );
    }

    // Transaksi Tunai Kasir PoS
    const cashAmount =
      body.cashAmount !== undefined
        ? body.cashAmount
        : body.cash !== undefined
        ? body.cash
        : body.uang_tunai;

    if (cashAmount === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nominal pembayaran tunai (cashAmount) wajib disertakan.',
        },
        { status: 400 }
      );
    }

    const customerData = body.customerData || {
      nama_pemesan: body.nama_pemesan,
      email_pemesan: body.email_pemesan,
      no_telp_pemesan: body.no_telp_pemesan,
      id_pengguna: body.id_pengguna,
    };

    const paymentResult = await controller.processPayment(
      Number(cashAmount),
      customerData
    );

    if (!paymentResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: paymentResult.message,
          data: paymentResult,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Transaksi kasir PoS berhasil diselesaikan.',
        data: paymentResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Terjadi galat pada POST /api/transactions:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan internal server saat memproses transaksi.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
