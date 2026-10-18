import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Code2 } from 'lucide-react';
import { ExecuteResponse } from '../../types';
import {
  generateCurlSnippet,
  generatePythonSnippet,
  generateTypeScriptSnippet,
} from '../../utils/codeGen';

interface CodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decision: ExecuteResponse | null;
}

export const CodeDrawer: React.FC<CodeDrawerProps> = ({ isOpen, onClose, decision }) => {
  const [activeTab, setActiveTab] = useState<'python' | 'ts' | 'curl' | 'request_json' | 'response_json'>('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !decision) return null;

  const model = decision.stage2_telemetry.model_requested;
  const state = decision.state;
  const questions = decision.questions;

  let codeContent = '';
  if (activeTab === 'python') {
    codeContent = generatePythonSnippet(model, state, questions);
  } else if (activeTab === 'ts') {
    codeContent = generateTypeScriptSnippet(model, state, questions);
  } else if (activeTab === 'curl') {
    codeContent = generateCurlSnippet(model, state, questions);
  } else if (activeTab === 'request_json') {
    codeContent = JSON.stringify({ model, state, questions }, null, 2);
  } else if (activeTab === 'response_json') {
    codeContent = JSON.stringify(decision.answers, null, 2);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl h-full bg-[#111114] border-l border-[#27272a] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-zinc-100 font-mono">
              Drop-In Code & JSON Inspector
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-4 py-2 border-b border-[#27272a] flex items-center justify-between bg-[#18181c]/50">
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'python'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Python (httpx)
            </button>
            <button
              onClick={() => setActiveTab('ts')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'ts'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              TypeScript (fetch)
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'curl'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveTab('request_json')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'request_json'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Request JSON
            </button>
            <button
              onClick={() => setActiveTab('response_json')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'response_json'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Response JSON
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded border border-zinc-700 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Code Content View */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#09090b]">
          <pre className="text-xs font-mono text-zinc-200 leading-relaxed whitespace-pre selection:bg-amber-500/20">
            <code>{codeContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
