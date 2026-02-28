import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import "./MarkdownPreview.css";

interface MarkdownPreviewProps {
  content: string;
}

/**
 * Sanitize the raw Markdown string before handing it to react-markdown.
 * DOMPurify strips any injected HTML/script tags from the source text itself
 * (belt-and-suspenders alongside rehype-sanitize which operates on the AST).
 */
function sanitizeContent(raw: string): string {
  return DOMPurify.sanitize(raw, {
    // Allow all Markdown-safe elements; block script/onerror vectors.
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const safeContent = sanitizeContent(content);
  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
