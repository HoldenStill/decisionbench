import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  ArrowRight,
  Sliders,
  Layers,
  Repeat,
  CornerDownLeft,
  Loader2,
  GitCompare
} from 'lucide-react';
import { ModelItem } from '../../types';
import { ModelSelector } from './ModelSelector';

interface OmniComposerProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  stage1Models: ModelItem[];
  stage2Models: ModelItem[];
  selectedStage1Model: string;
  onSelectStage1Model: (modelId: string) => void;
  selectedStage2Model: string;
  onSelectStage2Model: (modelId: string) => void;
  comparisonModel: string | null;
  onComparisonModelChange: (modelId: string | null) => void;
  isSweepEnabled: boolean;
  onToggleSweep: () => void;
  isExecuting: boolean;
  executionStep: string;
  onExecute: () => void;
  onCompileOnly: () => void;
}

export const OmniComposer: React.FC<OmniComposerProps> = ({
  prompt,
  onPromptChange,
  stage1Models,
  stage2Models,
  selectedStage1Model,
  onSelectStage1Model,
  selectedStage2Model,
  onSelectStage2Model,
  comparisonModel,
  onComparisonModelChange,
  isSweepEnabled,
  onToggleSweep,
  isExecuting,
  executionStep,
  onExecute,
  onCompileOnly,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(220, Math.max(90, textareaRef.current.scrollHeight))}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isExecuting && prompt.trim()) {
        onExecute();
      }
    }
  };

  return (
    <div className="bg-[#111114] border border-[#27272a] rounded-xl shadow-lg p-3.5 space-y-3 transition-all focus-within:border-amber-500/50">
      {/* Omni Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="State your dilemma in conversational English (e.g. 'Should I use SQLite WAL or PostgreSQL for my self-hosted app on TrueNAS, and is it safe to package in a single container?')..."
          className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed font-sans pr-16"
          disabled={isExecuting}
        />
        <div className="absolute right-1 bottom-1 text-[10px] font-mono text-zinc-600 flex items-center gap-1 select-none pointer-events-none">
          <span>⌘/Ctrl+Enter</span>
          <CornerDownLeft className="w-3 h-3" />
        </div>
      </div>

      {/* Control Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#27272a]/70">
        {/* Model Selectors & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage 1 Compiler Selector */}
          <ModelSelector
            models={stage1Models}
            selectedModelId={selectedStage1Model}
            onSelectModel={onSelectStage1Model}
            stageBadge="Stage 1"
            label="Stage-1 Schema Compiler (LLM)"
          />

          {/* Stage 2 Decision Model Selector */}
          <ModelSelector
            models={stage2Models}
            selectedModelId={selectedStage2Model}
            onSelectModel={onSelectStage2Model}
            stageBadge="Stage 2"
            label="Stage-2 System One Decider"
          />

          {/* Comparison Model Toggle */}
          {comparisonModel ? (
            <div className="flex items-center gap-1.5 bg-[#18181c] border border-cyan-500/30 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-mono text-cyan-400">VS</span>
              <ModelSelector
                models={stage2Models.filter((m) => m.id !== selectedStage2Model)}
                selectedModelId={comparisonModel}
                onSelectModel={(id) => onComparisonModelChange(id)}
                label="Select Comparison Model"
              />
              <button
                type="button"
                onClick={() => onComparisonModelChange(null)}
                className="text-[10px] text-zinc-500 hover:text-rose-400 ml-1"
                title="Remove model comparison"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const alt = stage2Models.find((m) => m.id !== selectedStage2Model)?.id || 'typesafe/jev-1.14';
                onComparisonModelChange(alt);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#18181c] border border-[#27272a] hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <GitCompare className="w-3 h-3" />
              <span>+ Compare</span>
            </button>
          )}

          {/* 3x Consistency Sweep Toggle */}
          <button
            type="button"
            onClick={onToggleSweep}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 ${
              isSweepEnabled
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-[#18181c] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Run 3 consecutive evaluations to benchmark model variance"
          >
            <Repeat className="w-3 h-3" />
            <span>3x Sweep</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCompileOnly}
            disabled={isExecuting || !prompt.trim()}
            className="px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-zinc-800 text-xs font-medium text-zinc-300 border border-[#27272a] hover:border-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Run Stage 1 only and populate Schema Workbench for inspection"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>Compile to Editor Only</span>
          </button>

          <button
            type="button"
            onClick={onExecute}
            disabled={isExecuting || !prompt.trim()}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-sm hover:shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{executionStep || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Decision Model</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
