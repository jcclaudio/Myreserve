import React from "react";
import FixLogo from "@/components/FixLogo";

interface ProposalHeaderProps {
  proposalNumber: string;
  createdAtFormatado: string;
  consultantName: string;
  title?: string;
}

export default function ProposalHeader({
  proposalNumber,
  createdAtFormatado,
  consultantName,
  title = "Proposta Comercial",
}: ProposalHeaderProps) {
  return (
    <header className="relative z-10 bg-gradient-to-r from-[#101c2e] via-[#162740] to-[#101c2e] text-white px-6 sm:px-10 py-7 border-b border-gold-400/40 shadow-sm print:bg-[#101c2e] print:text-white">
      {/* Linha decorativa dourada superior ultrafina */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-80" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Lado Esquerdo: Logo Oficial FixTur com destaque sobre fundo azul profundo */}
        <div className="flex items-center gap-3">
          <FixLogo size="lg" variant="light" />
        </div>

        {/* Lado Direito: Badge e Identificação Comercial Executiva */}
        <div className="text-left sm:text-right space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-gold-400/15 text-gold-300 font-semibold text-[11px] uppercase tracking-widest rounded-full border border-gold-400/35">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            <span>{title}</span>
          </div>

          <div className="text-xs font-mono font-medium tracking-wider text-slate-200">
            Nº <span className="font-semibold text-white">{proposalNumber}</span>
          </div>

          <div className="text-[11px] text-slate-300/90 font-normal">
            Emissão: <span className="font-medium text-slate-100">{createdAtFormatado}</span> • Consultoria:{" "}
            <strong className="text-gold-300 font-semibold">{consultantName}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}

