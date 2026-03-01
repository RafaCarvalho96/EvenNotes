import { CHAT_EDIT_PROMPT, buildPrompt } from '@evennotes/prompts'
import type { PipelineEvent, PipelineInput, PipelineRunner } from './types.js'
import { runPipeline } from './base-pipeline.js'

export class ChatPipeline implements PipelineRunner {
  async *run(input: PipelineInput): AsyncIterable<PipelineEvent> {
    const userMessage =
      typeof input.params?.userMessage === 'string' ? input.params.userMessage.trim() : ''

    if (!userMessage) {
      yield { type: 'failed', error: 'No instruction provided.' }
      return
    }

    yield* runPipeline(
      input,
      (content) => {
        const { system, user } = buildPrompt(CHAT_EDIT_PROMPT, { content, userMessage })
        return `${system}\n\n${user}`
      },
      'ChatPipeline',
      'Content is empty. Please open a file before chatting.',
    )
  }
}
