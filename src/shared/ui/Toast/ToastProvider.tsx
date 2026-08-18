import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './Toast.module.css';
import { toast as toastBus, type ToastErrorOptions } from '@shared/lib/toast';

export const TOAST_DURATION_MS = 5000;
export const TOAST_MAX_VISIBLE = 3;

type ToastItem = {
  id: number;
  message: string;
  tag?: string;
};

type ToastApi = {
  error: (message: string, options?: ToastErrorOptions) => void;
  /** Снимает toast с указанным tag (чужие не трогает). */
  dismiss: (tag: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

type ToastProviderProps = {
  children: ReactNode;
};

type ToastItemViewProps = {
  toast: ToastItem;
  onDismiss: (id: number) => void;
};

function ToastItemView({ toast, onDismiss }: ToastItemViewProps) {
  const remainingMsRef = useRef(TOAST_DURATION_MS);
  const endsAtRef = useRef(0);
  const timeoutRef = useRef<number | undefined>(undefined);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const pausedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    endsAtRef.current = Date.now() + remainingMsRef.current;
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = undefined;
      onDismiss(toast.id);
    }, remainingMsRef.current);
  }, [clearTimer, onDismiss, toast.id]);

  const pauseTimer = useCallback(() => {
    if (pausedRef.current) {
      return;
    }
    pausedRef.current = true;
    remainingMsRef.current = Math.max(0, endsAtRef.current - Date.now());
    clearTimer();
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (!pausedRef.current) {
      return;
    }
    if (hoverRef.current || focusRef.current) {
      return;
    }
    pausedRef.current = false;
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  return (
    <div
      className={styles.item}
      data-testid="toast-item"
      data-toast-tag={toast.tag}
      role="alert"
      onMouseEnter={() => {
        hoverRef.current = true;
        pauseTimer();
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
        resumeTimer();
      }}
      onFocus={() => {
        focusRef.current = true;
        pauseTimer();
      }}
      onBlur={() => {
        focusRef.current = false;
        resumeTimer();
      }}
    >
      <p className={styles.message}>{toast.message}</p>
      <button
        className={styles.dismiss}
        type="button"
        data-testid="toast-dismiss"
        aria-label="Закрыть"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastsRef = useRef(toasts);
  const nextIdRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    const next = toastsRef.current.filter((toast) => toast.id !== id);
    toastsRef.current = next;
    setToasts(next);
  }, []);

  const dismissByTag = useCallback((tag: string) => {
    const next = toastsRef.current.filter((toast) => toast.tag !== tag);
    toastsRef.current = next;
    setToasts(next);
  }, []);

  const dismissAll = useCallback(() => {
    toastsRef.current = [];
    setToasts([]);
  }, []);

  const error = useCallback((message: string, options?: ToastErrorOptions) => {
    nextIdRef.current += 1;
    const id = nextIdRef.current;
    const tag = options?.tag;
    const current =
      tag === undefined
        ? toastsRef.current
        : toastsRef.current.filter((toast) => toast.tag !== tag);
    const next = [...current, { id, message, tag }].slice(-TOAST_MAX_VISIBLE);
    toastsRef.current = next;
    setToasts(next);
  }, []);

  const api = useMemo(
    () => ({ error, dismiss: dismissByTag, dismissAll }),
    [error, dismissByTag, dismissAll],
  );

  useEffect(() => {
    return toastBus.subscribe((event) => {
      if (event.type === 'error') {
        error(
          event.message,
          event.tag === undefined ? undefined : { tag: event.tag },
        );
        return;
      }
      if (event.type === 'dismiss') {
        dismissByTag(event.tag);
        return;
      }
      dismissAll();
    });
  }, [error, dismissByTag, dismissAll]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.viewport} data-testid="toast-viewport">
        {toasts.map((toast) => (
          <ToastItemView key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
