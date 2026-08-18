export type ToastErrorOptions = {
  /** Группа уведомлений; повторный error с тем же tag заменяет предыдущий. */
  tag?: string;
};

export type ToastEvent =
  | { type: 'error'; message: string; tag?: string }
  | { type: 'dismiss'; tag: string }
  | { type: 'dismissAll' };

export type ToastListener = (event: ToastEvent) => void;

const listeners = new Set<ToastListener>();
let pending: ToastEvent[] = [];

function applyToQueue(event: ToastEvent): void {
  if (event.type === 'dismissAll') {
    pending = [];
    return;
  }
  if (event.type === 'dismiss') {
    pending = pending.filter(
      (item) => !(item.type === 'error' && item.tag === event.tag),
    );
    return;
  }
  if (event.tag !== undefined) {
    pending = pending.filter(
      (item) => !(item.type === 'error' && item.tag === event.tag),
    );
  }
  pending.push(event);
  if (pending.length > 8) {
    pending = pending.slice(-8);
  }
}

function emit(event: ToastEvent): void {
  if (listeners.size === 0) {
    applyToQueue(event);
    return;
  }
  for (const listener of listeners) {
    listener(event);
  }
}

export const toast = {
  error(message: string, options?: ToastErrorOptions): void {
    emit({ type: 'error', message, tag: options?.tag });
  },
  dismiss(tag: string): void {
    emit({ type: 'dismiss', tag });
  },
  dismissAll(): void {
    emit({ type: 'dismissAll' });
  },
  subscribe(listener: ToastListener): () => void {
    listeners.add(listener);
    const queued = pending;
    pending = [];
    for (const event of queued) {
      listener(event);
    }
    return () => {
      listeners.delete(listener);
    };
  },
};
