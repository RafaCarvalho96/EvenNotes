import { describe, it, expect } from 'vitest';
import type { PipelineEvent } from './types.js';
import { SummarizePipeline } from './summarize.js';

describe('SummarizePipeline', () => {
  it('emits completed event with non-empty output', async () => {
    const pipeline = new SummarizePipeline();
    const events: PipelineEvent[] = [];
    for await (const event of pipeline.run({
      command: 'summarize',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
      runId: 'test-1',
      provider: 'mock',
    })) {
      events.push(event);
    }
    const completed = events.find((e) => e.type === 'completed');
    expect(completed).toBeDefined();
    expect(completed!.type).toBe('completed');
    if (completed?.type === 'completed') {
      expect(completed.output).toBeTruthy();
    }
  });

  it('emits failed event when content is empty', async () => {
    const pipeline = new SummarizePipeline();
    const events: PipelineEvent[] = [];
    for await (const event of pipeline.run({
      command: 'summarize',
      content: '',
      runId: 'test-2',
      provider: 'mock',
    })) {
      events.push(event);
    }
    expect(events[0]?.type).toBe('failed');
  });
});
