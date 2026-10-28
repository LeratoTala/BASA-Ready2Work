import React, { Suspense } from 'react';
import { useAppMode } from './appMode';
import { StartScreen } from '../features/start/StartScreen';
import { env } from '../config/env';
import { useColorTheme } from './useColorTheme';

const DemoApp = React.lazy(() => import('./DemoApp'));
const RealApp = React.lazy(() => import('./RealApp'));

function LoadingFallback() {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-stone-950 text-stone-500 text-sm font-sans"
      role="status"
    >
      Loading…
    </main>
  );
}

export default function App() {
  const { mode, setMode, clearMode } = useAppMode();
  const { theme, toggleTheme } = useColorTheme();

  // If no runtime mode selected, render the dual-path Start Screen
  if (!mode) {
    return (
      <StartScreen
        onSelectMode={setMode}
        isFirebaseConfigured={env.isFirebaseConfigured}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Load only the chosen mode chunk via Suspense
  return (
    <Suspense fallback={<LoadingFallback />}>
      {mode === 'demo' ? (
        <DemoApp onBackToStart={clearMode} />
      ) : (
        <RealApp onBackToStart={clearMode} />
      )}
    </Suspense>
  );
}
