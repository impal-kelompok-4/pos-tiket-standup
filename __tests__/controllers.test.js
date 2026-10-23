/**
 * ============================================================================
 * MODUL          : Unit Test Controller OOP (controllers.test.js)
 * REFERENSI      : DPPL-01 Bab 2.4 & 2.5 (Tabel 38 CLS-08 s.d CLS-15)
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo (103112400081) - QA & Testing
 * DESKRIPSI      : Pengujian inisialisasi skeleton controller, private attributes (#),
 *                  dan ketersediaan method signatures sesuai spesifikasi DPPL.
 * ============================================================================
 */

import { TransactionController } from '@/controllers/TransactionController';
import { OrderController } from '@/controllers/OrderController';
import { PaymentController } from '@/controllers/PaymentController';
import { ValidationController } from '@/controllers/ValidationController';
import { EventController } from '@/controllers/EventController';
import { AddonController } from '@/controllers/AddonController';
import { PromoController } from '@/controllers/PromoController';
import { ReportController } from '@/controllers/ReportController';

describe('Unit Testing Skeleton Controllers (CLS-08 s.d CLS-15)', () => {
  it('TransactionController harus menginisialisasi model dan memiliki method yang valid', async () => {
    const ctrl = new TransactionController();
    expect(ctrl.transactionModel).toBeDefined();
    expect(ctrl.ticketModel).toBeDefined();

    const addRes = await ctrl.addItem(1, 2);
    expect(addRes).toBe(true);

    const payRes = await ctrl.processPayment(100000);
    expect(payRes.success).toBe(true);
  });

  it('OrderController harus memiliki method addToCart', async () => {
    const ctrl = new OrderController();
    const res = await ctrl.addToCart(1, 1);
    expect(res).toBe(true);
  });

  it('PaymentController harus memiliki method initiatePayment dan webhookNotification', async () => {
    const ctrl = new PaymentController();
    const initRes = await ctrl.initiatePayment();
    expect(initRes.status).toBe('PENDING');

    const hookRes = await ctrl.webhookNotification('PAID');
    expect(hookRes).toBe(true);
  });

  it('ValidationController harus memiliki method validateQR dan setCheckedIn', async () => {
    const ctrl = new ValidationController();
    const valRes = await ctrl.validateQR('QR123');
    expect(valRes.isValid).toBe(true);

    const checkRes = await ctrl.setCheckedIn('TKT-001');
    expect(checkRes).toBe(true);
  });

  it('EventController, AddonController, PromoController, ReportController dapat diinisialisasi', async () => {
    const eventCtrl = new EventController();
    expect(await eventCtrl.saveEventData({})).toBe(true);

    const addonCtrl = new AddonController();
    expect(await addonCtrl.saveAddon({})).toBe(true);

    const promoCtrl = new PromoController();
    expect(await promoCtrl.createPromo({})).toBe(true);
    const applyRes = await promoCtrl.applyPromo('KETAWA10');
    expect(applyRes.valid).toBe(true);

    const reportCtrl = new ReportController();
    const reportData = await reportCtrl.fetchReportData();
    expect(reportData.totalRevenue).toBe(0);
  });
});
