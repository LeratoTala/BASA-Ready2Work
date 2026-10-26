import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../config/app';
import { loadStored, saveStored } from '../services/localStorage';
import { detectOSColorScheme, updateOSStatusBarTheme } from '../shared/utils/osOperations';

export type ColorTheme = 'light' | 'dark';

export function normalizeColorTheme(value: unknown): ColorTheme {
  return value === 'dark' ? 'dark' : 'light';
}

function loadColorTheme(): ColorTheme {
  const stored = loadStored<unknown>(STORAGE_KEYS.colorTheme, null);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return detectOSColorScheme();
}

export function useColorTheme() {
  const [theme, setTheme] = useState<ColorTheme>(loadColorTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveStored(STORAGE_KEYS.colorTheme, theme);
    updateOSStatusBarTheme(theme);
  }, [theme]);

  // Sync with OS theme changes if user has not set a different preference in storage
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOSThemeChange = (e: MediaQueryListEvent) => {
      const stored = loadStored<unknown>(STORAGE_KEYS.colorTheme, null);
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener?.('change', handleOSThemeChange);
    return () => mediaQuery.removeEventListener?.('change', handleOSThemeChange);
  }, []);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
}
