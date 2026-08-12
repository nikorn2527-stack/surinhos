'use client';

import Link from 'next/link';
import { useState } from 'react';
import ThemePicker from '@/components/ThemePicker';
import { useTheme } from '@/components/ThemeProvider';

const settingsLinks = [
  { href: '/settings/theme', label: 'ธีมและการแสดงผล', icon: '🎨' },
  { href: '/settings/organization', label: 'ข้อมูลหน่วยงาน', icon: '🏢' },
  { href: '/settings/users', label: 'ผู้ใช้งาน', icon: '👥' },
  { href: '/settings/permissions', label: 'สิทธิ์การใช้งาน', icon: '🔐' },
];

export default function ThemeSettingsPage() {
  const { palette, mode, themes } = useTheme();
  const [saved, setSaved] = useState(false);
  const activeTheme = themes.find((theme) => theme.key === palette) ?? themes[0];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-5 dark:bg-gray-900 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Link href="/" className="transition-colors hover:text-teal-600">หน้าหลัก</Link>
              <span aria-hidden="true">/</span>
              <span>ตั้งค่าแอปพลิเคชัน</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
              ตั้งค่าแอปพลิเคชัน
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              จัดการรูปแบบการแสดงผลและค่าพื้นฐานของระบบให้เหมาะกับการใช้งานของหน่วยงาน
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 dark:border-teal-900/60 dark:bg-teal-950/30">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-lg dark:bg-teal-900/70" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="text-xs text-teal-700 dark:text-teal-300">ธีมที่ใช้งานอยู่</p>
              <p className="text-sm font-bold text-teal-900 dark:text-teal-100">
                {activeTheme.name} · {mode === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <nav
            aria-label="เมนูตั้งค่าแอปพลิเคชัน"
            className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <p className="px-3 pb-2 pt-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              เมนูตั้งค่า
            </p>
            <div className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">
              {settingsLinks.map((item) => {
                const isActive = item.href === '/settings/theme';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-w-max items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:w-full ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <main className="min-w-0">
            {saved && (
              <div
                role="status"
                className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                <span className="font-bold" aria-hidden="true">✓</span>
                <div>
                  <p className="font-semibold">บันทึกการตั้งค่าธีมแล้ว</p>
                  <p className="mt-0.5 text-xs opacity-80">ธีมใหม่ถูกนำไปใช้กับหน้าจอของคุณเรียบร้อยแล้ว</p>
                </div>
              </div>
            )}

            <ThemePicker
              onSaved={() => setSaved(true)}
              onCancel={() => setSaved(false)}
            />
          </main>
        </div>

        <footer className="mt-6 flex flex-col gap-2 border-t border-gray-200 pt-4 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Surinhos · Settings Mockup</span>
          <span>การตั้งค่าธีมจะถูกบันทึกไว้ในอุปกรณ์นี้</span>
        </footer>
      </div>
    </div>
  );
}
