import { SUMMARIZE_PROMPT, buildPrompt } from '@evennotes/prompts'
import type { PipelineEvent, PipelineInput, PipelineRunner } from './types.js'
import { runPipeline } from './base-pipeline.js'

export class SummarizePipeline implements PipelineRunner {
  async *run(input: PipelineInput): AsyncIterable<PipelineEvent> {
    yield* runPipeline(
      input,
      (content) => {
        const { system, user } = buildPrompt(SUMMARIZE_PROMPT, { content })
        return `${system}\n\n${user}`
      },
      'SummarizePipeline',
      'Content is empty. Please provide content to summarize.',
    )
  }
}
