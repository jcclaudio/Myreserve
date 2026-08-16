import React from "react";
import { User, MapPin, Calendar, Users, Moon, Sparkles } from "lucide-react";

interface ProposalTripSummaryProps {
  clientName: string;
  destination: string;
  checkInFormatado: string;
  checkOutFormatado: string;
  nights: number;
  adults: number;
  childrenCount: number;
  rooms: number;
}

export default function ProposalTripSummary({
  clientName,
  destination,
  checkInFormatado,
  checkOutFormatado,
  nights,
  adults,
  childrenCount,
  rooms,
}: ProposalTripSummaryProps) {
  return (
    <div className="relative z-10 my-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#0B1528] to-[#111F38] p-5 sm:p-6 text-white shadow-xl shadow-slate-950/15 border border-slate-800/90 print:bg-slate-950 print:text-white">
      {/* Efeito sutil de iluminação dourada e azul no topo */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-10 h-28 w-28 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

      {/* Faixa decorativa no topo */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
        
        {/* 1. Cliente */}
        <div className="pt-2 sm:pt-0 sm:pr-4 flex items-start gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Cliente
            </span>
            <span className="block text-sm sm:text-base font-bold text-white tracking-wide truncate">
              {clientName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 font-medium mt-0.5">
              <Sparkles className="h-2.5 w-2.5 text-amber-400" />
              Proposta Personalizada
            </span>
          </div>
        </div>

        {/* 2. Destino */}
        <div className="pt-4 sm:pt-0 sm:px-4 flex items-start gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Destino
            </span>
            <span className="block text-sm sm:text-base font-bold text-amber-300 tracking-wide truncate uppercase">
              {destination}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              Roteiro de Viagem
            </span>
          </div>
        </div>

        {/* 3. Período & Diárias */}
        <div className="pt-4 sm:pt-0 sm:px-4 flex items-start gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Período da Hospedagem
            </span>
            <div className="text-xs font-bold text-slate-100 tracking-tight">
              {checkInFormatado} a {checkOutFormatado}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-300">
              <Moon className="h-2.5 w-2.5" />
              <span>{nights} diária{nights > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* 4. Viajantes & Acomodações */}
        <div className="pt-4 sm:pt-0 sm:pl-4 flex items-start gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Viajantes e Acomodação
            </span>
            <div className="text-xs font-bold text-slate-100">
              {adults} adulto{adults > 1 ? "s" : ""}{childrenCount > 0 ? `, ${childrenCount} criança(s)` : ""}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {rooms} quarto{rooms > 1 ? "s" : ""}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
