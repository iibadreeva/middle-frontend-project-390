/**
 * Склеивает AbortSignal без AbortSignal.any (Safari < 17.4).
 * Прерывание любого источника прерывает результат с тем же reason.
 * Вызывайте `dispose()` после завершения fetch, чтобы снять слушатели.
 */
export type MergedAbortSignal = {
  signal: AbortSignal;
  dispose: () => void;
};

export function mergeAbortSignals(
  ...signals: Array<AbortSignal | undefined>
): MergedAbortSignal | undefined {
  const active = signals.filter((signal): signal is AbortSignal => Boolean(signal));

  if (active.length === 0) {
    return undefined;
  }

  if (active.length === 1) {
    return { signal: active[0], dispose: () => {} };
  }

  const controller = new AbortController();

  const onAbort = (event: Event) => {
    const source = event.target as AbortSignal;
    if (!controller.signal.aborted) {
      controller.abort(source.reason);
    }
  };

  const dispose = () => {
    for (const signal of active) {
      signal.removeEventListener('abort', onAbort);
    }
  };

  for (const signal of active) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return { signal: controller.signal, dispose: () => {} };
    }
    signal.addEventListener('abort', onAbort);
  }

  controller.signal.addEventListener('abort', dispose, { once: true });

  return { signal: controller.signal, dispose };
}
