import { describe, it, expect } from 'vitest';
import type { PipelineEvent } from './types.js';
import { RewritePipeline } from './rewrite.js';

describe('RewritePipeline', () => {
  it('emits completed event with non-empty output', async () => {
    const pipeline = new RewritePipeline();
    const events: PipelineEvent[] = [];
    for await (const event of pipeline.run({
      command: 'rewrite',
      content: 'This is some text that needs to be rewritten in a clearer way.',
      runId: 'test-1',
      provider: 'mock',
      params: { instruction: 'Make it more concise' },
    })) {
      events.push(event);
    }
    const completed = events.find((e) => e.type === 'completed');
    expect(completed).toBeDefined();
    if (completed?.type === 'completed') {
      expect(completed.output).toBeTruthy();
    }
  });

  it('uses a default instruction when none provided', async () => {
    const pipeline = new RewritePipeline();
    const events: PipelineEvent[] = [];
    for await (const event of pipeline.run({
      command: 'rewrite',
      content: 'Some text to rewrite.',
      runId: 'test-2',
      provider: 'mock',
    })) {
      events.push(event);
    }
    expect(events.some((e) => e.type === 'completed')).toBe(true);
  });

  it('emits failed event when content is empty', async () => {
    const pipeline = new RewritePipeline();
    const events: PipelineEvent[] = [];
    for await (const event of pipeline.run({
      command: 'rewrite',
      content: '',
      runId: 'test-3',
      provider: 'mock',
    })) {
      events.push(event);
    }
    expect(events[0]?.type).toBe('failed');
  });
});
