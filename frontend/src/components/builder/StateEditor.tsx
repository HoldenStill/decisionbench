import React, { useState } from 'react';
import { Code, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface StateEditorProps {
  stateMode: 'text' | 'json';
  onStateModeChange: (mode: 'text' | 'json') => void;
  stateContent: any;
  onStateContentChange: (newContent: any) => void;
}

export const StateEditor: React.FC<StateEditorProps> = ({
  stateMode,
  onStateModeChange,
  stateContent,
  onStateContentChange,
}) => {
  const [jsonText, setJsonText] = useState(
    typeof stateContent === 'object' ? JSON.stringify(stateContent, null, 2) : String(stateContent)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonTextChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      onStateContentChange(parsed);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleTextChange = (text: string) => {
    onStateContentChange(text);
  };

  return (
    <div className="bg-[#111114] border border-[#27272a] rounded-xl p-4 space-y-3">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Decision State & Context
          </h3>
          <p className="text-[11px] text-zinc-500">
            Background facts, constraints, and priorities evaluated by the decision model
          </p>
        </div>

        <div className="flex bg-[#18181c] p-0.5 rounded-lg border border-[#27272a] text-xs font-mono">
          <button
            type="button"
            onClick={() => onStateModeChange('text')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              stateMode === 'text'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Raw Text / Markdown</span>
          </button>
          <button
            type="button"
            onClick={() => onStateModeChange('json')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              stateMode === 'json'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3 h-3" />
            <span>Structured JSON</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {stateMode === 'text' ? (
        <textarea
          value={typeof stateContent === 'string' ? stateContent : JSON.stringify(stateContent, null, 2)}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="State all context, constraints, environment variables, user goals, and hardware limitations..."
          className="w-full bg-[#18181c] border border-[#27272a] rounded-lg p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 min-h-[120px] font-sans leading-relaxed"
        />
      ) : (
        <div className="space-y-1.5">
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonTextChange(e.target.value)}
            placeholder='{\n  "environment": "home_server",\n  "max_memory_mb": 4096\n}'
            className={`w-full bg-[#18181c] border rounded-lg p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none min-h-[140px] font-mono leading-relaxed ${
              jsonError ? 'border-rose-500/50' : 'border-[#27272a] focus:border-amber-500/50'
            }`}
          />
          {jsonError ? (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Invalid JSON: {jsonError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Valid JSON payload ready</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
