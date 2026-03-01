import type { PromptTemplate } from './index.js'

export const CHAT_EDIT_PROMPT: PromptTemplate = {
  id: 'chat-edit',
  version: '1.0',
  system:
    'You are a Markdown editor assistant. ' +
    'Apply the user instruction to the provided document and return ONLY the complete edited Markdown content, ' +
    'with no explanations, comments, or additional text.',
  user: 'Document:\n{content}\n\nInstruction: {userMessage}',
  placeholders: ['content', 'userMessage'],
}
