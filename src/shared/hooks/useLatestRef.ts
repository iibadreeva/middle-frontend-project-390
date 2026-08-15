import { useRef, type MutableRefObject } from 'react';

/**
 * Ref, всегда указывающий на последнее значение.
 * Стабильная identity — удобно для registerOptions / resolver без пересоздания.
 */
export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  // eslint-disable-next-line react-hooks/refs -- sync render; consumers read .current later
  ref.current = value;
  return ref;
}
