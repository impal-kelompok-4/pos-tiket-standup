/**
 * ============================================================================
 * MODUL          : Root Layout (layout.js)
 * REFERENSI      : DPPL-01 Bab 2.3 & SKPL (Overview Aplikasi Stand-Up Comedy)
 * PENGEMBANG     : Keishin Naufa Alfaridzhi - 103112400061 (Lead UI/UX & Frontend)
 * DESKRIPSI      : Root layout pembungkus aplikasi dengan metadata resmi
 *                  sistem tiket dan PoS Stand-Up Comedy ("Tiket.").
 * ============================================================================
 */

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tiket. - Sistem Pemesanan Tiket Stand-Up Comedy",
  description:
    "Platform Kasir PoS Cepat & Pemesanan Tiket Mandiri Daring Stand-Up Comedy Night - Tubes ImPal Kelompok 4",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
