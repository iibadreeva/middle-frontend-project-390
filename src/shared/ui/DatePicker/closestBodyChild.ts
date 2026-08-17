export function closestBodyChild(node: Element | null): HTMLElement | null {
  if (!node || !document.body.contains(node)) {
    return null;
  }

  let current: HTMLElement | null =
    node instanceof HTMLElement ? node : node.parentElement;
  while (current && current.parentElement !== document.body) {
    current = current.parentElement;
  }
  return current;
}
