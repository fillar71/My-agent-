import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store";
import { processAgentTurn } from "../lib/ai";
import { getSupabaseClient } from "../lib/supabase";
import { generateEmbedding } from "../lib/embeddings";
import { Send, Bot, User, Loader2, PanelLeftClose, Plus, ChevronDown } from "lucide-react";
import Markdown from "react-markdown";
import { cn } from "../lib/utils";

export function Chat() {
  const {
    messages,
    setMessages,
    files,
    setFiles,
    addTerminalLog,
    isProcessing,
    setIsProcessing,
    setIsChatOpen,
    apiKeys,
    selectedModel,
    supabaseUrl,
    supabaseAnonKey,
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
  } = useAppStore();
  const [input, setInput] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    const newSessionId = Date.now().toString();
    setSessions(prev => [
      {
        id: newSessionId,
        title: "New Chat",
        messages: [
          {
            id: Date.now().toString(),
            role: "model",
            content: "Hello! I am your autonomous coder agent. What would you like to build today?",
          },
        ],
        updatedAt: Date.now(),
      },
      ...prev
    ]);
    setCurrentSessionId(newSessionId);
    setIsHistoryOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setInput("");

    const newUserMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      content: userMsg,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsProcessing(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: modelMsgId, role: "model", content: "", isStreaming: true },
    ]);

    try {
      // Prepare history for Gemini
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "model",
          parts: [{ text: m.content }],
        }));

      const handleToolCall = async (name: string, args: any) => {
        addTerminalLog({ message: `Executing ${name}...`, type: "command" });

        if (name === "create_file" || name === "update_file") {
          setFiles((prev) => ({ ...prev, [args.path]: args.content }));
          addTerminalLog({
            message: `${name === "create_file" ? "Created" : "Updated"} file: ${args.path}`,
            type: "success",
          });
          return `Successfully ${name === "create_file" ? "created" : "updated"} ${args.path}`;
        } else if (name === "delete_file") {
          setFiles((prev) => {
            const newFiles = { ...prev };
            delete newFiles[args.path];
            return newFiles;
          });
          addTerminalLog({
            message: `Deleted file: ${args.path}`,
            type: "success",
          });
          return `Successfully deleted ${args.path}`;
        } else if (name === "run_command") {
          addTerminalLog({ message: `$ ${args.command}`, type: "command" });
          
          try {
            const response = await fetch("/api/terminal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ command: args.command })
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
            
            return JSON.stringify(data);
          } catch (error: any) {
            addTerminalLog({ message: `Failed to execute command: ${error.message}`, type: "error" });
            return `Error: ${error.message}`;
          }
        } else if (name === "store_memory") {
          const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);
          if (!supabase) throw new Error("Supabase credentials are not configured.");
          
          addTerminalLog({ message: `Generating embedding for memory...`, type: "info" });
          const embedding = await generateEmbedding(args.content, apiKeys.openai);
          
          const metadata = args.metadata ? JSON.parse(args.metadata) : {};
          
          const { error } = await supabase
            .from('agent_memories')
            .insert({
              content: args.content,
              metadata,
              embedding
            });
            
          if (error) throw error;
          
          addTerminalLog({ message: `Memory stored successfully.`, type: "success" });
          return "Memory stored successfully.";
        } else if (name === "search_memory") {
          const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);
          if (!supabase) throw new Error("Supabase credentials are not configured.");
          
          addTerminalLog({ message: `Searching memory for: "${args.query}"...`, type: "info" });
          const query_embedding = await generateEmbedding(args.query, apiKeys.openai);
          
          const { data, error } = await supabase.rpc('match_memories', {
            query_embedding,
            match_threshold: 0.7,
            match_count: args.match_count || 5
          });
          
          if (error) throw error;
          
          addTerminalLog({ message: `Found ${data?.length || 0} relevant memories.`, type: "success" });
          return JSON.stringify(data || []);
        }
        throw new Error(`Unknown tool: ${name}`);
      };

      await processAgentTurn(
        userMsg,
        history,
        files,
        apiKeys,
        selectedModel,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        },
        handleToolCall,
      );
    } catch (error: any) {
      console.error(error);
      addTerminalLog({ message: `Error: ${error.message}`, type: "error" });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === modelMsgId
            ? { ...m, content: m.content + `\n\n**Error:** ${error.message}` }
            : m,
        ),
      );
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === modelMsgId ? { ...m, isStreaming: false } : m,
        ),
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10 relative">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <div className="relative">
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="font-semibold text-gray-800 flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors max-w-[200px]"
            >
              <span className="truncate">{sessions.find(s => s.id === currentSessionId)?.title || "Autonomous Agent"}</span>
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            </button>
            
            {isHistoryOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsHistoryOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chat History</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          setIsHistoryOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors truncate",
                          session.id === currentSessionId ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                        )}
                      >
                        {session.title}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleNewChat}
            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "flex-row-reverse" : "",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-blue-600",
              )}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl p-4 shadow-sm",
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white border border-gray-100 rounded-tl-none text-gray-800",
              )}
            >
              <div
                className={cn(
                  "prose prose-sm max-w-none",
                  msg.role === "user" ? "prose-invert" : "",
                )}
              >
                <Markdown>{msg.content}</Markdown>
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask the agent to build something..."
            className="w-full resize-none rounded-xl border border-gray-300 pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 text-sm shadow-sm"
            rows={1}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
