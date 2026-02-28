import { describe, it, expect } from 'vitest';
import { MockLlmProvider } from './index.js';

describe('MockLlmProvider', () => {
  it('yields tokens', async () => {
    const provider = new MockLlmProvider();
    const tokens: string[] = [];
    for await (const token of provider.generate('test prompt')) {
      tokens.push(token);
    }
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join('')).toBeTruthy();
  });

  it('includes prompt preview in response', async () => {
    const provider = new MockLlmProvider();
    const tokens: string[] = [];
    for await (const token of provider.generate('hello world')) {
      tokens.push(token);
    }
    const full = tokens.join('');
    expect(full).toContain('hello world');
  });
});
