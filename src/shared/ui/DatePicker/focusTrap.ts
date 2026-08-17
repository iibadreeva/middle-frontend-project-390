function isVisibleTabbable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled') || element.tabIndex < 0) {
    return false;
  }

  if (element.hidden || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  return !element.closest('[hidden], [aria-hidden="true"]');
}

export function getTabbable(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]',
  )].filter(isVisibleTabbable);
}

export function trapTabKey(event: KeyboardEvent, container: HTMLElement) {
  if (event.key !== 'Tab') {
    return;
  }

  const nodes = getTabbable(container);
  if (nodes.length === 0) {
    return;
  }

  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
