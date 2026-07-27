import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// สามารถแก้ title ตรงนี้ให้เป็นชื่อระบบของคุณได้เลยครับ
export const metadata: Metadata = {
  title: "ระบบบริหารจัดการครุภัณฑ์",
  description: "Asset Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="corporate">
      {/* แก้ไขบรรทัดนี้เพื่อเรียกใช้ฟอนต์ Geist ที่ประกาศไว้ด้านบน */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}