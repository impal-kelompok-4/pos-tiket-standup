/**
 * ============================================================================
 * MODUL          : API Route Checkout Pemesanan Mandiri Daring (checkout/route.js)
 * REFERENSI      : DPPL-01 CLS-10 / SKPL KF-04, KF-11
 * PENGEMBANG     : Ariel Ahnaf Kusuma (103112400050)
 * DESKRIPSI      : Endpoint API untuk memproses checkout mandiri daring oleh
 *                  penonton (pemilihan tiket, add-on, dan inisiasi pembayaran).
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { OrderController } from '@/controllers/OrderController';
import { PaymentController } from '@/controllers/PaymentController';

export async function POST(request) {
  try {
    const body = await request.json();
    const customer = body.customer || body;

    const nama_pemesan = customer.nama_pemesan || customer.nama;
    const email_pemesan = customer.email_pemesan || customer.email;
    const no_telp_pemesan =
      customer.no_telp_pemesan || customer.phone || customer.no_telp;
    const metode_pembayaran = customer.metode_pembayaran || 'QRIS';

    if (!nama_pemesan || !email_pemesan || !no_telp_pemesan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data pemesan wajib lengkap (nama, email, nomor telepon).',
        },
        { status: 400 }
      );
    }

    const tickets =
      body.tickets ||
      body.cart?.tickets ||
      (Array.isArray(body.items)
        ? body.items.filter((i) => i.type !== 'addon')
        : []);

    const addons =
      body.addons ||
      body.cart?.addons ||
      (Array.isArray(body.items)
        ? body.items.filter((i) => i.type === 'addon')
        : []);

    if (tickets.length === 0 && addons.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Keranjang belanja tidak boleh kosong.',
        },
        { status: 400 }
      );
    }

    const orderController = new OrderController();

    // Tambahkan tiket ke keranjang
    for (const t of tickets) {
      const ticketId = t.id || t.ticketId || t.tierId;
      const qty = Number(t.qty || t.quantity) || 1;
      const added = await orderController.addToCart(ticketId, qty);
      if (!added) {
        return NextResponse.json(
          {
            success: false,
            message: `Sisa kuota tiket ID ${ticketId} tidak mencukupi permintaan ${qty}.`,
          },
          { status: 400 }
        );
      }
    }

    // Tambahkan add-on ke keranjang
    for (const a of addons) {
      const addonId = a.id || a.addonId;
      const qty = Number(a.qty || a.quantity) || 1;
      const added = await orderController.addAddon(addonId, qty);
      if (!added) {
        return NextResponse.json(
          {
            success: false,
            message: `Stok produk add-on ID ${addonId} tidak mencukupi permintaan ${qty}.`,
          },
          { status: 400 }
        );
      }
    }

    // Proses checkout mandiri
    const checkoutResult = await orderController.checkout({
      nama_pemesan,
      email_pemesan,
      no_telp_pemesan,
      metode_pembayaran,
      kode_promo: body.kode_promo || body.promoCode || null,
    });

    if (!checkoutResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: checkoutResult.message,
        },
        { status: 400 }
      );
    }

    // Inisiasi simulasi payment gateway
    const paymentController = new PaymentController();
    const paymentSimulation = await paymentController.initiatePayment(
      checkoutResult.noInvoice,
      metode_pembayaran
    );

    checkoutResult.payment = paymentSimulation;

    return NextResponse.json(
      {
        success: true,
        message: 'Checkout pemesanan mandiri berhasil dibuat.',
        data: checkoutResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Terjadi galat pada POST /api/checkout:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan internal server saat memproses checkout.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
