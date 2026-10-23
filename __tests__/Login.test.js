/**
 * ============================================================================
 * MODUL          : Unit Test Halaman Login (Login.test.js)
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL KF-01 (Pengujian Antarmuka Login)
 * PENGEMBANG     : Ryan Akeyla Novianto Widodo (103112400081) - QA & Testing
 * DESKRIPSI      : Pengujian rendering elemen form login (username, password, tombol submit)
 *                  menggunakan React Testing Library.
 * ============================================================================
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/login/page';

describe('LoginPage Component', () => {
  it('harus merender judul dan field input login', () => {
    render(<LoginPage />);

    expect(
      screen.getByRole('heading', { name: /Stand-Up Comedy PoS/i })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Masuk ke Sistem/i })
    ).toBeInTheDocument();
  });
});
