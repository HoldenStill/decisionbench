import React from 'react';
import { Activity, Gauge } from 'lucide-react';
import { ScoreQuestion, ScoreAnswer, QuestionMetrics } from '../../types';
import { formatPercent, formatDelta } from '../../utils/formatters';

interface ScoreVisualizerProps {
  questionKey: string;
  question: ScoreQuestion;
  answer: ScoreAnswer;
  metrics: QuestionMetrics;
}

export const ScoreVisualizer: React.FC<ScoreVisualizerProps> = ({
  questionKey,
  question,
  answer,
  metrics,
}) => {
  const expectedScore = answer.score;
  const maxScore = Math.max(1, question.criteria.length - 1);
  const probabilities = answer.probabilities || {};
  const legend = answer.legend || {};

  const delta = metrics.deltas?.score;
  const scorePercent = Math.min(100, Math.max(0, (expectedScore / maxScore) * 100));

  return (
    <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-4 space-y-3.5">
      {/* Question Header & Expected Value */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Score (Ordinal Rubric)
            </span>
            <span className="font-mono text-xs text-zinc-400">#{questionKey}</span>
          </div>
          <h4 className="text-sm font-semibold text-zinc-100 mt-1">{question.instructions}</h4>
        </div>

        {/* Expected Value Callout */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-sm font-bold">
            <Gauge className="w-4 h-4 text-purple-400" />
            <span>Expected: {expectedScore.toFixed(2)} / {maxScore}.00</span>
          </div>
          {delta !== undefined && delta !== null && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                delta > 0
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : delta < 0
                  ? 'text-rose-400 bg-rose-500/10'
                  : 'text-zinc-500'
              }`}
            >
              Δ {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Continuous Needle Gauge */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>0.0 (Lowest)</span>
          <span className="text-purple-300 font-bold">Score: {expectedScore.toFixed(2)}</span>
          <span>{maxScore}.0 (Highest)</span>
        </div>

        <div className="relative h-3 bg-[#111114] border border-[#27272a] rounded-full overflow-visible">
          {/* Continuous gradient fill */}
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-amber-500 to-purple-500 rounded-full opacity-70"
            style={{ width: '100%' }}
          />

          {/* Needle Position */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full shadow-lg shadow-purple-500/50 transition-all duration-300"
            style={{ left: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Discrete Level Distributions */}
      <div className="space-y-2 pt-2 border-t border-[#27272a]/60">
        <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
          Rubric Levels Probability Distribution
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {question.criteria.map((desc, idx) => {
            const levelKey = String(idx);
            const prob = probabilities[levelKey] ?? 0.0;
            const legendLabel = legend[levelKey] || desc;

            return (
              <div
                key={idx}
                className="p-2 rounded bg-[#111114] border border-[#27272a] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono font-bold text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800 shrink-0">
                    Lvl {idx}
                  </span>
                  <span className="text-zinc-300 truncate" title={legendLabel}>
                    {legendLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 h-1.5 bg-[#18181c] rounded-full overflow-hidden border border-[#27272a]">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${prob * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-zinc-200 tabular-nums w-12 text-right">
                    {formatPercent(prob)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
