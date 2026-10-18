import React, { useState } from 'react';
import { Trophy, HelpCircle, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { ChoiceQuestion, ChoiceAnswer, QuestionMetrics } from '../../types';
import { formatPercent, formatDelta } from '../../utils/formatters';

interface ChoiceVisualizerProps {
  questionKey: string;
  question: ChoiceQuestion;
  answer: ChoiceAnswer;
  metrics: QuestionMetrics;
}

export const ChoiceVisualizer: React.FC<ChoiceVisualizerProps> = ({
  questionKey,
  question,
  answer,
  metrics,
}) => {
  const [showOriginalOrder, setShowOriginalOrder] = useState(false);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  const winningChoice = answer.choice;
  const probabilities = answer.probabilities || {};

  // Sort options
  const optionEntries = Object.entries(probabilities);
  const sortedEntries = showOriginalOrder
    ? optionEntries
    : [...optionEntries].sort(([, pA], [, pB]) => pB - pA);

  return (
    <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-4 space-y-3.5">
      {/* Question Header & Telemetry Badges */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Choice ({optionEntries.length} options)
            </span>
            <span className="font-mono text-xs text-zinc-400">#{questionKey}</span>
          </div>
          <h4 className="text-sm font-semibold text-zinc-100 mt-1">{question.instructions}</h4>
        </div>

        {/* Derived Math Metrics Badges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Winner: {winningChoice}</span>
          </div>
          {metrics.top2_margin !== null && metrics.top2_margin !== undefined && (
            <div className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300">
              <span className="text-zinc-500 mr-1">Margin ΔP:</span>
              <span className="text-amber-400 font-bold">{formatPercent(metrics.top2_margin)}</span>
            </div>
          )}
          <div className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300">
            <span className="text-zinc-500 mr-1">Entropy H:</span>
            <span>{metrics.entropy.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Ranked Probability Bars */}
      <div className="space-y-2.5 pt-1">
        {sortedEntries.map(([optKey, prob]) => {
          const isWinner = optKey === winningChoice;
          const criteriaText = question.criteria[optKey] || '';
          const delta = metrics.deltas?.[optKey];
          const isExpanded = expandedOption === optKey;

          return (
            <div
              key={optKey}
              className={`p-2.5 rounded-lg border transition-all ${
                isWinner
                  ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                  : 'bg-[#111114] border-[#27272a]'
              }`}
            >
              {/* Option Bar Header */}
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isWinner ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {optKey}
                  </span>
                  {isWinner && (
                    <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      1st
                    </span>
                  )}
                  {delta !== undefined && delta !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        delta > 0
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : delta < 0
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-zinc-500'
                      }`}
                    >
                      Δ {formatDelta(delta)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-bold tabular-nums ${isWinner ? 'text-emerald-400 text-sm' : 'text-zinc-300'}`}>
                    {formatPercent(prob)}
                  </span>
                  {criteriaText && (
                    <button
                      type="button"
                      onClick={() => setExpandedOption(isExpanded ? null : optKey)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Inspect criteria"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-[#18181c] rounded-full overflow-hidden border border-[#27272a]/80">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isWinner
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-cyan-600 to-cyan-500'
                  }`}
                  style={{ width: `${Math.max(2, prob * 100)}%` }}
                />
              </div>

              {/* Expandable Criteria Description */}
              {isExpanded && criteriaText && (
                <div className="mt-2 text-xs text-zinc-400 bg-[#18181c] p-2 rounded border border-[#27272a] leading-relaxed">
                  <span className="text-zinc-500 font-mono text-[10px] block mb-0.5">Synthesized Criteria:</span>
                  {criteriaText}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer controls: toggle sort */}
      {optionEntries.length > 2 && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => setShowOriginalOrder(!showOriginalOrder)}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showOriginalOrder ? 'Sort by Probability ↓' : 'Show Original Schema Order'}
          </button>
        </div>
      )}
    </div>
  );
};
