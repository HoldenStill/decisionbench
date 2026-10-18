import React from 'react';
import { Cpu, Sparkles, Clock, Coins, TrendingUp } from 'lucide-react';
import { Stage1Telemetry, Stage2Telemetry } from '../../types';
import { formatLatency, formatMicroCost } from '../../utils/formatters';

interface SplitTelemetryRibbonProps {
  stage1: Stage1Telemetry;
  stage2: Stage2Telemetry;
}

export const SplitTelemetryRibbon: React.FC<SplitTelemetryRibbonProps> = ({
  stage1,
  stage2,
}) => {
  return (
    <div className="bg-[#111114] border border-[#27272a] rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs font-mono">
      {/* Stage 1 Telemetry (Compiler) */}
      <div className="flex items-center gap-3 pr-3 md:border-r md:border-[#27272a]/70">
        <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Stage 1 Compiler</span>
            {stage1.bypassed ? (
              <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1 py-0.2 rounded">
                Bypassed / Direct
              </span>
            ) : (
              <span className="text-[10px] text-zinc-300 truncate max-w-[120px]">
                {stage1.model}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{formatLatency(stage1.latency_ms)}</span>
            </span>
            <span>•</span>
            <span>
              {stage1.tokens_in + stage1.tokens_out} toks
            </span>
            <span>•</span>
            <span className="text-zinc-300">
              {formatMicroCost(stage1.cost_usd)}
            </span>
          </div>
        </div>
      </div>

      {/* Stage 2 Telemetry (System One Engine) */}
      <div className="flex items-center gap-3 pr-3 md:border-r md:border-[#27272a]/70 flex-1">
        <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-amber-400">Stage 2 Decision Engine</span>
            <span className="text-[10px] text-zinc-300 truncate max-w-[160px]" title={stage2.model_served || stage2.model_requested}>
              {stage2.model_served || stage2.model_requested}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span className="text-amber-400 font-bold">{formatLatency(stage2.latency_ms)}</span>
            </span>
            <span>•</span>
            <span>
              {stage2.tokens_in + stage2.tokens_out} toks ({stage2.tokens_in}in/{stage2.tokens_out}out)
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">
              {formatMicroCost(stage2.cost_usd)}
            </span>
          </div>
        </div>
      </div>

      {/* Projected Scale Cost Badge */}
      <div className="flex items-center gap-2.5 pl-1 shrink-0">
        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase text-zinc-400 font-bold block">Scale Projection</span>
          <div className="flex items-center gap-2 text-[11px] text-zinc-300">
            <span>
              <strong className="text-emerald-400">${stage2.cost_per_1k.toFixed(3)}</strong> / 1k
            </span>
            <span className="text-zinc-600">|</span>
            <span>
              <strong className="text-emerald-400">${stage2.cost_per_1m.toFixed(2)}</strong> / 1M
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
