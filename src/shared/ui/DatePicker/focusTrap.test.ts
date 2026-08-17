import { describe, expect, it } from 'vitest';
import { getTabbable } from './focusTrap';

describe('getTabbable', () => {
  it('skips disabled, hidden, and aria-hidden elements', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <button type="button">visible</button>
      <button type="button" disabled>disabled</button>
      <button type="button" hidden>hidden</button>
      <button type="button" aria-hidden="true">aria</button>
      <div aria-hidden="true"><button type="button">nested</button></div>
      <button type="button" tabindex="-1">excluded</button>
    `;
    document.body.append(root);

    expect(getTabbable(root).map((element) => element.textContent)).toEqual([
      'visible',
    ]);

    root.remove();
  });
});
