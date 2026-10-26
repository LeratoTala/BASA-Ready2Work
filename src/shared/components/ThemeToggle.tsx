import React from 'react';
import { Moon, Sun } from 'lucide-react';
import type { ColorTheme } from '../../app/useColorTheme';

interface Props {
  theme: ColorTheme;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<Props> = ({ theme, onToggle }) => {
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${nextTheme} mode`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
    >
      {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
};
