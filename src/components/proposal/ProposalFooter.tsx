import React from "react";
import { Sparkles, Globe, Mail } from "lucide-react";

interface ProposalFooterProps {
  mandatoryDisclaimer: string;
  agencyName: string;
  site: string;
  consultantEmail: string;
}

export default function ProposalFooter({
  mandatoryDisclaimer,
  agencyName,
  site,
  consultantEmail,
}: ProposalFooterProps) {
  return (
    <footer className="break-inside-avoid relative z-10 mt-8 space-y-4">
      {/* Faixa Premium com a Frase Obrigatória Exata da FixTur */}
      <div className="rounded-xl bg-brand-900 px-5 py-3.5 text-center border border-gold-400/30 shadow-xs">
        <p className="text-xs font-bold text-gold-300 tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold-400 flex-shrink-0" />
          <span>{mandatoryDisclaimer}</span>
        </p>
      </div>

      {/* Rodapé Comercial Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-200 text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <strong className="text-brand-900 font-bold">{agencyName}</strong>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {site}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {consultantEmail}
          </span>
        </div>

        <div className="text-left sm:text-right font-medium">
          Documento Comercial Oficial • Proposta de Viagem
        </div>
      </div>
    </footer>
  );
}
