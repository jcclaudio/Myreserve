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
    <div className="relative z-10 my-6 overflow-hidden rounded-2xl bg-slate-50/80 p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      <div className="relative z-10 space-y-4">
        {/* LINHA 1: Cliente & Destino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200/70">
          {/* 1. Cliente */}
          <div className="flex items-center gap-3.5">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-800 shadow-2xs">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">
                Cliente
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-base font-semibold text-slate-800 tracking-tight">
                  {clientName}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-50 border border-gold-200/70 text-[10px] font-medium text-gold-800">
                  <Sparkles className="h-2.5 w-2.5 text-gold-600" />
                  Proposta Exclusiva
                </span>
              </div>
            </div>
          </div>

          {/* 2. Destino */}
          <div className="flex items-center gap-3.5 md:border-l md:border-slate-200/70 md:pl-6">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-800 shadow-2xs">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">
                Destino da Viagem
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-base font-semibold text-brand-900 tracking-wide uppercase">
                  {destination}
                </span>
                <span className="text-xs text-slate-500 font-normal">
                  • Roteiro Personalizado
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LINHA 2: Período & Viajantes/Acomodação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0.5">
          {/* 3. Período */}
          <div className="flex items-center gap-3.5">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-800 shadow-2xs">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">
                Período da Viagem
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-sm font-medium text-slate-700">
                  {checkInFormatado} a {checkOutFormatado}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/60 text-xs font-medium text-slate-700">
                  <Moon className="h-3 w-3 text-slate-500" />
                  {nights} diária{nights > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Viajantes & Acomodação */}
          <div className="flex items-center gap-3.5 md:border-l md:border-slate-200/70 md:pl-6">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-800 shadow-2xs">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">
                Viajantes & Acomodação
              </div>
              <div className="flex items-center gap-2 flex-wrap text-sm font-medium text-slate-700 mt-0.5">
                <span>{adults} adulto{adults > 1 ? "s" : ""}{childrenCount > 0 ? `, ${childrenCount} criança(s)` : ""}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                  <BedDouble className="h-3.5 w-3.5 text-brand-600" />
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

