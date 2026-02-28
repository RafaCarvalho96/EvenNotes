import { useState } from "react";
import "./index.css";
import { AppLayout } from "./components/AppLayout";
import { WorkspaceTree } from "./components/WorkspaceTree";

const DEMO_FILES = [
  "notes/readme.md",
  "notes/getting-started.md",
  "docs/architecture.md",
  "docs/api-reference.md",
  "journal/2024-01-15.md",
];

export default function App() {
  const [selectedFile, setSelectedFile] = useState<string | undefined>();

  return (
    <AppLayout
      currentFile={selectedFile}
      sidebar={
        <WorkspaceTree
          files={DEMO_FILES}
          onSelect={setSelectedFile}
          selectedFile={selectedFile}
        />
      }
    />
  );
}
