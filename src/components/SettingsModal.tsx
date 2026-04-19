import React, { useState } from 'react';
import { useAppStore, MODEL_PROVIDERS, AIProvider } from '../store';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export function SettingsModal() {
  const { 
    isSettingsOpen, 
    setIsSettingsOpen, 
    apiKeys, 
    setApiKeys, 
    selectedModel, 
    setSelectedModel,
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnonKey,
    setSupabaseAnonKey
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'general' | 'variables'>('general');

  if (!isSettingsOpen) return null;

  const currentProvider = MODEL_PROVIDERS[selectedModel] || 'gemini';
  const currentKey = apiKeys[currentProvider] || '';

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys(prev => ({ ...prev, [currentProvider]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[600px] h-[500px] max-h-[90vh] flex overflow-hidden">
        
        {/* Settings Sidebar */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col p-2 gap-1 shrink-0">
          <div className="p-2 mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Settings</h2>
          </div>
          <button 
            onClick={() => setActiveTab('general')}
            className={cn("px-3 py-2 rounded-lg text-sm text-left transition-colors", activeTab === 'general' ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-100")}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('variables')}
            className={cn("px-3 py-2 rounded-lg text-sm text-left transition-colors", activeTab === 'variables' ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-100")}
          >
            Variabel
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100">
              <X className="w-5 h-5"/>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-12">
            
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                <p className="text-sm text-gray-500">
                  Settings and application preferences will appear here in future updates. 
                  Currently, all configuration files are managed in the Variabel menu.
                </p>
                {/* Placeholders for future general settings could go here */}
              </div>
            )}

            {activeTab === 'variables' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">AI Configuration</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
                    <select 
                      value={selectedModel} 
                      onChange={e => setSelectedModel(e.target.value)} 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <optgroup label="Google (Gemini)">
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                        <option value="gemini-3-flash-preview">Gemini 3.0 Flash</option>
                        <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
                      </optgroup>
                      <optgroup label="OpenAI">
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                      </optgroup>
                      <optgroup label="Anthropic (Claude)">
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                        <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                      </optgroup>
                      <optgroup label="Groq">
                        <option value="llama3-70b-8192">Llama 3 70B</option>
                        <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                      </optgroup>
                      <optgroup label="Mistral">
                        <option value="mistral-large-latest">Mistral Large</option>
                      </optgroup>
                      <optgroup label="DeepSeek">
                        <option value="deepseek-chat">DeepSeek Chat (V3)</option>
                        <option value="deepseek-reasoner">DeepSeek Reasoner (R1)</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {currentProvider} API Key
                    </label>
                    <input 
                      type="password" 
                      value={currentKey} 
                      onChange={handleKeyChange} 
                      placeholder={currentProvider === 'gemini' ? "Leave empty to use default" : "Enter API key"} 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {currentProvider === 'gemini' 
                        ? "If left empty, the application will use the default API key provided by the environment."
                        : `Please provide your ${currentProvider} API key to use this model.`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Supabase Vector Store (Agent Memory)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supabase URL</label>
                    <input 
                      type="url" 
                      value={supabaseUrl} 
                      onChange={e => setSupabaseUrl(e.target.value)} 
                      placeholder="https://your-project.supabase.co" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supabase Anon Key</label>
                    <input 
                      type="password" 
                      value={supabaseAnonKey} 
                      onChange={e => setSupabaseAnonKey(e.target.value)} 
                      placeholder="eyJh..." 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for storing and retrieving agent memory using pgvector.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
