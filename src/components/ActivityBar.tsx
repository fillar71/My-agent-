import React from 'react';
import { useAppStore } from '../store';
import { MessageSquare, Files, TerminalSquare, Settings, Github } from 'lucide-react';
import { cn } from '../lib/utils';

export function ActivityBar() {
  const { 
    isChatOpen, setIsChatOpen,
    isExplorerOpen, setIsExplorerOpen,
    isTerminalOpen, setIsTerminalOpen,
    isSettingsOpen, setIsSettingsOpen,
    isGithubModalOpen, setIsGithubModalOpen,
    setMobileActiveTab,
    setIsMobileLeftSidebarOpen
  } = useAppStore();

  const handleChatToggle = () => {
    if (window.innerWidth < 768) {
      setMobileActiveTab("chat");
      setIsMobileLeftSidebarOpen(false);
    } else {
      setIsChatOpen(!isChatOpen);
    }
  };

  const handleExplorerToggle = () => {
    if (window.innerWidth < 768) {
      // It's already open in mobile left sidebar
    } else {
      setIsExplorerOpen(!isExplorerOpen);
    }
  };

  const handleTerminalToggle = () => {
    if (window.innerWidth < 768) {
      setIsTerminalOpen(!isTerminalOpen);
      setMobileActiveTab("editor");
      setIsMobileLeftSidebarOpen(false);
    } else {
      setIsTerminalOpen(!isTerminalOpen);
    }
  };

  return (
    <div className="w-12 shrink-0 h-full bg-[#181818] flex flex-col items-center py-4 z-20">
      <div className="space-y-4 flex flex-col items-center">
        <button 
          onClick={handleChatToggle}
          className={cn("p-2 rounded-xl transition-colors", isChatOpen ? "text-white" : "text-gray-500 hover:text-gray-300")}
          title="Toggle Chat"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
        <button 
          onClick={handleExplorerToggle}
          className={cn("p-2 rounded-xl transition-colors", isExplorerOpen ? "text-white" : "text-gray-500 hover:text-gray-300")}
          title="Toggle Explorer"
        >
          <Files className="w-6 h-6" />
        </button>
        <button 
          onClick={handleTerminalToggle}
          className={cn("p-2 rounded-xl transition-colors", isTerminalOpen ? "text-white" : "text-gray-500 hover:text-gray-300")}
          title="Toggle Terminal"
        >
          <TerminalSquare className="w-6 h-6" />
        </button>
      </div>
      
      <div className="mt-auto flex flex-col items-center space-y-4">
        <button 
          onClick={() => setIsGithubModalOpen(true)}
          className={cn("p-2 rounded-xl transition-colors", isGithubModalOpen ? "text-white" : "text-gray-500 hover:text-gray-300")}
          title="Push to GitHub"
        >
          <Github className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className={cn("p-2 rounded-xl transition-colors", isSettingsOpen ? "text-white" : "text-gray-500 hover:text-gray-300")}
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
