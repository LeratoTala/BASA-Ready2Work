import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../config/app';
import { loadStored, saveStored } from '../services/localStorage';

export type ColorTheme = 'light' | 'dark';

export function normalizeColorTheme(value: unknown): ColorTheme {
  return value === 'dark' ? 'dark' : 'light';
}

function loadColorTheme(): ColorTheme {
  const stored = loadStored<unknown>(STORAGE_KEYS.colorTheme, 'light');
  return normalizeColorTheme(stored);
}

export function useColorTheme() {
  const [theme, setTheme] = useState<ColorTheme>(loadColorTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveStored(STORAGE_KEYS.colorTheme, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme };
}
