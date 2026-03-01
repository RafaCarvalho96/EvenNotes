import { CREATE_PRD_PROMPT, buildPrompt } from '@evennotes/prompts'
import type { PipelineEvent, PipelineInput, PipelineRunner } from './types.js'
import { runPipeline } from './base-pipeline.js'
export class CreatePrdPipeline implements PipelineRunner {
  async *run(input: PipelineInput): AsyncIterable<PipelineEvent> {
    yield* runPipeline(input, (context) => {
      const { system, user } = buildPrompt(CREATE_PRD_PROMPT, { context })
      return `${system}\n\n${user}`
    }, 'CreatePrdPipeline', 'Content is empty. Please provide context to generate a PRD.')
  }
}
