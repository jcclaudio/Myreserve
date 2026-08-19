import React from "react";
import { Info } from "lucide-react";

interface ProposalImportantInfoProps {
  items: string[];
}

export default function ProposalImportantInfo({ items }: ProposalImportantInfoProps) {
  return (
    <div className="break-inside-avoid relative z-10 my-6 rounded-xl bg-slate-50/70 p-5 border border-slate-200/70 shadow-2xs space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-widest">
        <Info className="h-4 w-4 text-brand-700" />
        <span>Informações Importantes & Condições Gerais</span>
      </div>
      <ul className="space-y-1.5 text-xs text-slate-600 font-normal leading-relaxed">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-gold-600 font-bold leading-none mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

