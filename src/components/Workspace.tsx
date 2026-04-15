import React from "react";
import { FileExplorer } from "./FileExplorer";
import { CodeEditor } from "./CodeEditor";
import { Terminal } from "./Terminal";
import { useAppStore } from "../store";

export function Workspace() {
  const { isExplorerOpen, isTerminalOpen } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#cccccc]">
      <div className="flex-1 flex min-h-0">
        {isExplorerOpen && (
          <div className="w-64 shrink-0 border-r border-[#333]">
            <FileExplorer />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <CodeEditor />
          </div>
          {isTerminalOpen && (
            <div className="h-64 shrink-0 border-t border-[#333]">
              <Terminal />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
