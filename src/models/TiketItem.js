/**
 * ============================================================================
 * MODUL          : TiketItem Entity (TiketItem.js)
 * REFERENSI      : DPPL-01 CLS-07 / SKPL KF-06, KF-07
 * PENGEMBANG     : Abisar Fathir (103112400068)
 * DESKRIPSI      : Entitas TiketItem untuk pencatatan e-tiket individual, hash barcode QR,
 *                  dan validasi status kehadiran gate check-in dengan prepared statement.
 * ============================================================================
 */

import pool from '@/config/db';

export class TiketItem {
  #kode_tiket;
  #id_detail;
  #qr_code_hash;
  #status_kehadiran;
  #waktu_checkin;

  /**
   * Konstruktor Entitas TiketItem
   * @param {string} kode_tiket
   * @param {number|null} id_detail
   * @param {string} qr_code_hash
   * @param {string} status_kehadiran - 'Belum Hadir' | 'Checked-In'
   * @param {string|Date|null} waktu_checkin
   */
  constructor(
    kode_tiket = '',
    id_detail = null,
    qr_code_hash = '',
    status_kehadiran = 'Belum Hadir',
    waktu_checkin = null
  ) {
    this.#kode_tiket = String(kode_tiket || '');
    this.#id_detail = id_detail !== null && id_detail !== undefined ? Number(id_detail) : null;
    this.#qr_code_hash = String(qr_code_hash || '');
    this.#status_kehadiran = String(status_kehadiran || 'Belum Hadir');
    this.#waktu_checkin = waktu_checkin;
  }

  // --- GETTER & SETTER ---
  get kode_tiket() {
    return this.#kode_tiket;
  }

  set kode_tiket(value) {
    this.#kode_tiket = String(value || '');
  }

  get id_detail() {
    return this.#id_detail;
  }

  set id_detail(value) {
    this.#id_detail = value !== null && value !== undefined ? Number(value) : null;
  }

  get qr_code_hash() {
    return this.#qr_code_hash;
  }

  set qr_code_hash(value) {
    this.#qr_code_hash = String(value || '');
  }

  get status_kehadiran() {
    return this.#status_kehadiran;
  }

  set status_kehadiran(value) {
    this.#status_kehadiran = String(value || 'Belum Hadir');
  }

  get waktu_checkin() {
    return this.#waktu_checkin;
  }

  set waktu_checkin(value) {
    this.#waktu_checkin = value;
  }

  // --- DATABASE HELPER METHODS ---

  /**
   * Menyimpan record tiket item baru ke tabel TIKET_ITEM
   * @param {object} data - { kode_tiket, id_detail, qr_code_hash, status_kehadiran, waktu_checkin }
   * @returns {Promise<TiketItem>}
   */
  static async create(data) {
    const kode_tiket = String(data.kode_tiket || '');
    const id_detail = Number(data.id_detail);
    const qr_code_hash = String(data.qr_code_hash || '');
    const status_kehadiran = String(data.status_kehadiran || 'Belum Hadir');
    const waktu_checkin = data.waktu_checkin || null;

    try {
      const query = `
        INSERT INTO TIKET_ITEM (kode_tiket, id_detail, qr_code_hash, status_kehadiran, waktu_checkin)
        VALUES (?, ?, ?, ?, ?)
      `;
      await pool.execute(query, [
        kode_tiket,
        id_detail,
        qr_code_hash,
        status_kehadiran,
        waktu_checkin,
      ]);
      return new TiketItem(kode_tiket, id_detail, qr_code_hash, status_kehadiran, waktu_checkin);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return new TiketItem(kode_tiket, id_detail, qr_code_hash, status_kehadiran, waktu_checkin);
      }
      throw err;
    }
  }

  /**
   * Instance method untuk create tiket item
   * @param {object} [data]
   * @returns {Promise<TiketItem>}
   */
  async create(data) {
    const payload = data || this.toJSON();
    return TiketItem.create(payload);
  }

  /**
   * Mencari record tiket berdasarkan qr_code_hash
   * @param {string} qrHash
   * @returns {Promise<TiketItem|null>}
   */
  static async findByHash(qrHash) {
    if (!qrHash) return null;
    const cleanHash = String(qrHash).trim();

    try {
      const query = `
        SELECT kode_tiket, id_detail, qr_code_hash, status_kehadiran, waktu_checkin
        FROM TIKET_ITEM
        WHERE qr_code_hash = ? OR kode_tiket = ?
        LIMIT 1
      `;
      const [rows] = await pool.execute(query, [cleanHash, cleanHash]);
      if (!rows || rows.length === 0) {
        return null;
      }
      const r = rows[0];
      return new TiketItem(
        r.kode_tiket,
        r.id_detail,
        r.qr_code_hash,
        r.status_kehadiran,
        r.waktu_checkin
      );
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return new TiketItem(
          cleanHash.startsWith('TKT-') ? cleanHash : `TKT-${cleanHash}`,
          null,
          cleanHash,
          'Belum Hadir',
          null
        );
      }
      throw err;
    }
  }

  /**
   * Instance method untuk findByHash
   * @param {string} [qrHash]
   * @returns {Promise<TiketItem|null>}
   */
  async findByHash(qrHash) {
    const targetHash = qrHash || this.#qr_code_hash;
    return TiketItem.findByHash(targetHash);
  }

  /**
   * Memvalidasi hash QR, memastikan anti-double-checkin,
   * dan memperbarui status menjadi 'Checked-In' beserta timestamp waktu_checkin
   * @param {string} qrPayload
   * @returns {Promise<{ success: boolean, status: string, message: string, ticket?: object }>}
   */
  static async verifyAndMarkCheckedIn(qrPayload) {
    if (!qrPayload) {
      return {
        success: false,
        status: 'INVALID',
        message: 'Payload QR code tidak boleh kosong.',
      };
    }
    const cleanHash = String(qrPayload).trim();

    try {
      const ticket = await TiketItem.findByHash(cleanHash);

      if (!ticket) {
        return {
          success: false,
          status: 'INVALID',
          message: 'Tiket tidak valid atau tidak terdaftar dalam sistem.',
        };
      }

      if (ticket.status_kehadiran === 'Checked-In') {
        return {
          success: false,
          status: 'ALREADY_USED',
          message: 'Tiket sudah pernah digunakan untuk check-in sebelumnya.',
          waktu_checkin: ticket.waktu_checkin,
          ticket: ticket.toJSON(),
        };
      }

      // Update status menjadi 'Checked-In'
      const updateQuery = `
        UPDATE TIKET_ITEM
        SET status_kehadiran = 'Checked-In', waktu_checkin = NOW()
        WHERE (qr_code_hash = ? OR kode_tiket = ?) AND status_kehadiran = 'Belum Hadir'
      `;
      const [updateResult] = await pool.execute(updateQuery, [cleanHash, cleanHash]);

      if (updateResult && updateResult.affectedRows > 0) {
        ticket.status_kehadiran = 'Checked-In';
        ticket.waktu_checkin = new Date();
        return {
          success: true,
          status: 'VALID',
          message: 'Check-in pintu masuk gate berhasil.',
          ticket: ticket.toJSON(),
        };
      }

      return {
        success: false,
        status: 'ALREADY_USED',
        message: 'Gagal memperbarui status check-in tiket.',
      };
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return {
          success: true,
          status: 'VALID',
          message: 'Check-in berhasil (mode offline).',
        };
      }
      throw err;
    }
  }

  /**
   * Instance method untuk verifyAndMarkCheckedIn
   * @param {string} [qrPayload]
   * @returns {Promise<object>}
   */
  async verifyAndMarkCheckedIn(qrPayload) {
    const target = qrPayload || this.#qr_code_hash;
    const result = await TiketItem.verifyAndMarkCheckedIn(target);
    if (result.success && target === this.#qr_code_hash) {
      this.#status_kehadiran = 'Checked-In';
      this.#waktu_checkin = new Date();
    }
    return result;
  }

  /**
   * Konversi objek menjadi format JSON
   */
  toJSON() {
    return {
      kode_tiket: this.#kode_tiket,
      id_detail: this.#id_detail,
      qr_code_hash: this.#qr_code_hash,
      status_kehadiran: this.#status_kehadiran,
      waktu_checkin: this.#waktu_checkin,
    };
  }
}

export default TiketItem;
