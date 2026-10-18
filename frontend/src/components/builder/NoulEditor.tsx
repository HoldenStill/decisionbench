import React, { useState } from 'react';
import { NoulQuestion } from '../../types';

interface NoulEditorProps {
  question: NoulQuestion;
  onChange: (updated: NoulQuestion) => void;
  thresholds?: { reject: number; commit: number } | null;
  onThresholdsChange?: (t: { reject: number; commit: number }) => void;
}

export const NoulEditor: React.FC<NoulEditorProps> = ({
  question,
  onChange,
  thresholds,
  onThresholdsChange,
}) => {
  const [rejectVal, setRejectVal] = useState(thresholds?.reject ?? 0.35);
  const [commitVal, setCommitVal] = useState(thresholds?.commit ?? 0.75);

  const handleInstructionsChange = (instructions: string) => {
    onChange({ ...question, instructions });
  };

  const handleTrueCriteriaChange = (trueDesc: string) => {
    onChange({
      ...question,
      criteria: {
        ...(question.criteria || {}),
        true: trueDesc,
      },
    });
  };

  const handleFalseCriteriaChange = (falseDesc: string) => {
    onChange({
      ...question,
      criteria: {
        ...(question.criteria || {}),
        false: falseDesc,
      },
    });
  };

  const handleRejectChange = (val: number) => {
    const clamped = Math.min(val, commitVal - 0.05);
    setRejectVal(clamped);
    onThresholdsChange?.({ reject: clamped, commit: commitVal });
  };

  const handleCommitChange = (val: number) => {
    const clamped = Math.max(val, rejectVal + 0.05);
    setCommitVal(clamped);
    onThresholdsChange?.({ reject: rejectVal, commit: clamped });
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Instructions */}
      <div className="space-y-1">
        <label className="font-semibold text-zinc-300">Question Instructions</label>
        <input
          type="text"
          value={question.instructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="e.g. Is it safe to execute this command without human confirmation?"
          className="w-full bg-[#18181c] border border-[#27272a] rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Symmetrical Criteria Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] text-emerald-400 font-semibold">
              'true' Criteria Description (Yes / Commit)
            </label>
          </div>
          <textarea
            value={question.criteria?.true || ''}
            onChange={(e) => handleTrueCriteriaChange(e.target.value)}
            placeholder="Neutral conditions under which the affirmative decision holds..."
            className="w-full bg-[#18181c] border border-[#27272a] rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 min-h-[70px]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] text-rose-400 font-semibold">
              'false' Criteria Description (No / Reject)
            </label>
          </div>
          <textarea
            value={question.criteria?.false || ''}
            onChange={(e) => handleFalseCriteriaChange(e.target.value)}
            placeholder="Neutral conditions under which the negative decision holds..."
            className="w-full bg-[#18181c] border border-[#27272a] rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500/50 min-h-[70px]"
          />
        </div>
      </div>

      {/* Interactive Tri-State Threshold Gate */}
      <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-300 font-mono text-[11px] uppercase">
            Tri-State Threshold Gate Cutoffs
          </span>
          <span className="font-mono text-[11px] text-zinc-400">
            Reject ≤ <strong className="text-rose-400">{rejectVal.toFixed(2)}</strong> |
            Review |
            Commit ≥ <strong className="text-emerald-400">{commitVal.toFixed(2)}</strong>
          </span>
        </div>

        {/* Dual Range Visualizer */}
        <div className="relative h-4 bg-[#18181c] rounded-full overflow-hidden border border-[#27272a]">
          <div
            className="absolute top-0 bottom-0 left-0 bg-rose-500/20 border-r border-rose-500"
            style={{ width: `${rejectVal * 100}%` }}
          />
          <div
            className="absolute top-0 bottom-0 bg-amber-500/20"
            style={{
              left: `${rejectVal * 100}%`,
              width: `${(commitVal - rejectVal) * 100}%`,
            }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 bg-emerald-500/20 border-l border-emerald-500"
            style={{ width: `${(1 - commitVal) * 100}%` }}
          />
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono">Reject Threshold Slider:</span>
            <input
              type="range"
              min="0.0"
              max="0.45"
              step="0.01"
              value={rejectVal}
              onChange={(e) => handleRejectChange(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono">Commit Threshold Slider:</span>
            <input
              type="range"
              min="0.55"
              max="1.0"
              step="0.01"
              value={commitVal}
              onChange={(e) => handleCommitChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
