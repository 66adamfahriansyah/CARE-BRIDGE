import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useToast } from './ToastContext';

export const SCREENING_DRAFT_KEY = 'cb_screening_draft_v1';
export const SCREENING_RESULT_KEY = 'cb_screening_result_v1';
export const ASSISTANT_CHAT_KEY = 'cb_assistant_history_v1';
const KIOSK_MODE_KEY = 'cb_kiosk_mode_enabled';

const KIOSK_TIMEOUT_SECONDS = 180; // 3 menit tanpa aktivitas pada perangkat kiosk bersama

interface KioskContextValue {
  kioskMode: boolean;
  toggleKioskMode: () => void;
  setKioskMode: (enabled: boolean) => void;
  secondsRemaining: number;
  clearPublicSession: (options?: { onCleared?: () => void }) => void;
}

const KioskContext = createContext<KioskContextValue | null>(null);

export function KioskProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [kioskMode, setKioskModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KIOSK_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(KIOSK_TIMEOUT_SECONDS);
  const lastActivityRef = useRef<number>(Date.now());

  const setKioskMode = useCallback((enabled: boolean) => {
    setKioskModeState(enabled);
    lastActivityRef.current = Date.now();
    setSecondsRemaining(KIOSK_TIMEOUT_SECONDS);
    try {
      localStorage.setItem(KIOSK_MODE_KEY, String(enabled));
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleKioskMode = useCallback(() => {
    setKioskMode(!kioskMode);
  }, [kioskMode, setKioskMode]);

  const clearPublicSession = useCallback(
    (options?: { onCleared?: () => void }) => {
      try {
        sessionStorage.removeItem(SCREENING_DRAFT_KEY);
        sessionStorage.removeItem(SCREENING_RESULT_KEY);
        sessionStorage.removeItem(ASSISTANT_CHAT_KEY);
      } catch {
        // ignore storage errors
      }
      lastActivityRef.current = Date.now();
      setSecondsRemaining(KIOSK_TIMEOUT_SECONDS);
      window.dispatchEvent(new CustomEvent('cb:session-cleared'));
      showToast('Sesi layar sementara berhasil dibersihkan', {
        description:
          'Jawaban skrining sementara, tampilan hasil, dan riwayat chat di browser ini telah dihapus. Permintaan yang sudah dikirim tetap tersimpan di server prototipe.',
        variant: 'info',
      });
      options?.onCleared?.();
    },
    [showToast],
  );

  // Sync body class for larger kiosk touchscreen ergonomics
  useEffect(() => {
    if (kioskMode) {
      document.documentElement.classList.add('cb-kiosk-mode');
    } else {
      document.documentElement.classList.remove('cb-kiosk-mode');
    }
  }, [kioskMode]);

  // Real inactivity timer in kiosk mode
  useEffect(() => {
    if (!kioskMode) return;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    for (const ev of events) {
      window.addEventListener(ev, resetTimer, { passive: true });
    }

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, KIOSK_TIMEOUT_SECONDS - elapsed);
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        clearPublicSession();
      }
    }, 1000);

    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, resetTimer);
      }
      window.clearInterval(interval);
    };
  }, [kioskMode, clearPublicSession]);

  return (
    <KioskContext.Provider
      value={{
        kioskMode,
        toggleKioskMode,
        setKioskMode,
        secondsRemaining,
        clearPublicSession,
      }}
    >
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const ctx = useContext(KioskContext);
  if (!ctx) throw new Error('useKiosk must be used inside KioskProvider');
  return ctx;
}
