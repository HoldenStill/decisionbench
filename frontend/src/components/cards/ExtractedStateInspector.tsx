import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Trash2,
  Sliders,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { QuestionDefinition, PrimitiveType } from '../../types';

interface ExtractedStateInspectorProps {
  stateContent: any;
  stateMode: 'text' | 'json';
  questions: Record<string, QuestionDefinition>;
  onStateChange: (newState: any) => void;
  onQuestionsChange: (newQuestions: Record<string, QuestionDefinition>) => void;
}

export const ExtractedStateInspector: React.FC<ExtractedStateInspectorProps> = ({
  stateContent,
  stateMode,
  questions,
  onStateChange,
  onQuestionsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingState, setEditingState] = useState(false);
  const [localStateText, setLocalStateText] = useState(
    typeof stateContent === 'object' ? JSON.stringify(stateContent, null, 2) : String(stateContent)
  );

  const handleStateSave = () => {
    if (stateMode === 'json') {
      try {
        const parsed = JSON.parse(localStateText);
        onStateChange(parsed);
      } catch {
        onStateChange(localStateText);
      }
    } else {
      onStateChange(localStateText);
    }
    setEditingState(false);
  };

  const handleUpdateCriteria = (qKey: string, optKey: string, newDesc: string) => {
    const q = questions[qKey];
    if (!q) return;

    if (q.type === 'choice') {
      const updatedCriteria = { ...q.criteria, [optKey]: newDesc };
      onQuestionsChange({
        ...questions,
        [qKey]: { ...q, criteria: updatedCriteria },
      });
    } else if (q.type === 'noul') {
      const updatedCriteria = { ...(q.criteria || {}), [optKey]: newDesc };
      onQuestionsChange({
        ...questions,
        [qKey]: { ...q, criteria: updatedCriteria },
      });
    }
  };

  const handleUpdateScoreLevel = (qKey: string, index: number, newDesc: string) => {
    const q = questions[qKey];
    if (q && q.type === 'score') {
      const updated = [...q.criteria];
      updated[index] = newDesc;
      onQuestionsChange({
        ...questions,
        [qKey]: { ...q, criteria: updated },
      });
    }
  };

  const handleAddChoiceOption = (qKey: string) => {
    const q = questions[qKey];
    if (q && q.type === 'choice') {
      const nextIndex = Object.keys(q.criteria).length + 1;
      const newKey = `option_${nextIndex}`;
      onQuestionsChange({
        ...questions,
        [qKey]: {
          ...q,
          criteria: {
            ...q.criteria,
            [newKey]: 'Objective balanced description for this newly added alternative.',
          },
        },
      });
    }
  };

  const handleRemoveChoiceOption = (qKey: string, optKey: string) => {
    const q = questions[qKey];
    if (q && q.type === 'choice' && Object.keys(q.criteria).length > 2) {
      const updated = { ...q.criteria };
      delete updated[optKey];
      onQuestionsChange({
        ...questions,
        [qKey]: { ...q, criteria: updated },
      });
    }
  };

  return (
    <div className="bg-[#111114] border border-[#27272a] rounded-xl overflow-hidden transition-all">
      {/* Accordion Toggle Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-[#18181c]/60 hover:bg-[#18181c] cursor-pointer flex items-center justify-between border-b border-[#27272a]/70 select-none transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-200">
            Extracted State & Options Inspector (Live Anti-Bias Tuning)
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {Object.keys(questions).length} questions
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>{isOpen ? 'Collapse' : 'Inspect & Edit Criteria'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 space-y-4 text-xs">
          {/* State Inspector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
                Evaluated State / Constraints ({stateMode})
              </span>
              <button
                type="button"
                onClick={() => {
                  if (editingState) handleStateSave();
                  else setEditingState(true);
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>{editingState ? 'Save State' : 'Edit State'}</span>
              </button>
            </div>
            {editingState ? (
              <textarea
                value={localStateText}
                onChange={(e) => setLocalStateText(e.target.value)}
                className="w-full bg-[#18181c] border border-amber-500/50 rounded-md p-2.5 text-xs font-mono text-zinc-200 focus:outline-none min-h-[90px]"
              />
            ) : (
              <div className="bg-[#18181c] border border-[#27272a] rounded-md p-2.5 font-mono text-zinc-300 text-[11px] leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                {localStateText}
              </div>
            )}
          </div>

          <hr className="border-[#27272a]/60" />

          {/* Questions & Criteria Inspector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
                Synthesized Criteria Descriptions
              </span>
              <span className="text-[10px] text-zinc-500">
                Directly tune criteria to test sensitivity or remove compiler bias
              </span>
            </div>

            {Object.entries(questions).map(([qKey, q]) => (
              <div key={qKey} className="bg-[#18181c] border border-[#27272a] rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    #{qKey} ({q.type})
                  </span>
                  <span className="text-[11px] text-zinc-400 italic">"{q.instructions}"</span>
                </div>

                {/* Criteria editors per type */}
                {q.type === 'choice' && (
                  <div className="space-y-2">
                    {Object.entries(q.criteria).map(([optKey, desc]) => (
                      <div key={optKey} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-cyan-400 font-semibold">
                            {optKey}
                          </span>
                          {Object.keys(q.criteria).length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChoiceOption(qKey, optKey)}
                              className="text-[10px] text-zinc-500 hover:text-rose-400 font-mono"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={desc}
                          onChange={(e) => handleUpdateCriteria(qKey, optKey, e.target.value)}
                          className="w-full bg-[#111114] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddChoiceOption(qKey)}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Option on the Fly</span>
                    </button>
                  </div>
                )}

                {q.type === 'noul' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-emerald-400 font-semibold block">
                        true criteria:
                      </span>
                      <textarea
                        value={q.criteria?.true || ''}
                        onChange={(e) => handleUpdateCriteria(qKey, 'true', e.target.value)}
                        className="w-full bg-[#111114] border border-[#27272a] rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-rose-400 font-semibold block">
                        false criteria:
                      </span>
                      <textarea
                        value={q.criteria?.false || ''}
                        onChange={(e) => handleUpdateCriteria(qKey, 'false', e.target.value)}
                        className="w-full bg-[#111114] border border-[#27272a] rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500/50 min-h-[60px]"
                      />
                    </div>
                  </div>
                )}

                {q.type === 'score' && (
                  <div className="space-y-1.5">
                    {q.criteria.map((desc, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-zinc-500 text-xs w-12 shrink-0">
                          Lvl {idx}:
                        </span>
                        <input
                          type="text"
                          value={desc}
                          onChange={(e) => handleUpdateScoreLevel(qKey, idx, e.target.value)}
                          className="flex-1 bg-[#111114] border border-[#27272a] rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
