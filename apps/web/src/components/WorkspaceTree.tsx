import "./WorkspaceTree.css";

interface WorkspaceTreeProps {
  files: string[];
  onSelect: (path: string) => void;
  selectedFile?: string;
}

function basename(path: string): string {
  return path.split("/").pop() ?? path;
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

export function WorkspaceTree({
  files,
  onSelect,
  selectedFile,
}: WorkspaceTreeProps) {
  if (files.length === 0) {
    return (
      <p className="workspace-tree__empty">Nenhum arquivo .md encontrado</p>
    );
  }

  return (
    <ul className="workspace-tree">
      {files.map((file) => (
        <li
          key={file}
          className={`workspace-tree__item${
            file === selectedFile ? " workspace-tree__item--active" : ""
          }`}
          onClick={() => onSelect(file)}
          title={file}
        >
          <FileIcon />
          <span className="workspace-tree__name">{basename(file)}</span>
        </li>
      ))}
    </ul>
  );
}
