import { useState, useEffect, useCallback } from 'react';

export type AppMode = 'demo' | 'real' | null;

export const RUNTIME_MODE_STORAGE_KEY = 'basa_runtime_mode';

export function getStoredRuntimeMode(): AppMode {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(RUNTIME_MODE_STORAGE_KEY);
    if (val === 'demo' || val === 'real') return val;
    return null;
  } catch {
    return null;
  }
}

export function setStoredRuntimeMode(mode: 'demo' | 'real'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RUNTIME_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredRuntimeMode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RUNTIME_MODE_STORAGE_KEY);
  } catch {
    // Ignore storage quota errors
  }
}

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(() => getStoredRuntimeMode());

  const setMode = useCallback((newMode: 'demo' | 'real') => {
    setStoredRuntimeMode(newMode);
    setModeState(newMode);
  }, []);

  const clearMode = useCallback(() => {
    clearStoredRuntimeMode();
    setModeState(null);
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === RUNTIME_MODE_STORAGE_KEY) {
        setModeState(getStoredRuntimeMode());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { mode, setMode, clearMode };
}
