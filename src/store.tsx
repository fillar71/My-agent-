import React, { createContext, useContext, useState, ReactNode } from "react";

export type FileSystem = Record<string, string>;

export type Message = {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  isStreaming?: boolean;
};

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export type TerminalLog = {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "error" | "success" | "command";
};

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'mistral' | 'anthropic' | 'deepseek';

export const MODEL_PROVIDERS: Record<string, AIProvider> = {
  "gemini-3.1-pro-preview": "gemini",
  "gemini-3-flash-preview": "gemini",
  "gemini-3.1-flash-lite-preview": "gemini",
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai",
  "llama3-70b-8192": "groq",
  "mixtral-8x7b-32768": "groq",
  "mistral-large-latest": "mistral",
  "claude-3-5-sonnet-20241022": "anthropic",
  "claude-3-5-haiku-20241022": "anthropic",
  "deepseek-chat": "deepseek",
  "deepseek-reasoner": "deepseek"
};

interface AppState {
  files: FileSystem;
  setFiles: React.Dispatch<React.SetStateAction<FileSystem>>;
  activeFile: string | null;
  setActiveFile: (path: string | null) => void;
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentSessionId: string;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  terminalLogs: TerminalLog[];
  addTerminalLog: (log: Omit<TerminalLog, "id" | "timestamp">) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isExplorerOpen: boolean;
  setIsExplorerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTerminalOpen: boolean;
  setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  apiKeys: Record<AIProvider, string>;
  setApiKeys: React.Dispatch<React.SetStateAction<Record<AIProvider, string>>>;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  supabaseUrl: string;
  setSupabaseUrl: React.Dispatch<React.SetStateAction<string>>;
  supabaseAnonKey: string;
  setSupabaseAnonKey: React.Dispatch<React.SetStateAction<string>>;
  isGithubModalOpen: boolean;
  setIsGithubModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  githubToken: string;
  setGithubToken: React.Dispatch<React.SetStateAction<string>>;
  githubRepo: string;
  setGithubRepo: React.Dispatch<React.SetStateAction<string>>;
  isMobileLeftSidebarOpen: boolean;
  setIsMobileLeftSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileRightSidebarOpen: boolean;
  setIsMobileRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mobileActiveTab: "chat" | "editor" | "preview";
  setMobileActiveTab: React.Dispatch<React.SetStateAction<"chat" | "editor" | "preview">>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<FileSystem>({
    "/src/App.tsx":
      "export default function App() {\n  return <div>Hello World</div>;\n}",
    "/src/index.css": '@import "tailwindcss";',
    "/package.json": '{\n  "name": "my-app",\n  "version": "1.0.0"\n}',
  });
  const [activeFile, setActiveFile] = useState<string | null>("/src/App.tsx");
  
  const initialSessionId = "1";
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: initialSessionId,
      title: "New Chat",
      messages: [
        {
          id: "1",
          role: "model",
          content: "Hello! I am your autonomous coder agent. What would you like to build today?\n\nBefore we begin, please let me know your preferred specifications if you have them:\n- Frontend/Tech Stack (e.g., React, Vue, HTML/CSS)\n- Backend Framework (if any)\n- Database Selection\n- Any specific project structure",
        },
      ],
      updatedAt: Date.now(),
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(initialSessionId);
  const [messages, setMessages] = useState<Message[]>(sessions[0].messages);

  // Sync messages to the current session whenever they change
  React.useEffect(() => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        // Generate a title from the first user message if it's still "New Chat"
        let title = s.title;
        if (title === "New Chat" && messages.length > 1) {
          const firstUserMsg = messages.find(m => m.role === "user");
          if (firstUserMsg) {
            title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
          }
        }
        return { ...s, messages, title, updatedAt: Date.now() };
      }
      return s;
    }));
  }, [messages, currentSessionId]);

  // Update messages when switching sessions
  React.useEffect(() => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
      setMessages(session.messages);
    }
  }, [currentSessionId]);

  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: "init",
      timestamp: new Date(),
      message: "System initialized. Ready for commands.",
      type: "info",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    gemini: "",
    openai: "",
    groq: "",
    mistral: "",
    anthropic: "",
    deepseek: ""
  });
  const [selectedModel, setSelectedModel] = useState("gemini-3.1-pro-preview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [isMobileLeftSidebarOpen, setIsMobileLeftSidebarOpen] = useState(false);
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<"chat" | "editor" | "preview">("chat");

  const addTerminalLog = (log: Omit<TerminalLog, "id" | "timestamp">) => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        ...log,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        files,
        setFiles,
        activeFile,
        setActiveFile,
        sessions,
        setSessions,
        currentSessionId,
        setCurrentSessionId,
        messages,
        setMessages,
        terminalLogs,
        addTerminalLog,
        isProcessing,
        setIsProcessing,
        isChatOpen,
        setIsChatOpen,
        isExplorerOpen,
        setIsExplorerOpen,
        isTerminalOpen,
        setIsTerminalOpen,
        apiKeys,
        setApiKeys,
        selectedModel,
        setSelectedModel,
        isSettingsOpen,
        setIsSettingsOpen,
        supabaseUrl,
        setSupabaseUrl,
        supabaseAnonKey,
        setSupabaseAnonKey,
        isGithubModalOpen,
        setIsGithubModalOpen,
        githubToken,
        setGithubToken,
        githubRepo,
        setGithubRepo,
        isMobileLeftSidebarOpen,
        setIsMobileLeftSidebarOpen,
        isMobileRightSidebarOpen,
        setIsMobileRightSidebarOpen,
        mobileActiveTab,
        setMobileActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
