import { useState, useRef, useEffect } from "react";
import "./WorkspaceTree.css";

interface WorkspaceTreeProps {
  files: string[];
  onSelect: (path: string) => void;
  selectedFile?: string;
  onCreateFile?: (path: string) => Promise<string | null>;
  onRenameFile?: (from: string, to: string) => Promise<string | null>;
  onDeleteFile?: (path: string) => Promise<string | null>;
}

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

function dirname(path: string): string {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}

function FileIcon() {
  return (
    <svg
      className="workspace-tree__icon"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

interface FileItemProps {
  file: string;
  isSelected: boolean;
  onSelect: (path: string) => void;
  onRenameFile?: (from: string, to: string) => Promise<string | null>;
  onDeleteFile?: (path: string) => Promise<string | null>;
}

function FileItem({ file, isSelected, onSelect, onRenameFile, onDeleteFile }: FileItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (!isConfirmingDelete) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsConfirmingDelete(false);
        setDeleteError("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmingDelete]);

  function startDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteError("");
    setIsConfirmingDelete(true);
  }

  function cancelDelete() {
    setIsConfirmingDelete(false);
    setDeleteError("");
  }

  async function handleDeleteConfirm() {
    if (!onDeleteFile) {
      setIsConfirmingDelete(false);
      return;
    }
    const error = await onDeleteFile(file);
    if (error !== null) {
      setDeleteError(error);
    }
  }

  function startRenaming(e: React.MouseEvent) {
    e.stopPropagation();
    setRenameValue(basename(file));
    setRenameError("");
    setIsRenaming(true);
  }

  function cancelRenaming() {
    setIsRenaming(false);
    setRenameValue("");
    setRenameError("");
  }

  async function handleRenameSubmit() {
    const newName = renameValue.trim();

    if (!newName.endsWith(".md")) {
      setRenameError("O nome deve terminar com .md");
      return;
    }

    if (newName === basename(file)) {
      cancelRenaming();
      return;
    }

    if (!onRenameFile) {
      cancelRenaming();
      return;
    }

    const dir = dirname(file);
    const to = dir ? `${dir}/${newName}` : newName;

    setIsSubmitting(true);
    setRenameError("");

    const error = await onRenameFile(file, to);

    setIsSubmitting(false);

    if (error === null) {
      cancelRenaming();
    } else {
      setRenameError(error);
    }
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleRenameSubmit();
    } else if (e.key === "Escape") {
      cancelRenaming();
    }
  }

  function handleDoubleClick(e: React.MouseEvent) {
    if (onRenameFile && !isRenaming) {
      e.stopPropagation();
      startRenaming(e);
    }
  }

  if (isRenaming) {
    return (
      <li
        className={`workspace-tree__item workspace-tree__item--renaming${
          isSelected ? " workspace-tree__item--active" : ""
        }`}
        title={file}
      >
        <FileIcon />
        <div className="workspace-tree__rename-wrapper">
          <input
            ref={renameInputRef}
            className="workspace-tree__rename-input"
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            disabled={isSubmitting}
            aria-label="Novo nome do arquivo"
            onClick={(e) => e.stopPropagation()}
          />
          {renameError && (
            <span className="workspace-tree__rename-error">{renameError}</span>
          )}
        </div>
      </li>
    );
  }

  if (isConfirmingDelete) {
    return (
      <li
        className={`workspace-tree__item workspace-tree__item--confirming-delete${
          isSelected ? " workspace-tree__item--active" : ""
        }`}
        title={file}
      >
        <div className="workspace-tree__confirm-delete">
          <span className="workspace-tree__confirm-delete-text">
            Excluir {basename(file)}?
          </span>
          <button
            className="workspace-tree__btn-cancel"
            onClick={cancelDelete}
            aria-label="Cancelar exclusão"
          >
            Cancelar
          </button>
          <button
            className="workspace-tree__btn-confirm"
            onClick={() => { void handleDeleteConfirm(); }}
            aria-label={`Confirmar exclusão de ${basename(file)}`}
          >
            Confirmar
          </button>
        </div>
        {deleteError && (
          <span className="workspace-tree__rename-error">{deleteError}</span>
        )}
      </li>
    );
  }

  return (
    <li
      className={`workspace-tree__item${
        isSelected ? " workspace-tree__item--active" : ""
      }`}
      onClick={() => onSelect(file)}
      onDoubleClick={handleDoubleClick}
      title={file}
    >
      <FileIcon />
      <span className="workspace-tree__name">{basename(file)}</span>
      {onRenameFile && (
        <button
          className="workspace-tree__btn-rename"
          onClick={startRenaming}
          title="Renomear arquivo"
          aria-label={`Renomear ${basename(file)}`}
        >
          <PencilIcon />
        </button>
      )}
      {onDeleteFile && (
        <button
          className="workspace-tree__btn-delete"
          onClick={startDelete}
          title="Excluir arquivo"
          aria-label={`Excluir ${basename(file)}`}
        >
          <TrashIcon />
        </button>
      )}
    </li>
  );
}

export function WorkspaceTree({
  files,
  onSelect,
  selectedFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
}: WorkspaceTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [createError, setCreateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  function startCreating() {
    setIsCreating(true);
    setNewFilePath("");
    setCreateError("");
  }

  function cancelCreating() {
    setIsCreating(false);
    setNewFilePath("");
    setCreateError("");
  }

  async function handleCreateSubmit() {
    const path = newFilePath.trim();

    if (!path.endsWith(".md")) {
      setCreateError("O caminho deve terminar com .md");
      return;
    }

    if (!onCreateFile) {
      cancelCreating();
      return;
    }

    setIsSubmitting(true);
    setCreateError("");

    const error = await onCreateFile(path);

    setIsSubmitting(false);

    if (error === null) {
      cancelCreating();
    } else {
      setCreateError(error);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleCreateSubmit();
    } else if (e.key === "Escape") {
      cancelCreating();
    }
  }

  return (
    <div className="workspace-tree__wrapper">
      <div className="workspace-tree__header">
        <span className="workspace-tree__header-title">Arquivos</span>
        {onCreateFile && (
          <button
            className="workspace-tree__btn-add"
            onClick={startCreating}
            title="Novo arquivo"
            aria-label="Criar novo arquivo"
            disabled={isCreating}
          >
            +
          </button>
        )}
      </div>

      {isCreating && (
        <div className="workspace-tree__create-row">
          <input
            ref={inputRef}
            className="workspace-tree__create-input"
            type="text"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="notas/reuniao.md"
            disabled={isSubmitting}
            aria-label="Caminho do novo arquivo"
          />
          {createError && (
            <span className="workspace-tree__create-error">{createError}</span>
          )}
        </div>
      )}

      {files.length === 0 && !isCreating ? (
        <p className="workspace-tree__empty">Nenhum arquivo .md encontrado</p>
      ) : (
        <ul className="workspace-tree">
          {files.map((file) => (
            <FileItem
              key={file}
              file={file}
              isSelected={file === selectedFile}
              onSelect={onSelect}
              onRenameFile={onRenameFile}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
