import React from 'react';
import { useAppStore, MODEL_PROVIDERS, AIProvider } from '../store';
import { X } from 'lucide-react';

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

  if (!isSettingsOpen) return null;

  const currentProvider = MODEL_PROVIDERS[selectedModel] || 'gemini';
  const currentKey = apiKeys[currentProvider] || '';

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys(prev => ({ ...prev, [currentProvider]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <h2 className="font-semibold text-gray-800">Settings</h2>
          <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-6">
          {/* AI Settings */}
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

          {/* Supabase Settings */}
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
      </div>
    </div>
  );
}
