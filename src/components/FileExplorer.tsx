import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store";
import {
  FileCode,
  FileJson,
  FileText,
  Folder,
  ChevronRight,
  ChevronDown,
  X,
  Pencil,
  FilePlus,
  Copy,
  Trash2,
  Check
} from "lucide-react";
import { cn } from "../lib/utils";

export function FileExplorer() {
  const { files, setFiles, activeFile, setActiveFile, setIsExplorerOpen, setMobileActiveTab, setIsMobileLeftSidebarOpen } = useAppStore();
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newValue, setNewValue] = useState("");
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  // Simple flat list for now, can be improved to tree view
  const filePaths = Object.keys(files).sort();

  useEffect(() => {
    if (editingPath && inputRef.current) {
      inputRef.current.focus();
      // Select filename without extension if possible
      const dotIndex = editValue.lastIndexOf('.');
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [editingPath]);

  useEffect(() => {
    if (isCreating && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [isCreating]);

  const getFileIcon = (path: string) => {
    if (path.endsWith(".tsx") || path.endsWith(".ts"))
      return <FileCode className="w-4 h-4 text-[#519aba]" />;
    if (path.endsWith(".json"))
      return <FileJson className="w-4 h-4 text-[#cbcb41]" />;
    if (path.endsWith(".css"))
      return <FileCode className="w-4 h-4 text-[#519aba]" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  const handleRenameSubmit = (oldPath: string) => {
    const newName = editValue.trim();
    if (!newName) {
      setEditingPath(null);
      return;
    }

    const dir = oldPath.substring(0, oldPath.lastIndexOf("/"));
    const newPath = `${dir}/${newName}`;

    if (newPath !== oldPath) {
      if (files[newPath]) {
        // File already exists, cancel rename
        setEditingPath(null);
        return;
      }

      setFiles((prev) => {
        const newFiles = { ...prev };
        newFiles[newPath] = newFiles[oldPath];
        delete newFiles[oldPath];
        return newFiles;
      });

      if (activeFile === oldPath) {
        setActiveFile(newPath);
      }
    }
    setEditingPath(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, path: string) => {
    if (e.key === "Enter") {
      handleRenameSubmit(path);
    } else if (e.key === "Escape") {
      setEditingPath(null);
    }
  };

  const handleCreateSubmit = () => {
    const newName = newValue.trim();
    if (!newName) {
      setIsCreating(false);
      return;
    }

    let newPath = newName;
    if (!newPath.startsWith('/')) {
      newPath = `/src/${newPath}`;
    }

    if (files[newPath]) {
      setIsCreating(false);
      return;
    }

    setFiles((prev) => ({
      ...prev,
      [newPath]: ""
    }));
    setActiveFile(newPath);
    setIsCreating(false);
    setNewValue("");
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateSubmit();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewValue("");
    }
  };

  const handleCopy = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const dir = path.substring(0, path.lastIndexOf("/"));
    const filename = path.substring(path.lastIndexOf("/") + 1);
    const dotIndex = filename.lastIndexOf(".");
    
    let newName = "";
    if (dotIndex > 0) {
      newName = `${filename.substring(0, dotIndex)}_copy${filename.substring(dotIndex)}`;
    } else {
      newName = `${filename}_copy`;
    }
    
    let newPath = `${dir}/${newName}`;
    let counter = 1;
    while (files[newPath]) {
      if (dotIndex > 0) {
        newPath = `${dir}/${filename.substring(0, dotIndex)}_copy${counter}${filename.substring(dotIndex)}`;
      } else {
        newPath = `${dir}/${filename}_copy${counter}`;
      }
      counter++;
    }

    setFiles((prev) => ({
      ...prev,
      [newPath]: prev[path]
    }));
    setActiveFile(newPath);
  };

  const confirmDelete = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[path];
      return newFiles;
    });
    if (activeFile === path) {
      setActiveFile(null);
    }
    setDeletingPath(null);
  };

  return (
    <div className="h-full bg-[#252526] text-[#cccccc] flex flex-col">
      <div className="p-2 flex items-center justify-between text-[#cccccc]">
        <span className="text-[11px] font-semibold tracking-wider uppercase">Explorer</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              setIsCreating(true);
              setNewValue("");
            }} 
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#333]"
            title="New File"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button onClick={() => setIsExplorerOpen(false)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#333]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {isCreating && (
          <div className="w-full flex items-center gap-2 px-4 py-1 text-[13px] bg-[#37373d]">
            <FileText className="w-4 h-4 text-gray-400" />
            <input
              ref={newFileInputRef}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={handleCreateSubmit}
              className="flex-1 bg-[#3c3c3c] text-white px-1 outline-none border border-[#007fd4]"
              placeholder="Filename..."
            />
          </div>
        )}
        {filePaths.map((path) => (
          <div
            key={path}
            onClick={() => {
              if (editingPath !== path) {
                setActiveFile(path);
                if (window.innerWidth < 768) {
                  setMobileActiveTab("editor");
                  setIsMobileLeftSidebarOpen(false);
                }
              }
            }}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-1 text-[13px] hover:bg-[#2a2d2e] transition-colors text-left group cursor-pointer",
              activeFile === path ? "bg-[#37373d] text-white" : "",
            )}
          >
            {getFileIcon(path)}
            {editingPath === path ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, path)}
                onBlur={() => handleRenameSubmit(path)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-[#3c3c3c] text-white px-1 outline-none border border-[#007fd4]"
              />
            ) : deletingPath === path ? (
              <div className="flex-1 flex items-center justify-between">
                <span className="truncate text-[#f48771]">Delete?</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => confirmDelete(e, path)}
                    className="p-1 hover:bg-[#4d4d4d] rounded text-green-400 transition-all"
                    title="Confirm Delete"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingPath(null);
                    }}
                    className="p-1 hover:bg-[#4d4d4d] rounded text-gray-400 hover:text-white transition-all"
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="truncate flex-1">{path.split("/").pop()}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPath(path);
                      setEditValue(path.split("/").pop() || "");
                    }}
                    className="p-1 hover:bg-[#4d4d4d] rounded text-gray-400 hover:text-white transition-all"
                    title="Rename File"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleCopy(e, path)}
                    className="p-1 hover:bg-[#4d4d4d] rounded text-gray-400 hover:text-white transition-all"
                    title="Copy File"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingPath(path);
                    }}
                    className="p-1 hover:bg-[#4d4d4d] rounded text-gray-400 hover:text-[#f48771] transition-all"
                    title="Delete File"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
