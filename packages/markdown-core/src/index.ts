export function parseMarkdown(content: string): { raw: string; wordCount: number } {
  return { raw: content, wordCount: content.split(/\s+/).filter(Boolean).length };
}

export function renderMarkdown(content: string): string {
  return content; // stub
}
