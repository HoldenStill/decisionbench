import React from 'react';
import { GitCompare, CheckCircle2, AlertCircle } from 'lucide-react';
import { ExecuteResponse, ComparisonResult, ChoiceAnswer, NoulAnswer } from '../../types';
import { formatPercent } from '../../utils/formatters';

interface ComparisonCardProps {
  decision: ExecuteResponse;
  comparison: ComparisonResult;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ decision, comparison }) => {
  const modelA = decision.stage2_telemetry.model_served || decision.stage2_telemetry.model_requested;
  const modelB = comparison.model_served || comparison.model_requested;

  return (
    <div className="bg-[#111114] border border-cyan-500/30 rounded-xl p-4 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-zinc-100 font-mono">
            Side-by-Side Model Comparison
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-amber-400 font-bold">{modelA}</span>
          <span className="text-zinc-500">vs</span>
          <span className="text-cyan-400 font-bold">{modelB}</span>
        </div>
      </div>

      {/* Questions Comparison Matrix */}
      <div className="space-y-4">
        {Object.entries(decision.questions).map(([qKey, question]) => {
          if (question.type === 'choice') {
            const ansA = decision.answers[qKey] as ChoiceAnswer | undefined;
            const ansB = comparison.answers[qKey] as ChoiceAnswer | undefined;
            if (!ansA || !ansB) return null;

            const winnerA = ansA.choice;
            const winnerB = ansB.choice;
            const isAgree = winnerA === winnerB;

            return (
              <div key={qKey} className="bg-[#18181c] border border-[#27272a] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-zinc-300">#{qKey}</span>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    {isAgree ? (
                      <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Models Agree: {winnerA}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Divergence: {winnerA} vs {winnerB}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid Comparison */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Model A */}
                  <div className="bg-[#111114] p-2.5 rounded border border-amber-500/20 space-y-1.5">
                    <div className="text-[11px] font-mono font-semibold text-amber-400">
                      {modelA}
                    </div>
                    {Object.entries(ansA.probabilities || {}).map(([opt, p]) => (
                      <div key={opt} className="flex justify-between text-xs font-mono">
                        <span className={opt === winnerA ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
                          {opt}
                        </span>
                        <span className="text-zinc-300">{formatPercent(Number(p))}</span>
                      </div>
                    ))}
                  </div>

                  {/* Model B */}
                  <div className="bg-[#111114] p-2.5 rounded border border-cyan-500/20 space-y-1.5">
                    <div className="text-[11px] font-mono font-semibold text-cyan-400">
                      {modelB}
                    </div>
                    {Object.entries(ansB.probabilities || {}).map(([opt, p]) => (
                      <div key={opt} className="flex justify-between text-xs font-mono">
                        <span className={opt === winnerB ? 'text-cyan-400 font-bold' : 'text-zinc-400'}>
                          {opt}
                        </span>
                        <span className="text-zinc-300">{formatPercent(Number(p))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          } else if (question.type === 'noul') {
            const ansA = decision.answers[qKey] as NoulAnswer | undefined;
            const ansB = comparison.answers[qKey] as NoulAnswer | undefined;
            if (!ansA || !ansB) return null;

            const pA = ansA.noul;
            const pB = ansB.noul;
            const diff = Math.abs(pA - pB);

            return (
              <div key={qKey} className="bg-[#18181c] border border-[#27272a] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-zinc-300">#{qKey} (Noul)</span>
                  <span className="text-xs font-mono text-zinc-400">
                    Delta |P_A - P_B|: <strong className="text-amber-400">{formatPercent(diff)}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-[#111114] p-2.5 rounded border border-amber-500/20 flex justify-between">
                    <span className="text-amber-400">{modelA}</span>
                    <span className="font-bold text-zinc-200">P(yes) = {formatPercent(pA)}</span>
                  </div>
                  <div className="bg-[#111114] p-2.5 rounded border border-cyan-500/20 flex justify-between">
                    <span className="text-cyan-400">{modelB}</span>
                    <span className="font-bold text-zinc-200">P(yes) = {formatPercent(pB)}</span>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
