import React from 'react';
import { useAppStore } from '../store';
import { Chat } from './Chat';
import { Workspace } from './Workspace';
import { ActivityBar } from './ActivityBar';
import { SettingsModal } from './SettingsModal';
import { GithubModal } from './GithubModal';

export function Layout() {
  const { isChatOpen } = useAppStore();
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <ActivityBar />
      {isChatOpen && (
        <div className="w-96 shrink-0 h-full">
          <Chat />
        </div>
      )}
      <div className="flex-1 h-full min-w-0">
        <Workspace />
      </div>
      <SettingsModal />
      <GithubModal />
    </div>
  );
}
