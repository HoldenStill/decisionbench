import React from 'react';
import { NoulQuestion, NoulAnswer, QuestionMetrics } from '../../types';
import { formatPercent, formatDelta } from '../../utils/formatters';

interface NoulVisualizerProps {
  questionKey: string;
  question: NoulQuestion;
  answer: NoulAnswer;
  metrics: QuestionMetrics;
  thresholds?: { reject: number; commit: number } | null;
}

export const NoulVisualizer: React.FC<NoulVisualizerProps> = ({
  questionKey,
  question,
  answer,
  metrics,
  thresholds,
}) => {
  const pYes = answer.noul;
  const pNo = 1.0 - pYes;
  const rejectCutoff = thresholds?.reject ?? 0.35;
  const commitCutoff = thresholds?.commit ?? 0.75;

  let verdictColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  let verdictLabel = 'REVIEW / TOSS-UP';
  if (pYes >= commitCutoff) {
    verdictColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    verdictLabel = 'COMMIT / YES';
  } else if (pYes <= rejectCutoff) {
    verdictColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    verdictLabel = 'REJECT / NO';
  }

  const delta = metrics.deltas?.noul;

  return (
    <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-4 space-y-3">
      {/* Question Header & Verdict Badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Noul (Binary)
            </span>
            <span className="font-mono text-xs text-zinc-400">#{questionKey}</span>
          </div>
          <h4 className="text-sm font-semibold text-zinc-100 mt-1">{question.instructions}</h4>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${verdictColor}`}>
            {verdictLabel}
          </span>
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
              Δ {formatDelta(delta)}
            </span>
          )}
        </div>
      </div>

      {/* Main Probability Gauge */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-rose-400">P(no): {formatPercent(pNo)}</span>
          <span className="text-zinc-400 text-[11px]">
            Certainty: {formatPercent(metrics.certainty)} (|P - 0.5| = {Math.abs(pYes - 0.5).toFixed(3)})
          </span>
          <span className="text-emerald-400 font-bold">P(yes): {formatPercent(pYes)}</span>
        </div>

        {/* Continuous Bar Gauge */}
        <div className="relative h-4 bg-[#111114] border border-[#27272a] rounded-full overflow-hidden">
          {/* Shaded Threshold Zones */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-rose-500/10 border-r border-rose-500/30"
            style={{ width: `${rejectCutoff * 100}%` }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 bg-emerald-500/10 border-l border-emerald-500/30"
            style={{ width: `${(1 - commitCutoff) * 100}%` }}
          />

          {/* Probability Fill */}
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${pYes * 100}%` }}
          />

          {/* 0.50 Midpoint Uncertainty Tick */}
          <div
            className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-400/80 -translate-x-1/2 shadow-sm"
            title="0.50 Maximum Uncertainty Midpoint"
          />
        </div>

        {/* Legend beneath the bar */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
          <span>0.00 (Reject zone ≤ {rejectCutoff})</span>
          <span className="text-amber-400/90">0.50 (Toss-Up)</span>
          <span>1.00 (Commit zone ≥ {commitCutoff})</span>
        </div>
      </div>
    </div>
  );
};
