import React, { useState } from 'react';
import { useAppStore } from '../store';
import { X, Github, Loader2 } from 'lucide-react';
import { pushToGithub } from '../lib/github';

export function GithubModal() {
  const { 
    isGithubModalOpen, 
    setIsGithubModalOpen, 
    githubToken, 
    setGithubToken,
    githubRepo,
    setGithubRepo,
    files,
    addTerminalLog
  } = useAppStore();

  const [branch, setBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState("Update from AI Studio");
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  if (!isGithubModalOpen) return null;

  const handlePush = async () => {
    if (!githubToken || !githubRepo) {
      setError("Token and Repository are required");
      return;
    }

    setIsPushing(true);
    setError(null);
    setSuccessUrl(null);

    try {
      addTerminalLog({ message: `Pushing to GitHub repository: ${githubRepo}...`, type: "info" });
      const url = await pushToGithub(githubToken, githubRepo, branch, commitMessage, files);
      setSuccessUrl(url);
      addTerminalLog({ message: `Successfully pushed to GitHub!`, type: "success" });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to push to GitHub");
      addTerminalLog({ message: `GitHub push failed: ${err.message}`, type: "error" });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-gray-800" />
            <h2 className="font-semibold text-gray-800">Push to GitHub</h2>
          </div>
          <button onClick={() => setIsGithubModalOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {successUrl && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              Successfully pushed! <a href={successUrl} target="_blank" rel="noreferrer" className="underline font-medium">View Commit</a>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Personal Access Token</label>
            <input 
              type="password" 
              value={githubToken} 
              onChange={e => setGithubToken(e.target.value)} 
              placeholder="ghp_..." 
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Needs 'repo' scope. You can create one in GitHub Developer Settings.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repository (owner/repo)</label>
            <input 
              type="text" 
              value={githubRepo} 
              onChange={e => setGithubRepo(e.target.value)} 
              placeholder="username/my-project" 
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <input 
                type="text" 
                value={branch} 
                onChange={e => setBranch(e.target.value)} 
                placeholder="main" 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commit Message</label>
              <input 
                type="text" 
                value={commitMessage} 
                onChange={e => setCommitMessage(e.target.value)} 
                placeholder="Update from AI Studio" 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 shrink-0">
          <button 
            onClick={() => setIsGithubModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handlePush}
            disabled={isPushing || !githubToken || !githubRepo}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPushing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Pushing...
              </>
            ) : (
              <>
                <Github className="w-4 h-4" />
                Push to GitHub
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
