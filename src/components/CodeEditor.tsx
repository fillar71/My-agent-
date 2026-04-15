import React from "react";
import { useAppStore } from "../store";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export function CodeEditor() {
  const { files, activeFile, setFiles } = useAppStore();

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-[#cccccc]">
        Select a file to view its contents
      </div>
    );
  }

  const content = files[activeFile] || "";
  const language =
    activeFile.split(".").pop() === "tsx" ||
    activeFile.split(".").pop() === "ts"
      ? "typescript"
      : activeFile.split(".").pop() === "json"
        ? "json"
        : activeFile.split(".").pop() === "css"
          ? "css"
          : "javascript";

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-b border-[#1e1e1e]">
        <span className="text-[13px] text-[#cccccc]">
          {activeFile.split("/").pop()}
        </span>
      </div>
      <div className="flex-1 overflow-auto relative">
        <textarea
          value={content}
          onChange={(e) =>
            setFiles((prev) => ({ ...prev, [activeFile]: e.target.value }))
          }
          className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none z-10"
          spellCheck={false}
        />
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            height: "100%",
            background: "transparent",
            fontSize: "14px",
          }}
          showLineNumbers
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
