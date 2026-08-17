/** Тень шапки только после настоящего скролла, не от лёгкого толчка. */
export const HEADER_COMPACT_AFTER_PX = 48;

/** Снимаем тень ближе к верху, чем порог появления — без дребезга на границе. */
export const HEADER_EXPAND_BELOW_PX = 8;

export function nextHeaderScrolled(scrollY: number, scrolled: boolean): boolean {
  if (scrolled) {
    return scrollY > HEADER_EXPAND_BELOW_PX;
  }

  return scrollY > HEADER_COMPACT_AFTER_PX;
}
