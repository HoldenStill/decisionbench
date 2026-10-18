import React, { useState } from 'react';
import { Plus, Trash2, Clipboard, ArrowDown } from 'lucide-react';
import { ChoiceQuestion } from '../../types';

interface ChoiceEditorProps {
  question: ChoiceQuestion;
  onChange: (updated: ChoiceQuestion) => void;
}

export const ChoiceEditor: React.FC<ChoiceEditorProps> = ({ question, onChange }) => {
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const criteria = question.criteria || {};
  const entries = Object.entries(criteria);

  const handleInstructionsChange = (instructions: string) => {
    onChange({ ...question, instructions });
  };

  const handleKeyChange = (oldKey: string, newKeyRaw: string) => {
    const slug = newKeyRaw.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (slug === oldKey) return;

    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(criteria)) {
      if (k === oldKey) {
        updated[slug || 'option'] = v;
      } else {
        updated[k] = v;
      }
    }
    onChange({ ...question, criteria: updated });
  };

  const handleDescChange = (optKey: string, newDesc: string) => {
    onChange({
      ...question,
      criteria: {
        ...criteria,
        [optKey]: newDesc,
      },
    });
  };

  const handleAddOption = () => {
    const nextNum = entries.length + 1;
    const nextKey = `option_${nextNum}`;
    onChange({
      ...question,
      criteria: {
        ...criteria,
        [nextKey]: '',
      },
    });
  };

  const handleRemoveOption = (optKey: string) => {
    if (entries.length <= 2) return;
    const updated = { ...criteria };
    delete updated[optKey];
    onChange({ ...question, criteria: updated });
  };

  const handleBulkPasteApply = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length >= 2) {
      const newCriteria: Record<string, string> = {};
      lines.forEach((line, idx) => {
        // If line contains colon "key: description", split it
        let key = `option_${idx + 1}`;
        let desc = line;
        if (line.includes(':')) {
          const parts = line.split(':');
          key = parts[0].trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
          desc = parts.slice(1).join(':').trim();
        }
        newCriteria[key] = desc;
      });
      onChange({ ...question, criteria: newCriteria });
      setBulkText('');
      setShowBulkPaste(false);
    }
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
          placeholder="e.g. Which database engine is best suited for this deployment?"
          className="w-full bg-[#18181c] border border-[#27272a] rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Options Header & Bulk Paste Trigger */}
      <div className="flex items-center justify-between pt-1">
        <label className="font-semibold text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
          Mutually Exclusive Options ({entries.length} / 255 max)
        </label>
        <button
          type="button"
          onClick={() => setShowBulkPaste(!showBulkPaste)}
          className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center gap-1"
        >
          <Clipboard className="w-3 h-3" />
          <span>{showBulkPaste ? 'Close Bulk Paste' : 'Bulk Paste Lines'}</span>
        </button>
      </div>

      {/* Bulk Paste Box */}
      {showBulkPaste && (
        <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg space-y-2">
          <p className="text-[11px] text-zinc-400">
            Paste one option per line. You can format as <code>slug: description</code> or plain descriptions.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="sqlite_wal: Embedded single-file database\npostgresql: Client-server database"
            className="w-full bg-[#18181c] border border-[#27272a] rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none min-h-[80px]"
          />
          <button
            type="button"
            onClick={handleBulkPasteApply}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded text-xs"
          >
            Apply Options
          </button>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2">
        {entries.map(([optKey, desc], idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-[#18181c] border border-[#27272a] space-y-1.5 focus-within:border-cyan-500/40"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 w-5 text-right">{idx + 1}.</span>
              <input
                type="text"
                value={optKey}
                onChange={(e) => handleKeyChange(optKey, e.target.value)}
                placeholder="option_key"
                className="w-40 bg-[#111114] border border-[#27272a] rounded px-2 py-1 font-mono text-cyan-400 text-xs focus:outline-none focus:border-cyan-500/50"
              />
              <span className="text-zinc-600 text-xs">:</span>
              <input
                type="text"
                value={desc}
                onChange={(e) => handleDescChange(optKey, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
                placeholder="Symmetrical, balanced criteria description..."
                className="flex-1 bg-[#111114] border border-[#27272a] rounded px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
              />
              {entries.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(optKey)}
                  className="p-1 text-zinc-500 hover:text-rose-400"
                  title="Remove option"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Option Button */}
      <button
        type="button"
        onClick={handleAddOption}
        className="w-full py-2 border border-dashed border-[#27272a] hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-lg text-cyan-400 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Option Row (or press Enter in description)</span>
      </button>
    </div>
  );
};
