import {
  useEffect,
  useLayoutEffect,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';
import { useLatestRef } from '@shared/hooks/useLatestRef';
import {
  mergePopoverCoords,
  placePopover,
  POPOVER_FALLBACK_HEIGHT_PX,
  POPOVER_FALLBACK_WIDTH_PX,
} from './calendar';
import { closestBodyChild } from './closestBodyChild';
import type { CalendarView } from './calendarGrid';

type UseCalendarPopoverOptions = {
  open: boolean;
  modal: boolean;
  nativePicker: boolean;
  view: CalendarView;
  cursorYear: number;
  cursorMonth: number;
  focusedIso: string;
  focusGrid: boolean;
  rootRef: RefObject<HTMLDivElement | null>;
  popoverRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  restoreFocusRef: MutableRefObject<boolean>;
  onClose: (restoreInput: boolean) => void;
  onNativePicker: () => void;
  onFocusGridConsumed: () => void;
};

function isInsidePopover(
  target: EventTarget | null,
  root: HTMLElement | null,
  popover: HTMLElement | null,
): boolean {
  const node = target instanceof Node ? target : null;
  return Boolean(root?.contains(node) || popover?.contains(node));
}

/** Закрытие, inert, фокус и позиция попапа — отдельно от разметки инпута. */
export function useCalendarPopover({
  open,
  modal,
  nativePicker,
  view,
  cursorYear,
  cursorMonth,
  focusedIso,
  focusGrid,
  rootRef,
  popoverRef,
  inputRef,
  restoreFocusRef,
  onClose,
  onNativePicker,
  onFocusGridConsumed,
}: UseCalendarPopoverOptions): { top: number; left: number } {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const onCloseRef = useLatestRef(onClose);
  const onNativePickerRef = useLatestRef(onNativePicker);
  const onFocusGridConsumedRef = useLatestRef(onFocusGridConsumed);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (isInsidePopover(event.target, rootRef.current, popoverRef.current)) {
        return;
      }
      onCloseRef.current(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onCloseRef, popoverRef, rootRef]);

  useEffect(() => {
    if (!open || modal) {
      return;
    }

    function onFocusIn(event: FocusEvent) {
      if (restoreFocusRef.current) {
        return;
      }
      if (isInsidePopover(event.target, rootRef.current, popoverRef.current)) {
        return;
      }
      onCloseRef.current(false);
    }

    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [modal, open, onCloseRef, popoverRef, restoreFocusRef, rootRef]);

  useEffect(() => {
    if (!open || !modal) {
      return;
    }

    const shell = closestBodyChild(rootRef.current);
    if (!shell) {
      return;
    }

    shell.inert = true;
    return () => {
      shell.inert = false;
    };
  }, [modal, open, rootRef]);

  useEffect(() => {
    if (open || !restoreFocusRef.current) {
      return;
    }
    restoreFocusRef.current = false;
    inputRef.current?.focus();
  }, [inputRef, open, restoreFocusRef]);

  useEffect(() => {
    if (!nativePicker) {
      return;
    }
    onNativePickerRef.current();
  }, [nativePicker, onNativePickerRef]);

  useEffect(() => {
    if (!open || !focusGrid) {
      return;
    }
    popoverRef.current
      ?.querySelector<HTMLElement>(`[data-iso="${focusedIso}"]`)
      ?.focus();
    onFocusGridConsumedRef.current();
  }, [focusGrid, focusedIso, onFocusGridConsumedRef, open, popoverRef]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function update() {
      const input = inputRef.current;
      const popover = popoverRef.current;
      if (!input || !popover) {
        return;
      }
      const inputRect = input.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const next = placePopover(
        inputRect,
        {
          width: popoverRect.width || POPOVER_FALLBACK_WIDTH_PX,
          height: popoverRect.height || POPOVER_FALLBACK_HEIGHT_PX,
        },
        { width: window.innerWidth, height: window.innerHeight },
      );
      setCoords((prev) => mergePopoverCoords(prev, next));
    }

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [cursorMonth, cursorYear, inputRef, open, popoverRef, view]);

  return coords;
}
