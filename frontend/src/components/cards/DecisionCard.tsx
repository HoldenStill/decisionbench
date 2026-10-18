import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  RefreshCw,
  Code,
  Bookmark,
  Share2,
  FileDown,
  Layers,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import {
  ExecuteResponse,
  QuestionDefinition,
  NoulQuestion,
  ChoiceQuestion,
  ScoreQuestion,
  NoulAnswer,
  ChoiceAnswer,
  ScoreAnswer,
  ThresholdSettings
} from '../../types';
import { SplitTelemetryRibbon } from './SplitTelemetryRibbon';
import { NoulVisualizer } from './NoulVisualizer';
import { ChoiceVisualizer } from './ChoiceVisualizer';
import { ScoreVisualizer } from './ScoreVisualizer';
import { ExtractedStateInspector } from './ExtractedStateInspector';

interface DecisionCardProps {
  decision: ExecuteResponse;
  thresholds?: ThresholdSettings | null;
  onReRunDecision: (
    parentRunId: string,
    tweakedState: any,
    tweakedQuestions: Record<string, QuestionDefinition>
  ) => Promise<void>;
  onOpenInWorkbench: (
    state: any,
    questions: Record<string, QuestionDefinition>,
    rawPrompt?: string | null
  ) => void;
  onOpenCodeDrawer: (decision: ExecuteResponse) => void;
  onSaveScenario: (
    name: string,
    state: any,
    questions: Record<string, QuestionDefinition>
  ) => Promise<void>;
  isReRunning: boolean;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  thresholds,
  onReRunDecision,
  onOpenInWorkbench,
  onOpenCodeDrawer,
  onSaveScenario,
  isReRunning,
}) => {
  const [localState, setLocalState] = useState(decision.state);
  const [localQuestions, setLocalQuestions] = useState(decision.questions);
  const [savingScenario, setSavingScenario] = useState(false);

  const handleReRun = async () => {
    await onReRunDecision(decision.run_id, localState, localQuestions);
  };

  const handleSaveScenarioClick = async () => {
    const name = prompt('Enter a name for this Scenario preset:');
    if (name && name.trim()) {
      setSavingScenario(true);
      try {
        await onSaveScenario(name.trim(), localState, localQuestions);
      } finally {
        setSavingScenario(false);
      }
    }
  };

  return (
    <div className="bg-[#111114] border border-[#27272a] rounded-xl shadow-xl overflow-hidden space-y-4 p-4 transition-all">
      {/* Top Split Telemetry Ribbon */}
      <SplitTelemetryRibbon
        stage1={decision.stage1_telemetry}
        stage2={decision.stage2_telemetry}
      />

      {/* Questions & Probability Visualizers Stack */}
      <div className="space-y-3.5">
        {Object.entries(decision.questions).map(([qKey, question]) => {
          const answer = decision.answers[qKey];
          const metrics = decision.metrics[qKey] || {
            entropy: 0,
            normalized_entropy: 0,
            certainty: 0,
          };

          if (!answer) return null;

          if (question.type === 'noul') {
            return (
              <NoulVisualizer
                key={qKey}
                questionKey={qKey}
                question={question as NoulQuestion}
                answer={answer as NoulAnswer}
                metrics={metrics}
                thresholds={thresholds}
              />
            );
          } else if (question.type === 'choice') {
            return (
              <ChoiceVisualizer
                key={qKey}
                questionKey={qKey}
                question={question as ChoiceQuestion}
                answer={answer as ChoiceAnswer}
                metrics={metrics}
              />
            );
          } else if (question.type === 'score') {
            return (
              <ScoreVisualizer
                key={qKey}
                questionKey={qKey}
                question={question as ScoreQuestion}
                answer={answer as ScoreAnswer}
                metrics={metrics}
              />
            );
          }
          return null;
        })}
      </div>

      {/* Extracted State & Options Inspector (Live Anti-Bias Tuning) */}
      <ExtractedStateInspector
        stateContent={localState}
        stateMode={decision.state_mode}
        questions={localQuestions}
        onStateChange={setLocalState}
        onQuestionsChange={setLocalQuestions}
      />

      {/* Bottom Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#27272a]">
        <div className="flex items-center gap-2">
          {/* Re-Run Decision Model Button */}
          <button
            type="button"
            onClick={handleReRun}
            disabled={isReRunning}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Bypass Stage 1 parser and re-evaluate this modified schema directly against Jev in ~200ms"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReRunning ? 'animate-spin' : ''}`} />
            <span>Re-Run Decision Model (Bypass Parser)</span>
          </button>

          {/* Open in Direct Workbench */}
          <button
            type="button"
            onClick={() => onOpenInWorkbench(localState, localQuestions, decision.raw_prompt)}
            className="px-3 py-1.5 bg-[#18181c] hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-[#27272a] hover:border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Open in Direct Builder</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Save as Reusable Scenario */}
          <button
            type="button"
            onClick={handleSaveScenarioClick}
            disabled={savingScenario}
            className="px-2.5 py-1.5 bg-[#18181c] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono rounded-lg border border-[#27272a] transition-colors flex items-center gap-1.5"
            title="Save schema as reusable scenario"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Preset</span>
          </button>

          {/* Code Drawer Trigger */}
          <button
            type="button"
            onClick={() => onOpenCodeDrawer(decision)}
            className="px-2.5 py-1.5 bg-[#18181c] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono rounded-lg border border-[#27272a] transition-colors flex items-center gap-1.5"
            title="Inspect compiled payload and generate Python/TypeScript/cURL snippets"
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>View Code & JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
