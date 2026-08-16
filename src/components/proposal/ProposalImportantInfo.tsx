import React from "react";
import { Info } from "lucide-react";

interface ProposalImportantInfoProps {
  items: string[];
}

export default function ProposalImportantInfo({ items }: ProposalImportantInfoProps) {
  return (
    <div className="break-inside-avoid relative z-10 my-6 rounded-2xl bg-slate-50/90 p-5 border border-slate-200/80 shadow-2xs space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <Info className="h-4 w-4 text-brand-600" />
        <span>Informações Importantes</span>
      </div>
      <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-gold-500 font-bold">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
