import React from 'react';
import { Plus, Trash2, Copy, Layers, HelpCircle } from 'lucide-react';
import { QuestionDefinition, PrimitiveType, NoulQuestion, ChoiceQuestion, ScoreQuestion } from '../../types';
import { NoulEditor } from './NoulEditor';
import { ChoiceEditor } from './ChoiceEditor';
import { ScoreEditor } from './ScoreEditor';

interface QuestionStackProps {
  questions: Record<string, QuestionDefinition>;
  onChange: (updated: Record<string, QuestionDefinition>) => void;
  thresholds?: { reject: number; commit: number } | null;
  onThresholdsChange?: (t: { reject: number; commit: number }) => void;
}

export const QuestionStack: React.FC<QuestionStackProps> = ({
  questions,
  onChange,
  thresholds,
  onThresholdsChange,
}) => {
  const entries = Object.entries(questions);

  const handleAddQuestion = (type: PrimitiveType) => {
    const nextIndex = entries.length + 1;
    const qKey = `question_${nextIndex}`;

    let newQ: QuestionDefinition;
    if (type === 'noul') {
      newQ = {
        type: 'noul',
        instructions: 'Is the proposed action safe and compliant?',
        criteria: {
          true: 'Meets all safety boundaries and operational constraints.',
          false: 'Violates safety boundaries or poses unacceptable risk.',
        },
      };
    } else if (type === 'choice') {
      newQ = {
        type: 'choice',
        instructions: 'Which strategy should be selected?',
        criteria: {
          option_a: 'Balanced factual description of option A trade-offs.',
          option_b: 'Balanced factual description of option B trade-offs.',
        },
      };
    } else {
      newQ = {
        type: 'score',
        instructions: 'Rate the urgency or severity level.',
        criteria: [
          'Low: Minimal disruption or low priority.',
          'Medium: Noticeable degradation requiring standard SLA triage.',
          'High: Immediate critical intervention required.',
        ],
      };
    }

    onChange({ ...questions, [qKey]: newQ });
  };

  const handleUpdateQuestion = (qKey: string, updated: QuestionDefinition) => {
    onChange({ ...questions, [qKey]: updated });
  };

  const handleRenameKey = (oldKey: string, newKeyRaw: string) => {
    const slug = newKeyRaw.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (slug === oldKey || !slug) return;

    const updated: Record<string, QuestionDefinition> = {};
    for (const [k, v] of Object.entries(questions)) {
      if (k === oldKey) {
        updated[slug] = v;
      } else {
        updated[k] = v;
      }
    }
    onChange(updated);
  };

  const handleDuplicate = (qKey: string) => {
    const target = questions[qKey];
    if (!target) return;
    const copyKey = `${qKey}_copy`;
    onChange({ ...questions, [copyKey]: JSON.parse(JSON.stringify(target)) });
  };

  const handleDelete = (qKey: string) => {
    if (entries.length <= 1) return;
    const updated = { ...questions };
    delete updated[qKey];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header & Add Question Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Decision Questions Stack ({entries.length})
          </h3>
          <p className="text-[11px] text-zinc-500">
            Evaluated concurrently by the decision model against the shared state
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAddQuestion('noul')}
            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-xs font-mono font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Noul (Yes/No)</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('choice')}
            className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-md text-xs font-mono font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Choice</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('score')}
            className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-md text-xs font-mono font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Score</span>
          </button>
        </div>
      </div>

      {/* Questions Stack */}
      <div className="space-y-4">
        {entries.map(([qKey, q], idx) => (
          <div
            key={qKey}
            className="bg-[#111114] border border-[#27272a] rounded-xl p-4 space-y-3.5 shadow-sm"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[#27272a]/70 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-mono text-xs font-bold">#{idx + 1}</span>
                <input
                  type="text"
                  value={qKey}
                  onChange={(e) => handleRenameKey(qKey, e.target.value)}
                  className="bg-[#18181c] border border-[#27272a] rounded px-2 py-0.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500/50"
                  title="Click to rename question identifier"
                />
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase ${
                    q.type === 'noul'
                      ? 'bg-amber-500/10 text-amber-400'
                      : q.type === 'choice'
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'bg-purple-500/10 text-purple-400'
                  }`}
                >
                  {q.type}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDuplicate(qKey)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                  title="Duplicate question"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(qKey)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Embedded Editor */}
            {q.type === 'noul' && (
              <NoulEditor
                question={q as NoulQuestion}
                onChange={(updated) => handleUpdateQuestion(qKey, updated)}
                thresholds={thresholds}
                onThresholdsChange={onThresholdsChange}
              />
            )}
            {q.type === 'choice' && (
              <ChoiceEditor
                question={q as ChoiceQuestion}
                onChange={(updated) => handleUpdateQuestion(qKey, updated)}
              />
            )}
            {q.type === 'score' && (
              <ScoreEditor
                question={q as ScoreQuestion}
                onChange={(updated) => handleUpdateQuestion(qKey, updated)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
