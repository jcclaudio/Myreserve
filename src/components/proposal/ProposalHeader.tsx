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
  title = "Cotação de Viagem",
}: ProposalHeaderProps) {
  return (
    <header className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-gold-400/40 gap-4">
      {/* Lado Esquerdo: Logo Oficial FixTur com destaque */}
      <div className="flex items-center gap-3">
        <FixLogo size="lg" variant="dark" />
      </div>

      {/* Lado Direito: Badge e Identificação Comercial */}
      <div className="text-left sm:text-right space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-brand-900 text-gold-300 font-extrabold text-[11px] uppercase tracking-wider rounded-full border border-gold-400/40 shadow-xs">
          <span>{title}</span>
        </div>
        <div className="text-xs font-mono font-bold text-brand-900">
          {proposalNumber}
        </div>
        <div className="text-[11px] text-slate-500">
          Emissão: <span className="font-semibold text-slate-700">{createdAtFormatado}</span> • Consultora:{" "}
          <strong className="text-brand-900 font-bold">{consultantName}</strong>
        </div>
      </div>
    </header>
  );
}
