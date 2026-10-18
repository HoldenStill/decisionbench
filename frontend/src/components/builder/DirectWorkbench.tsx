import React from 'react';
import { Play, Sparkles, Sliders, Layers, Repeat, GitCompare, Bookmark } from 'lucide-react';
import { QuestionDefinition, ModelItem, ThresholdSettings } from '../../types';
import { StateEditor } from './StateEditor';
import { QuestionStack } from './QuestionStack';
import { ModelSelector } from '../omni/ModelSelector';

interface DirectWorkbenchProps {
  stateContent: any;
  stateMode: 'text' | 'json';
  onStateContentChange: (val: any) => void;
  onStateModeChange: (mode: 'text' | 'json') => void;
  questions: Record<string, QuestionDefinition>;
  onQuestionsChange: (q: Record<string, QuestionDefinition>) => void;
  thresholds?: ThresholdSettings | null;
  onThresholdsChange?: (t: ThresholdSettings) => void;
  stage2Models: ModelItem[];
  selectedDecisionModel: string;
  onSelectDecisionModel: (modelId: string) => void;
  comparisonModel: string | null;
  onComparisonModelChange: (modelId: string | null) => void;
  isSweepEnabled: boolean;
  onToggleSweep: () => void;
  isExecuting: boolean;
  onExecute: () => void;
  onSaveScenario: () => void;
}

export const DirectWorkbench: React.FC<DirectWorkbenchProps> = ({
  stateContent,
  stateMode,
  onStateContentChange,
  onStateModeChange,
  questions,
  onQuestionsChange,
  thresholds,
  onThresholdsChange,
  stage2Models,
  selectedDecisionModel,
  onSelectDecisionModel,
  comparisonModel,
  onComparisonModelChange,
  isSweepEnabled,
  onToggleSweep,
  isExecuting,
  onExecute,
  onSaveScenario,
}) => {
  return (
    <div className="space-y-5 pb-12">
      {/* Sticky Execution Toolbar */}
      <div className="bg-[#111114] border border-[#27272a] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 sticky top-16 z-20 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Decision Model Selector */}
          <ModelSelector
            models={stage2Models}
            selectedModelId={selectedDecisionModel}
            onSelectModel={onSelectDecisionModel}
            stageBadge="Stage 2"
            label="System One Decision Engine"
          />

          {/* Comparison Model Selector */}
          {comparisonModel ? (
            <div className="flex items-center gap-1.5 bg-[#18181c] border border-cyan-500/30 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-mono text-cyan-400">VS</span>
              <ModelSelector
                models={stage2Models.filter((m) => m.id !== selectedDecisionModel)}
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
                const alt = stage2Models.find((m) => m.id !== selectedDecisionModel)?.id || 'typesafe/jev-1.14';
                onComparisonModelChange(alt);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#18181c] border border-[#27272a] hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <GitCompare className="w-3 h-3" />
              <span>+ Compare</span>
            </button>
          )}

          {/* 3x Sweep Toggle */}
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

        <div className="flex items-center gap-2">
          {/* Save Preset */}
          <button
            type="button"
            onClick={onSaveScenario}
            className="px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-[#27272a] transition-colors flex items-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Preset</span>
          </button>

          {/* Execute Directly */}
          <button
            type="button"
            onClick={onExecute}
            disabled={isExecuting || Object.keys(questions).length === 0}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg shadow-sm hover:shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-black ${isExecuting ? 'animate-pulse' : ''}`} />
            <span>{isExecuting ? 'Evaluating...' : 'Run Decision Engine'}</span>
          </button>
        </div>
      </div>

      {/* State Composer */}
      <StateEditor
        stateMode={stateMode}
        onStateModeChange={onStateModeChange}
        stateContent={stateContent}
        onStateContentChange={onStateContentChange}
      />

      {/* Questions Stack */}
      <QuestionStack
        questions={questions}
        onChange={onQuestionsChange}
        thresholds={thresholds}
        onThresholdsChange={onThresholdsChange}
      />
    </div>
  );
};
