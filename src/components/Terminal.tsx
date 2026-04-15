import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { Terminal as TerminalIcon, X, Play } from "lucide-react";
import { cn } from "../lib/utils";

export function Terminal() {
  const { terminalLogs, addTerminalLog, setIsTerminalOpen } = useAppStore();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  const handleCommandSubmit = async () => {
    if (!input.trim() || isExecuting) return;
    
    const cmd = input.trim();
    setInput("");
    setIsExecuting(true);
    
    addTerminalLog({ message: `$ ${cmd}`, type: "command" });
    
    try {
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
      
      const data = await response.json();
      
      if (data.stdout) {
        addTerminalLog({ message: data.stdout, type: "info" });
      }
      if (data.stderr) {
        addTerminalLog({ message: data.stderr, type: "error" });
      }
      if (data.error) {
        addTerminalLog({ message: `Error: ${data.error}`, type: "error" });
      }
      
      if (!data.stdout && !data.stderr && !data.error) {
        addTerminalLog({ message: "Command executed successfully (no output).", type: "success" });
      }
    } catch (error: any) {
      addTerminalLog({ message: `Failed to execute command: ${error.message}`, type: "error" });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCommandSubmit();
    }
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col font-mono text-[13px]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#1e1e1e] text-[#cccccc]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4" />
          <span className="uppercase text-[11px] font-semibold tracking-wider">
            Terminal
          </span>
        </div>
        <button onClick={() => setIsTerminalOpen(false)} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {terminalLogs.map((log) => (
          <div key={log.id} className="flex gap-3">
            <span className="text-[#858585] shrink-0">
              {log.timestamp.toLocaleTimeString([], { hour12: false })}
            </span>
            <span
              className={cn(
                "whitespace-pre-wrap break-all",
                log.type === "error"
                  ? "text-[#f48771]"
                  : log.type === "success"
                    ? "text-[#89d185]"
                    : log.type === "command"
                      ? "text-[#569cd6]"
                      : "text-[#cccccc]",
              )}
            >
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
      <div className="p-2 bg-[#2d2d2d] border-t border-[#1e1e1e] flex items-center gap-2">
        <span className="text-[#569cd6] font-bold">$</span>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-[#cccccc] outline-none placeholder:text-gray-600"
        />
        <button 
          onClick={handleCommandSubmit}
          disabled={!input.trim() || isExecuting}
          className="text-gray-400 hover:text-white disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
