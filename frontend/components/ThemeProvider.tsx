'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export const THEME_STORAGE_KEY = 'surinhos:theme';
export const LEGACY_DARK_MODE_STORAGE_KEY = 'darkMode';

export type ThemePalette = 'indigo' | 'emerald' | 'blue' | 'slate' | 'purple' | 'teal';
export type ThemeMode = 'light' | 'dark';

export interface ThemeTokens {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  sidebarBg: string;
  sidebarText: string;
  buttonBg: string;
  buttonText: string;
  badgeBg: string;
  badgeText: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  focus: string;
}

export interface ThemeDefinition {
  key: ThemePalette;
  name: string;
  description: string;
  tokens: ThemeTokens;
}

interface ThemeContextValue {
  palette: ThemePalette;
  mode: ThemeMode;
  theme: ThemeDefinition;
  themes: readonly ThemeDefinition[];
  isDark: boolean;
  setPalette: (palette: ThemePalette) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setTheme: (palette: ThemePalette, mode?: ThemeMode) => void;
}

interface StoredThemePreference {
  palette?: ThemePalette;
  mode?: ThemeMode;
}

const sharedStatusTokens = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  focus: '#14b8a6',
};

const darkSurfaceTokens = {
  background: '#111827',
  surface: '#1f2937',
  surfaceMuted: '#374151',
  text: '#f3f4f6',
  textMuted: '#9ca3af',
  border: '#374151',
  focus: '#2dd4bf',
};

const paletteDefinitions: Array<Omit<ThemeDefinition, 'tokens'> & { tokens: Omit<ThemeTokens, keyof typeof sharedStatusTokens> }> = [
  {
    key: 'indigo',
    name: 'Indigo Professional',
    description: 'ทันสมัย ดูเป็นมืออาชีพ เหมาะกับระบบ IT',
    tokens: {
      primary: '#4f46e5',
      primaryLight: '#eef2ff',
      primaryDark: '#3730a3',
      accent: '#6366f1',
      sidebarBg: '#ffffff',
      sidebarText: '#4f46e5',
      buttonBg: '#4f46e5',
      buttonText: '#ffffff',
      badgeBg: '#dbeafe',
      badgeText: '#1e40af',
    },
  },
  {
    key: 'emerald',
    name: 'Emerald Official',
    description: 'โทนเขียวราชการ ดูน่าเชื่อถือ เหมาะกับหน่วยงานรัฐ',
    tokens: {
      primary: '#059669',
      primaryLight: '#ecfdf5',
      primaryDark: '#065f46',
      accent: '#10b981',
      sidebarBg: '#ffffff',
      sidebarText: '#059669',
      buttonBg: '#059669',
      buttonText: '#ffffff',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
    },
  },
  {
    key: 'blue',
    name: 'Blue Corporate',
    description: 'น้ำเงินคลาสสิก ดูน่าเชื่อถือ เหมาะกับองค์กร',
    tokens: {
      primary: '#2563eb',
      primaryLight: '#eff6ff',
      primaryDark: '#1e40af',
      accent: '#3b82f6',
      sidebarBg: '#ffffff',
      sidebarText: '#2563eb',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
      badgeBg: '#dbeafe',
      badgeText: '#1e40af',
    },
  },
  {
    key: 'slate',
    name: 'Slate Minimal',
    description: 'เทาเข้มเรียบหรู ดูโมเดิร์น ไม่ฉูดฉาด',
    tokens: {
      primary: '#374151',
      primaryLight: '#f9fafb',
      primaryDark: '#111827',
      accent: '#6b7280',
      sidebarBg: '#111827',
      sidebarText: '#e5e7eb',
      buttonBg: '#374151',
      buttonText: '#ffffff',
      badgeBg: '#f3f4f6',
      badgeText: '#374151',
    },
  },
  {
    key: 'purple',
    name: 'Purple Creative',
    description: 'ม่วงสร้างสรรค์ ดูทันสมัยและโดดเด่น',
    tokens: {
      primary: '#9333ea',
      primaryLight: '#faf5ff',
      primaryDark: '#581c87',
      accent: '#a855f7',
      sidebarBg: '#ffffff',
      sidebarText: '#9333ea',
      buttonBg: '#9333ea',
      buttonText: '#ffffff',
      badgeBg: '#f3e8ff',
      badgeText: '#581c87',
    },
  },
  {
    key: 'teal',
    name: 'Teal Fresh',
    description: 'เขียวอมฟ้า สดชื่น สะอาดตา ทันสมัย',
    tokens: {
      primary: '#0d9488',
      primaryLight: '#f0fdfa',
      primaryDark: '#115e59',
      accent: '#14b8a6',
      sidebarBg: '#ffffff',
      sidebarText: '#0d9488',
      buttonBg: '#0d9488',
      buttonText: '#ffffff',
      badgeBg: '#ccfbf1',
      badgeText: '#115e59',
    },
  },
];

export const THEME_DEFINITIONS: readonly ThemeDefinition[] = paletteDefinitions.map((definition) => ({
  ...definition,
  tokens: {
    ...definition.tokens,
    ...sharedStatusTokens,
  },
}));

const themeMap = new Map(THEME_DEFINITIONS.map((theme) => [theme.key, theme]));

function isThemePalette(value: unknown): value is ThemePalette {
  return typeof value === 'string' && themeMap.has(value as ThemePalette);
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function readStoredPreference(): StoredThemePreference {
  if (typeof window === 'undefined') return {};

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        const value = parsed as Record<string, unknown>;
        return {
          palette: isThemePalette(value.palette) ? value.palette : undefined,
          mode: isThemeMode(value.mode) ? value.mode : undefined,
        };
      }
    }
  } catch {
    // Ignore invalid or unavailable localStorage and use defaults.
  }

  // Backward compatibility with the previous dark-mode implementation.
  try {
    return {
      mode: window.localStorage.getItem(LEGACY_DARK_MODE_STORAGE_KEY) === 'true' ? 'dark' : undefined,
    };
  } catch {
    return {};
  }
}

function applyThemeToDocument(theme: ThemeDefinition, mode: ThemeMode) {
  const root = document.documentElement;
  const tokens = mode === 'dark' ? { ...theme.tokens, ...darkSurfaceTokens } : theme.tokens;

  root.classList.toggle('dark', mode === 'dark');
  root.dataset.colorTheme = theme.key;
  root.dataset.themeMode = mode;

  const cssVariables: Record<string, string> = {
    '--theme-primary': tokens.primary,
    '--theme-primary-light': tokens.primaryLight,
    '--theme-primary-dark': tokens.primaryDark,
    '--theme-accent': tokens.accent,
    '--theme-sidebar-bg': mode === 'dark' ? darkSurfaceTokens.surface : tokens.sidebarBg,
    '--theme-sidebar-text': mode === 'dark' ? darkSurfaceTokens.text : tokens.sidebarText,
    '--theme-button-bg': tokens.buttonBg,
    '--theme-button-text': tokens.buttonText,
    '--theme-badge-bg': tokens.badgeBg,
    '--theme-badge-text': tokens.badgeText,
    '--theme-background': tokens.background,
    '--theme-surface': tokens.surface,
    '--theme-surface-muted': tokens.surfaceMuted,
    '--theme-text': tokens.text,
    '--theme-text-muted': tokens.textMuted,
    '--theme-border': tokens.border,
    '--theme-focus': tokens.focus,
  };

  Object.entries(cssVariables).forEach(([name, value]) => root.style.setProperty(name, value));
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<ThemePalette>('teal');
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);

  const theme = themeMap.get(palette) ?? themeMap.get('teal')!;

  useEffect(() => {
    const stored = readStoredPreference();
    const frameId = window.requestAnimationFrame(() => {
      if (stored.palette) setPaletteState(stored.palette);
      if (stored.mode) setModeState(stored.mode);
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const selectedTheme = themeMap.get(palette) ?? themeMap.get('teal')!;
    applyThemeToDocument(selectedTheme, mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ palette, mode }));
    // Keep the legacy key synchronized for any code still reading it.
    window.localStorage.setItem(LEGACY_DARK_MODE_STORAGE_KEY, String(mode === 'dark'));
  }, [isReady, mode, palette]);

  const setPalette = useCallback((nextPalette: ThemePalette) => {
    if (themeMap.has(nextPalette)) setPaletteState(nextPalette);
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((currentMode) => (currentMode === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((nextPalette: ThemePalette, nextMode?: ThemeMode) => {
    if (!themeMap.has(nextPalette)) return;
    setPaletteState(nextPalette);
    if (nextMode) setModeState(nextMode);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    palette,
    mode,
    theme,
    themes: THEME_DEFINITIONS,
    isDark: mode === 'dark',
    setPalette,
    setMode,
    toggleMode,
    setTheme,
  }), [mode, palette, setMode, setPalette, setTheme, theme, toggleMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme ต้องถูกเรียกใช้ภายใน ThemeProvider');
  }
  return context;
}
