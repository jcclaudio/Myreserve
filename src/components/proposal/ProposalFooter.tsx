import React from "react";
import { Sparkles, Globe, Mail } from "lucide-react";
import FixLogo from "@/components/FixLogo";

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
    <footer className="break-inside-avoid relative z-10 bg-gradient-to-r from-[#101c2e] via-[#162740] to-[#101c2e] text-white px-6 sm:px-10 py-7 border-t border-gold-400/40 mt-10 print:bg-[#101c2e] print:text-white">
      {/* Linha decorativa dourada */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-80" />

      <div className="space-y-4">
        {/* Faixa Premium com a Frase Obrigatória Exata da FixTur */}
        <div className="rounded-xl bg-white/5 px-5 py-3 text-center border border-gold-400/25">
          <p className="text-xs font-medium text-gold-300 tracking-wide flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-gold-400 flex-shrink-0" />
            <span>{mandatoryDisclaimer}</span>
          </p>
        </div>

        {/* Rodapé Comercial Institucional com Logomarca */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-300 gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <FixLogo size="sm" variant="light" showText={false} />
            <strong className="text-white font-semibold">{agencyName}</strong>
            <span className="text-slate-500">•</span>
            <a
              href={`https://${site.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-gold-300 transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-gold-400/80" />
              {site}
            </a>
            <span className="text-slate-500">•</span>
            <a
              href={`mailto:${consultantEmail}`}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-gold-300 transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-gold-400/80" />
              {consultantEmail}
            </a>
          </div>

          <div className="text-left sm:text-right text-[11px] text-slate-400 font-normal">
            Documento Comercial Oficial • Proposta de Viagem FixTur
          </div>
        </div>
      </div>
    </footer>
  );
}

