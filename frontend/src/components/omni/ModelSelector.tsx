import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Cpu, Sparkles, Check } from 'lucide-react';
import { ModelItem } from '../../types';

interface ModelSelectorProps {
  models: ModelItem[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  label?: string;
  stageBadge?: 'Stage 1' | 'Stage 2';
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  label,
  stageBadge,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId) || {
    id: selectedModelId,
    name: selectedModelId,
    provider: 'Custom',
    tags: ['Custom'],
    is_free: false,
    stage: stageBadge === 'Stage 1' ? 'stage1' : 'stage2',
    is_default: false,
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#18181c] border border-[#27272a] hover:border-amber-500/40 text-xs font-mono text-zinc-200 transition-colors shadow-sm"
      >
        {stageBadge && (
          <span className="text-[10px] font-sans font-semibold px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {stageBadge}
          </span>
        )}
        <span className="font-medium truncate max-w-[140px] text-zinc-100">
          {selectedModel.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-[#111114] border border-[#27272a] rounded-xl shadow-2xl z-50 p-1.5 space-y-1 max-h-72 overflow-y-auto animate-in fade-in duration-100">
          {label && (
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-[#27272a]/60">
              {label}
            </div>
          )}
          {models.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <div
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  setIsOpen(false);
                }}
                className={`p-2 rounded-lg cursor-pointer transition-colors space-y-0.5 ${
                  isSelected ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-zinc-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}>
                    {model.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {model.is_free ? (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        FREE
                      </span>
                    ) : model.input_cost_per_m ? (
                      <span className="text-[9px] font-mono text-zinc-400">
                        ${model.input_cost_per_m}/M
                      </span>
                    ) : null}
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 truncate">{model.id}</div>
                {model.description && (
                  <div className="text-[10px] text-zinc-400 line-clamp-1 leading-tight pt-0.5">
                    {model.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
