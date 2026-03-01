import { REWRITE_PROMPT, buildPrompt } from '@evennotes/prompts'
import type { PipelineEvent, PipelineInput, PipelineRunner } from './types.js'
import { runPipeline } from './base-pipeline.js'
const DEFAULT_INSTRUCTION = 'Reescreva de forma mais clara e objetiva'
export class RewritePipeline implements PipelineRunner {
  async *run(input: PipelineInput): AsyncIterable<PipelineEvent> {
    const instruction =
      typeof input.params?.instruction === 'string' && input.params.instruction.trim().length > 0
        ? input.params.instruction.trim()
        : DEFAULT_INSTRUCTION
    yield* runPipeline(input, (content) => {
      const { system, user } = buildPrompt(REWRITE_PROMPT, { content, instruction })
      return `${system}\n\n${user}`
    }, 'RewritePipeline', 'Content is empty. Please provide content to rewrite.')
  }
}
