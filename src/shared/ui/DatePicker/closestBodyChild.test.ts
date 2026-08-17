import { describe, expect, it } from 'vitest';
import { closestBodyChild } from './closestBodyChild';

describe('closestBodyChild', () => {
  it('returns the element that sits directly under document.body', () => {
    const shell = document.createElement('div');
    const inner = document.createElement('span');
    shell.append(inner);
    document.body.append(shell);

    expect(closestBodyChild(inner)).toBe(shell);
    expect(closestBodyChild(shell)).toBe(shell);

    shell.remove();
  });

  it('returns null when the node is not in the document', () => {
    expect(closestBodyChild(document.createElement('div'))).toBeNull();
    expect(closestBodyChild(null)).toBeNull();
  });
});
