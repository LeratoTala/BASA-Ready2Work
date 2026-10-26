/**
 * Operating System detection, hardware button integrations, and native operation features.
 * Supports Android, iOS, Windows, macOS, and Linux conventions (Back button, Esc key, Haptics, Share sheet).
 */

export type OperatingSystem = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'other';

export interface OSFeatures {
  os: OperatingSystem;
  isMobile: boolean;
  modifierKey: string;
  backKeyLabel: string;
  hasHaptics: boolean;
  hasNativeShare: boolean;
}

/**
 * Detects the client's current Operating System based on user agent and platform.
 */
export function detectOperatingSystem(userAgent?: string, platform?: string): OperatingSystem {
  const ua = (userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  const plat = (platform || (typeof navigator !== 'undefined' ? navigator.platform : '')).toLowerCase();

  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua) || (plat === 'macintel' && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/win/.test(plat) || /windows/.test(ua)) return 'windows';
  if (/mac/.test(plat) || /macintosh/.test(ua)) return 'macos';
  if (/linux/.test(plat) || /linux/.test(ua)) return 'linux';

  return 'other';
}

/**
 * Retrieves the OS-specific modifier key ('⌘' for Apple, 'Ctrl' for Windows/Linux).
 */
export function getOSModifierKey(os?: OperatingSystem): string {
  const targetOS = os || detectOperatingSystem();
  return targetOS === 'macos' || targetOS === 'ios' ? '⌘' : 'Ctrl';
}

/**
 * Friendly label for the OS-specific Back button/gesture.
 */
export function getOSBackLabel(os?: OperatingSystem): string {
  const targetOS = os || detectOperatingSystem();
  switch (targetOS) {
    case 'android':
      return 'Back button / swipe';
    case 'ios':
      return 'Swipe to go back';
    case 'macos':
      return 'Esc / ⌘+[';
    case 'windows':
      return 'Esc / Alt+←';
    default:
      return 'Esc / Back';
  }
}

/**
 * Checks all OS operation capabilities for the current environment.
 */
export function getOSFeatures(): OSFeatures {
  const os = detectOperatingSystem();
  const isMobile = os === 'android' || os === 'ios';
  const hasHaptics = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return {
    os,
    isMobile,
    modifierKey: getOSModifierKey(os),
    backKeyLabel: getOSBackLabel(os),
    hasHaptics,
    hasNativeShare,
  };
}

/**
 * Detects whether the user's Operating System preference is currently Dark or Light mode.
 */
export function detectOSColorScheme(): 'light' | 'dark' {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
}

/**
 * Dynamically updates the browser/OS status bar meta theme color to match the app theme.
 */
export function updateOSStatusBarTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#1c1917' : '#faf8f5');
  }
}

/**
 * Triggers native OS tactile haptic feedback on supported mobile devices.
 * Gracefully silent on unsupported desktop platforms.
 */
export function triggerOSHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light'): boolean {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }

  try {
    switch (type) {
      case 'light':
        return navigator.vibrate(10);
      case 'medium':
        return navigator.vibrate(20);
      case 'success':
        return navigator.vibrate([15, 40, 15]);
      case 'warning':
        return navigator.vibrate([30, 50, 30]);
      default:
        return navigator.vibrate(10);
    }
  } catch {
    return false;
  }
}

/**
 * Triggers the OS-native Web Share sheet (WhatsApp, Messages, Email, AirDrop, Nearby Share)
 * with a fallback to clipboard copying.
 */
export async function triggerOSShare(data: {
  title: string;
  text?: string;
  url?: string;
}): Promise<{ shared: boolean; method: 'native' | 'clipboard' | 'failed' }> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return { shared: true, method: 'native' };
    } catch (err: any) {
      // User cancelled the share dialog
      if (err.name === 'AbortError') {
        return { shared: false, method: 'native' };
      }
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      const copyContent = [data.title, data.text, data.url].filter(Boolean).join('\n');
      await navigator.clipboard.writeText(copyContent);
      return { shared: true, method: 'clipboard' };
    } catch {
      return { shared: false, method: 'failed' };
    }
  }

  return { shared: false, method: 'failed' };
}
