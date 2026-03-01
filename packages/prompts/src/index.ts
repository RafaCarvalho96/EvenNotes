// ─── PromptTemplate ───────────────────────────────────────────────────────────

export type PromptTemplate = {
  id: string
  version: string
  system: string
  user: string
  placeholders: string[]
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const SUMMARIZE_PROMPT: PromptTemplate = {
  id: 'summarize',
  version: '1.0.0',
  system:
    'You are a precise assistant that summarizes Markdown documents. ' +
    'Return a concise, structured summary in Markdown with key points and takeaways.',
  user: 'Summarize the following content:\n\n{content}',
  placeholders: ['{content}'],
}

export const REWRITE_PROMPT: PromptTemplate = {
  id: 'rewrite',
  version: '1.0.0',
  system:
    'You are a writing assistant that rewrites text according to specific instructions. ' +
    'Preserve the original meaning while applying the requested style changes.',
  user: 'Rewrite the following content according to this instruction: {instruction}\n\nContent:\n\n{content}',
  placeholders: ['{content}', '{instruction}'],
}

export const CREATE_PRD_PROMPT: PromptTemplate = {
  id: 'create-prd',
  version: '1.0.0',
  system:
    'You are a senior product manager that writes detailed Product Requirements Documents (PRDs) in Markdown. ' +
    'Always include sections: Visão, Problema, Objetivos, Escopo, Requisitos, Critérios de aceite.',
  user: 'Create a PRD based on the following context:\n\n{context}',
  placeholders: ['{context}'],
}

export { CHAT_EDIT_PROMPT } from './chat.js'

// ─── buildPrompt ──────────────────────────────────────────────────────────────

export function buildPrompt(
  template: PromptTemplate,
  vars: Record<string, string>,
): { system: string; user: string } {
  let user = template.user
  for (const [key, value] of Object.entries(vars)) {
    user = user.replaceAll(`{${key}}`, value)
  }
  return { system: template.system, user }
}
