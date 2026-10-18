import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ScoreQuestion } from '../../types';

interface ScoreEditorProps {
  question: ScoreQuestion;
  onChange: (updated: ScoreQuestion) => void;
}

export const ScoreEditor: React.FC<ScoreEditorProps> = ({ question, onChange }) => {
  const levels = question.criteria || [];

  const handleInstructionsChange = (instructions: string) => {
    onChange({ ...question, instructions });
  };

  const handleLevelChange = (index: number, newDesc: string) => {
    const updated = [...levels];
    updated[index] = newDesc;
    onChange({ ...question, criteria: updated });
  };

  const handleAddLevel = () => {
    if (levels.length >= 10) return;
    onChange({
      ...question,
      criteria: [...levels, `Level ${levels.length} criteria definition...`],
    });
  };

  const handleRemoveLevel = (index: number) => {
    if (levels.length <= 2) return;
    const updated = levels.filter((_, idx) => idx !== index);
    onChange({ ...question, criteria: updated });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= levels.length) return;
    const updated = [...levels];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange({ ...question, criteria: updated });
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
          placeholder="e.g. Rate the maintenance and operational complexity of this architecture."
          className="w-full bg-[#18181c] border border-[#27272a] rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Levels Header */}
      <div className="flex items-center justify-between pt-1">
        <label className="font-semibold text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
          Ordered Rubric Levels (Index 0 = lowest, {levels.length - 1} = highest)
        </label>
        <span className="text-[11px] font-mono text-purple-400">
          {levels.length} / 10 levels max
        </span>
      </div>

      {/* Levels List */}
      <div className="space-y-2">
        {levels.map((desc, idx) => (
          <div
            key={idx}
            className="p-2 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center gap-2"
          >
            <span className="font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-xs shrink-0 w-16 text-center">
              Lvl {idx}
            </span>
            <input
              type="text"
              value={desc}
              onChange={(e) => handleLevelChange(idx, e.target.value)}
              placeholder={`Description for rubric level ${idx}...`}
              className="flex-1 bg-[#111114] border border-[#27272a] rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleMove(idx, 'up')}
                disabled={idx === 0}
                className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                title="Move up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(idx, 'down')}
                disabled={idx === levels.length - 1}
                className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                title="Move down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              {levels.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLevel(idx)}
                  className="p-1 text-zinc-500 hover:text-rose-400 ml-1"
                  title="Remove level"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Level Button */}
      {levels.length < 10 && (
        <button
          type="button"
          onClick={handleAddLevel}
          className="w-full py-2 border border-dashed border-[#27272a] hover:border-purple-500/50 hover:bg-purple-500/5 rounded-lg text-purple-400 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Next Rubric Level (Index {levels.length})</span>
        </button>
      )}
    </div>
  );
};
