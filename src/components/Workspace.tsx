import React, { useState } from "react";
import { FileExplorer } from "./FileExplorer";
import { CodeEditor } from "./CodeEditor";
import { Terminal } from "./Terminal";
import { Preview } from "./Preview";
import { useAppStore } from "../store";
import { Code, MonitorPlay } from "lucide-react";
import { cn } from "../lib/utils";

export function Workspace() {
  const { isExplorerOpen, isTerminalOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#cccccc]">
      <div className="flex-1 flex min-h-0">
        {isExplorerOpen && (
          <div className="w-64 shrink-0 border-r border-[#333]">
            <FileExplorer />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center bg-[#252526] border-b border-[#1e1e1e]">
            <button 
              onClick={() => setActiveTab("code")}
              className={cn("px-4 py-2 text-[13px] flex items-center gap-2 border-t-2 transition-colors", activeTab === "code" ? "bg-[#1e1e1e] text-white border-blue-500" : "border-transparent text-gray-400 hover:text-gray-300")}
            >
              <Code className="w-4 h-4" /> Code
            </button>
            <button 
              onClick={() => setActiveTab("preview")}
              className={cn("px-4 py-2 text-[13px] flex items-center gap-2 border-t-2 transition-colors", activeTab === "preview" ? "bg-[#1e1e1e] text-white border-blue-500" : "border-transparent text-gray-400 hover:text-gray-300")}
            >
              <MonitorPlay className="w-4 h-4" /> Preview
            </button>
          </div>
          <div className="flex-1 min-h-0 relative">
            {activeTab === "code" ? <CodeEditor /> : <Preview />}
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
