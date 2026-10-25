import { createRoot } from 'react-dom/client';
import { envErrors } from '../config/env';
import './index.css';

// Register the service worker for offline shell caching and PWA install support.
// Only active in production (Vite dev server handles requests differently).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Non-fatal: app works without the service worker.
      console.warn('Service worker registration failed:', err);
    });
  });
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');
const root = createRoot(container);

if (envErrors.length > 0) {
  // Fail loudly and helpfully instead of rendering a broken app.
  root.render(
    <main className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
      <div className="max-w-lg bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-lg font-bold text-stone-900 mb-2">Configuration required</h1>
        <p className="text-sm text-stone-600 mb-3">This build is missing required settings:</p>
        <ul className="list-disc pl-5 text-sm text-stone-700 space-y-1">
          {envErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    </main>
  );
} else {
  // Load the app only when configuration is valid (Firebase initialises on import).
  import('./App').then(({ default: App }) => root.render(<App />));
}
