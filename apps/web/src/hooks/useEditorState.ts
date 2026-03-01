import { useState, useEffect, useRef } from "react";
import type { MarkdownEditorHandle } from "../components/MarkdownEditor";
import { useDebounce } from "./useDebounce";
import { useFileLoader } from "./useFileLoader";
import { useSaveFile } from "./useSaveFile";

export function useEditorState() {
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const debouncedContent = useDebounce(content, 300);
  const fileLoader = useFileLoader(selectedFile);
  const saveStatus = useSaveFile(selectedFile, content, isDirty);
  const editorRef = useRef<MarkdownEditorHandle>(null);

  useEffect(() => {
    if (fileLoader.status === "success") {
      setContent(fileLoader.content);
      setIsDirty(false);
    }
  }, [fileLoader]);

  return {
    selectedFile,
    setSelectedFile,
    content,
    setContent,
    isDirty,
    setIsDirty,
    debouncedContent,
    editorRef,
    fileLoader,
    saveStatus,
  };
}
