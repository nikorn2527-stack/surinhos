'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme, type ThemeMode, type ThemePalette } from '@/components/ThemeProvider';

interface ThemePickerProps {
  /** เรียกใช้เมื่อผู้ใช้กดบันทึกธีม */
  onSaved?: (palette: ThemePalette, mode: ThemeMode) => void;
  /** เรียกใช้เมื่อผู้ใช้กดยกเลิก */
  onCancel?: () => void;
  /** ซ่อนปุ่มยกเลิกเมื่อใช้เป็นส่วนหนึ่งของหน้า Settings */
  showCancel?: boolean;
  className?: string;
}

const swatchKeys = ['primary', 'accent', 'primaryLight', 'badgeBg'] as const;

function ThemePreview({ palette, mode }: { palette: ThemePalette; mode: ThemeMode }) {
  const { themes } = useTheme();
  const previewTheme = themes.find((item) => item.key === palette) ?? themes[0];
  const { tokens } = previewTheme;
  const isDark = mode === 'dark';

  return (
    <div
      className="overflow-hidden rounded-xl border shadow-sm"
      style={{
        backgroundColor: isDark ? '#111827' : '#f8fafc',
        borderColor: isDark ? '#374151' : '#e5e7eb',
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb',
        }}
      >
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-auto text-[10px]" style={{ color: tokens.textMuted }}>
          Preview
        </span>
      </div>

      <div className="flex min-h-[260px]">
        <div
          className="hidden w-28 shrink-0 space-y-2 p-3 sm:block"
          style={{ backgroundColor: isDark ? '#1f2937' : tokens.sidebarBg }}
        >
          <div className="mb-5 h-2 w-16 rounded" style={{ backgroundColor: tokens.primary }} />
          {['ภาพรวม', 'ครุภัณฑ์', 'ตรวจนับ', 'ตั้งค่า'].map((label, index) => (
            <div
              key={label}
              className="rounded-md px-2 py-1.5 text-[10px]"
              style={{
                backgroundColor: index === 0 ? tokens.primaryLight : 'transparent',
                color: index === 0 ? tokens.primaryDark : tokens.textMuted,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: tokens.text }}>
              ภาพรวม
            </span>
            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: tokens.primaryLight }} />
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {['ครุภัณฑ์ทั้งหมด', 'ใช้งานอยู่', 'รอตรวจนับ', 'แจ้งซ่อม'].map((label, index) => (
              <div
                key={label}
                className="rounded-lg p-2"
                style={{ backgroundColor: index === 0 ? tokens.primary : isDark ? '#374151' : '#ffffff' }}
              >
                <div
                  className="mb-1 text-[9px]"
                  style={{ color: index === 0 ? '#ffffff' : tokens.textMuted }}
                >
                  {label}
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: index === 0 ? '#ffffff' : tokens.text }}
                >
                  {[1248, 982, 156, 110][index].toLocaleString('th-TH')}
                </div>
              </div>
            ))}
          </div>
          <div
            className="space-y-2 rounded-lg border p-2"
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }}
          >
            <div className="h-2 w-24 rounded" style={{ backgroundColor: tokens.text }} />
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="h-1.5 flex-1 rounded" style={{ backgroundColor: isDark ? '#4b5563' : '#e5e7eb' }} />
                <span className="h-3 w-10 rounded" style={{ backgroundColor: tokens.badgeBg }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemePicker({
  onSaved,
  onCancel,
  showCancel = true,
  className = '',
}: ThemePickerProps) {
  const { palette, mode, themes, setTheme } = useTheme();
  const [draftPalette, setDraftPalette] = useState<ThemePalette>(palette);
  const [draftMode, setDraftMode] = useState<ThemeMode>(mode);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setDraftPalette(palette);
      setDraftMode(mode);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [mode, palette]);

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.key === draftPalette) ?? themes[0],
    [draftPalette, themes],
  );

  const handleSave = () => {
    setTheme(draftPalette, draftMode);
    onSaved?.(draftPalette, draftMode);
  };

  const handleCancel = () => {
    setDraftPalette(palette);
    setDraftMode(mode);
    onCancel?.();
  };

  return (
    <section className={`grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] ${className}`}>
      <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">เลือกธีมสี</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ปรับโทนสีให้เหมาะกับการใช้งาน</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const isSelected = draftPalette === theme.key;

            return (
              <button
                key={theme.key}
                type="button"
                onClick={() => setDraftPalette(theme.key)}
                aria-pressed={isSelected}
                className={`relative rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isSelected
                    ? 'shadow-md'
                    : 'border-gray-200 dark:border-gray-600 dark:bg-gray-800'
                }`}
                style={isSelected ? {
                  borderColor: theme.tokens.primary,
                  backgroundColor: theme.tokens.primaryLight,
                  ['--tw-ring-color' as string]: theme.tokens.focus,
                } : undefined}
              >
                {isSelected && (
                  <span
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: theme.tokens.primary }}
                    aria-label="ธีมที่เลือกอยู่"
                  >
                    ✓
                  </span>
                )}

                <div className="mb-4 flex gap-2" aria-hidden="true">
                  {swatchKeys.map((key) => (
                    <span
                      key={key}
                      className="h-6 w-6 rounded-full border border-black/5"
                      style={{ backgroundColor: theme.tokens[key] }}
                    />
                  ))}
                </div>
                <div className="font-bold" style={{ color: isSelected ? theme.tokens.primaryDark : undefined }}>
                  <span className="text-gray-900 dark:text-gray-100">{theme.name.split(' ')[0]}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {theme.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

        <div>
          <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">โหมดการแสดงผล</h3>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600">
            {([
              ['light', '☀', 'โหมดสว่าง'],
              ['dark', '☾', 'โหมดมืด'],
            ] as const).map(([value, icon, label]) => {
              const isSelected = draftMode === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDraftMode(value)}
                  aria-pressed={isSelected}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors"
                  style={isSelected ? {
                    backgroundColor: selectedTheme.tokens.primaryLight,
                    color: selectedTheme.tokens.primaryDark,
                  } : undefined}
                >
                  <span className="text-xl" aria-hidden="true">{icon}</span>
                  {label}
                  {isSelected && (
                    <span
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
                      style={{ backgroundColor: selectedTheme.tokens.primary }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {showCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              ยกเลิก
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: selectedTheme.tokens.primary,
              ['--tw-ring-color' as string]: selectedTheme.tokens.focus,
            }}
          >
            บันทึกธีม
          </button>
        </div>
      </div>

      <aside className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">ตัวอย่างการแสดงผล</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Preview: {selectedTheme.name} · {draftMode === 'dark' ? 'Dark' : 'Light'}
          </p>
        </div>
        <ThemePreview palette={draftPalette} mode={draftMode} />
        <p className="mt-3 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
          * ตัวอย่างนี้แสดงโครงสร้างหน้าจอเพื่อประกอบการเลือกธีมเท่านั้น
        </p>
      </aside>
    </section>
  );
}
