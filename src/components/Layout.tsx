import React from 'react';
import { useAppStore } from '../store';
import { Chat } from './Chat';
import { Workspace } from './Workspace';
import { ActivityBar } from './ActivityBar';
import { SettingsModal } from './SettingsModal';
import { GithubModal } from './GithubModal';
import { CodeEditor } from './CodeEditor';
import { Preview } from './Preview';
import { FileExplorer } from './FileExplorer';
import { Menu, PanelRightClose, PanelRightOpen, TerminalIcon, Code, MonitorPlay, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { Terminal } from './Terminal';

export function Layout() {
  const { 
    isChatOpen, 
    isMobileLeftSidebarOpen, 
    setIsMobileLeftSidebarOpen,
    isMobileRightSidebarOpen,
    setIsMobileRightSidebarOpen,
    mobileActiveTab,
    setMobileActiveTab,
    isTerminalOpen
  } = useAppStore();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden relative">
      
      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:flex h-full">
        <ActivityBar />
        {isChatOpen && (
          <div className="w-96 shrink-0 h-full border-r border-gray-200">
            <Chat />
          </div>
        )}
      </div>

      <div className="hidden md:flex flex-1 h-full min-w-0">
        <Workspace />
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="flex md:hidden items-center justify-between bg-[#1e1e1e] border-b border-[#333] p-3 text-gray-300 z-10 shrink-0">
        <button onClick={() => setIsMobileLeftSidebarOpen(true)} className="p-1 hover:text-white rounded">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-semibold text-xs uppercase tracking-wider text-white">Agent IDE - {mobileActiveTab}</span>
        <button onClick={() => setIsMobileRightSidebarOpen(true)} className="p-1 hover:text-white rounded">
          <PanelRightOpen className="w-5 h-5" />
        </button>
      </div>

      <div className="flex md:hidden flex-1 relative min-h-0 bg-[#1e1e1e]">
        {mobileActiveTab === "chat" && (
          <div className="absolute inset-0">
            <Chat />
          </div>
        )}
        {mobileActiveTab === "editor" && (
          <div className="absolute inset-0 flex flex-col">
             <div className="flex-1 min-h-0">
               <CodeEditor />
             </div>
             {isTerminalOpen && (
               <div className="h-48 shrink-0 border-t border-[#333]">
                 <Terminal />
               </div>
             )}
          </div>
        )}
        {mobileActiveTab === "preview" && (
          <div className="absolute inset-0 bg-white">
            <Preview />
          </div>
        )}
      </div>

      {/* MOBILE LEFT SIDEBAR (DRAWER) */}
      {isMobileLeftSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileLeftSidebarOpen(false)} />
          <div className="relative bg-[#1e1e1e] w-[300px] h-full flex shadow-2xl animate-in slide-in-from-left-full duration-200">
            <ActivityBar />
            <div className="flex-1 border-l border-[#333] h-full overflow-hidden">
              <FileExplorer />
            </div>
          </div>
        </div>
      )}

      {/* MOBILE RIGHT SIDEBAR (DRAWER) */}
      {isMobileRightSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileRightSidebarOpen(false)} />
          <div className="relative bg-[#252526] w-64 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right-full duration-200">
            <div className="p-4 border-b border-[#333] flex justify-between items-center text-white">
              <span className="font-semibold text-sm">Views</span>
              <button onClick={() => setIsMobileRightSidebarOpen(false)} className="text-gray-400 hover:text-white">
                <PanelRightClose className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <button 
                onClick={() => { setMobileActiveTab("chat"); setIsMobileRightSidebarOpen(false); }}
                className={cn("flex items-center gap-3 p-3 rounded-lg text-sm text-left transition-colors", mobileActiveTab === "chat" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-[#333]")}
              >
                <MessageSquare className="w-4 h-4" /> Chatbox
              </button>
              <button 
                onClick={() => { setMobileActiveTab("editor"); setIsMobileRightSidebarOpen(false); }}
                className={cn("flex items-center gap-3 p-3 rounded-lg text-sm text-left transition-colors", mobileActiveTab === "editor" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-[#333]")}
              >
                <Code className="w-4 h-4" /> Code Editor
              </button>
              <button 
                onClick={() => { setMobileActiveTab("preview"); setIsMobileRightSidebarOpen(false); }}
                className={cn("flex items-center gap-3 p-3 rounded-lg text-sm text-left transition-colors", mobileActiveTab === "preview" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-[#333]")}
              >
                <MonitorPlay className="w-4 h-4" /> Preview
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal />
      <GithubModal />
    </div>
  );
}
