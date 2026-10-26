import { useEffect, useRef } from 'react';
import { triggerOSHaptic, detectOperatingSystem } from '../utils/osOperations';

interface UseOSModalNavigationOptions {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  enableEscapeKey?: boolean;
  enableBackButton?: boolean;
  enableHaptics?: boolean;
}

/**
 * Connects React modals and sheets to native Operating System operation buttons:
 * 1. Android / iOS / Browser hardware & gesture Back button (via history popstate)
 * 2. Desktop OS Escape key (Windows, macOS, Linux)
 * 3. Mobile OS tactile haptics on open / dismiss
 * 4. Background scroll lock for smooth OS feel
 */
export function useOSModalNavigation({
  isOpen,
  onClose,
  modalId = 'modal',
  enableEscapeKey = true,
  enableBackButton = true,
  enableHaptics = true,
}: UseOSModalNavigationOptions) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    if (enableHaptics) {
      triggerOSHaptic('light');
    }

    // Lock background scrolling for native OS modal feel
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 1. Hook into OS Keyboard: Escape key to dismiss
    const handleKeyDown = (e: KeyboardEvent) => {
      if (enableEscapeKey && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (enableHaptics) triggerOSHaptic('light');
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 2. Hook into OS Hardware Back button & browser history
    if (enableBackButton && typeof window !== 'undefined') {
      const stateKey = `modal_${modalId}_${Date.now()}`;
      window.history.pushState({ modalOpen: true, stateKey }, '');
      isPushedRef.current = true;

      const handlePopState = (e: PopStateEvent) => {
        // User tapped device / OS back button or gesture
        if (isPushedRef.current) {
          isPushedRef.current = false;
          if (enableHaptics) triggerOSHaptic('light');
          onCloseRef.current();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('popstate', handlePopState);

        // If closed via on-screen button rather than back button, clean up history state
        if (isPushedRef.current) {
          isPushedRef.current = false;
          try {
            window.history.back();
          } catch {
            // Safe fallback
          }
        }
      };
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, modalId, enableEscapeKey, enableBackButton, enableHaptics]);
}
