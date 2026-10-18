import React from 'react';
import { Settings, Sparkles, Sliders, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface HeaderProps {
  activeMode: 'auto_compile' | 'direct';
  onModeChange: (mode: 'auto_compile' | 'direct') => void;
  isConfigured: boolean;
  maskedKey: string;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onModeChange,
  isConfigured,
  maskedKey,
  onOpenSettings,
}) => {
  return (
    <header className="h-14 border-b border-[#27272a] bg-[#111114] px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shadow-amber-500/10">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-zinc-100">DecisionBench</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              System One
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono tracking-tight -mt-0.5">
            Probabilistic Decision Studio & Workbench
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-[#18181c] p-1 rounded-lg border border-[#27272a]">
        <button
          onClick={() => onModeChange('auto_compile')}
          className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all ${
            activeMode === 'auto_compile'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Compile Prompt</span>
        </button>
        <button
          onClick={() => onModeChange('direct')}
          className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all ${
            activeMode === 'direct'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Direct Schema Workbench</span>
        </button>
      </div>

      {/* Right Controls: API Key Badge & Settings Button */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
            isConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
          }`}
          title={isConfigured ? `API Key configured: ${maskedKey}` : 'OpenRouter API Key required'}
        >
          {isConfigured ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{maskedKey || 'Key Active'}</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Set OpenRouter Key</span>
            </>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-[#27272a] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
