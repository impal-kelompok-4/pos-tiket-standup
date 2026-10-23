/**
 * ============================================================================
 * MODUL          : TiketItem Entity (TiketItem.js)
 * REFERENSI      : DPPL-01 CLS-05 & SKPL KF-04 (Gate Check-In & Validasi Tiket)
 * PENGEMBANG     : 1. Ariel Ahnaf Kusuma (103112400050) - Logika Validasi QR
 *                  2. Ryan Akeyla Novianto Widodo (103112400081) - QA Verifikasi Check-In
 * DESKRIPSI      : Skeleton class OOP entitas TiketItem dengan private attributes (#),
 *                  getter/setter, dan signature method verifikasi check-in gate.
 * ============================================================================
 */

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
    this.#kode_tiket = kode_tiket;
    this.#id_detail = id_detail;
    this.#qr_code_hash = qr_code_hash;
    this.#status_kehadiran = status_kehadiran;
    this.#waktu_checkin = waktu_checkin;
  }

  // --- GETTER & SETTER ---
  get kode_tiket() {
    return this.#kode_tiket;
  }

  set kode_tiket(value) {
    this.#kode_tiket = value;
  }

  get id_detail() {
    return this.#id_detail;
  }

  set id_detail(value) {
    this.#id_detail = value;
  }

  get qr_code_hash() {
    return this.#qr_code_hash;
  }

  set qr_code_hash(value) {
    this.#qr_code_hash = value;
  }

  get status_kehadiran() {
    return this.#status_kehadiran;
  }

  set status_kehadiran(value) {
    this.#status_kehadiran = value;
  }

  get waktu_checkin() {
    return this.#waktu_checkin;
  }

  set waktu_checkin(value) {
    this.#waktu_checkin = value;
  }

  // --- METHOD SIGNATURES ---

  /**
   * Memvalidasi kode hash QR dan mengubah status kehadiran menjadi 'Checked-In'
   * @param {string} qrPayload
   */
  async verifyAndMarkCheckedIn(qrPayload) {
    // Method signature kosong sesuai ketentuan skeleton class
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
