import { describe, it, expect } from 'vitest';
import type { PipelineEvent } from './types.js';
import { CreatePrdPipeline } from './create-prd.js';

describe('CreatePrdPipeline', () => {
  it('emits completed event with non-empty output', async () => {
    const pipeline = new CreatePrdPipeline();
    const events: PipelineEvent[] = [];
    for await (const event of pipeline.run({
      command: 'create-prd',
      content:
        'We need a note-taking app that supports Markdown editing and AI summarization. ' +
        'Target users are developers and knowledge workers.',
      runId: 'test-1',
      provider: 'mock',
    })) {
      events.push(event);
    }
    const completed = events.find((e) => e.type === 'completed');
    expect(completed).toBeDefined();
    if (completed?.type === 'completed') {
      expect(completed.output).toBeTruthy();
    }
  });

  it('emits token events before completed', async () => {
    const pipeline = new CreatePrdPipeline();
    const events: PipelineEvent[] = [];
    for await (const event of pipeline.run({
      command: 'create-prd',
      content: 'Build a task management tool.',
      runId: 'test-2',
      provider: 'mock',
    })) {
      events.push(event);
    }
    expect(events.some((e) => e.type === 'token')).toBe(true);
    expect(events[events.length - 1]?.type).toBe('completed');
  });

  it('emits failed event when content is empty', async () => {
    const pipeline = new CreatePrdPipeline();
    const events: PipelineEvent[] = [];
    for await (const event of pipeline.run({
      command: 'create-prd',
      content: '',
      runId: 'test-3',
      provider: 'mock',
    })) {
      events.push(event);
    }
    expect(events[0]?.type).toBe('failed');
  });
});
