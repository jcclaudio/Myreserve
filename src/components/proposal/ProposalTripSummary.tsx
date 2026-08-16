import React from "react";
import { User, MapPin, Calendar, Users, Moon, Sparkles, BedDouble } from "lucide-react";

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
      {/* Glow de iluminação de luxo */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-10 h-28 w-28 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

      {/* Faixa dourada no topo */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

      <div className="relative z-10 space-y-4">
        {/* LINHA 1: Cliente & Destino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-white/10">
          {/* 1. Cliente */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Cliente
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                  {clientName}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-semibold text-amber-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  Proposta Exclusiva
                </span>
              </div>
            </div>
          </div>

          {/* 2. Destino */}
          <div className="flex items-center gap-3.5 md:border-l md:border-white/10 md:pl-6">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Destino da Viagem
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base sm:text-lg font-black text-amber-300 tracking-wide uppercase">
                  {destination}
                </span>
                <span className="text-xs text-slate-400">
                  • Roteiro Personalizado
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LINHA 2: Período & Viajantes/Acomodação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* 3. Período */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Período da Viagem
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-slate-100">
                  {checkInFormatado} a {checkOutFormatado}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300">
                  <Moon className="h-3 w-3" />
                  {nights} diária{nights > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Viajantes & Acomodação */}
          <div className="flex items-center gap-3.5 md:border-l md:border-white/10 md:pl-6">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Viajantes & Acomodação
              </div>
              <div className="flex items-center gap-2.5 flex-wrap text-sm sm:text-base font-bold text-slate-100">
                <span>{adults} adulto{adults > 1 ? "s" : ""}{childrenCount > 0 ? `, ${childrenCount} criança(s)` : ""}</span>
                <span className="text-slate-500">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300">
                  <BedDouble className="h-3.5 w-3.5 text-amber-400" />
                  {rooms} quarto{rooms > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
