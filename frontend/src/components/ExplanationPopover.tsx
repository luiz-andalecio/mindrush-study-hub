import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ExplanationPopoverProps {
  title: string;
  description: string;
  example?: string;
  formula?: string;
  factors?: string[];
}

/**
 * Componente Popover para mostrar explicações
 * Usado para TRI, ENEM, Acurácia, etc
 */
export function ExplanationPopover({
  title,
  description,
  example,
  formula,
  factors,
}: ExplanationPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
          title={title}
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-slate-900 border border-cyan-500/50 shadow-lg shadow-cyan-500/10 w-80">
        <div className="space-y-3">
          <h3 className="font-semibold text-cyan-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            {title}
          </h3>
          
          <p className="text-sm text-slate-300 leading-relaxed">
            {description}
          </p>

          {formula && (
            <div className="bg-slate-800/50 p-3 rounded border border-violet-500/30">
              <p className="text-xs text-slate-400 mb-1">Fórmula:</p>
              <p className="text-sm text-violet-300 font-mono">{formula}</p>
            </div>
          )}

          {factors && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Fatores considerados:</p>
              <ul className="space-y-1">
                {factors.map((factor, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-orange-400">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {example && (
            <div className="bg-slate-800/50 p-3 rounded border border-emerald-500/30">
              <p className="text-xs text-slate-400 mb-1">Exemplo:</p>
              <p className="text-sm text-emerald-300">{example}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
