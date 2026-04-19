import React from "react";
import { useAppStore } from "../store";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Markdown from "react-markdown";

export function Preview() {
  const { files, activeFile } = useAppStore();

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-[#cccccc]">
        Select a file to preview
      </div>
    );
  }

  const content = files[activeFile] || "";
  const ext = activeFile.split(".").pop()?.toLowerCase();

  const isMarkdown = ext === "md";

  const language =
    ext === "tsx" || ext === "ts"
      ? "typescript"
      : ext === "json"
        ? "json"
        : ext === "css"
          ? "css"
          : ext === "html"
            ? "html"
            : ext === "md"
              ? "markdown"
              : "javascript";

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-b border-[#1e1e1e]">
        <span className="text-[13px] text-[#cccccc]">
          Preview: {activeFile.split("/").pop()}
        </span>
      </div>
      <div className="flex-1 overflow-auto relative bg-[#1e1e1e]">
        {isMarkdown ? (
          <div className="p-6 text-[#cccccc] prose prose-invert max-w-none">
            <Markdown>{content}</Markdown>
          </div>
        ) : ext === "html" || ext === "svg" ? (
          <iframe 
            className="w-full h-full border-none bg-white"
            title="preview"
            srcDoc={content}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
