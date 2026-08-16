import React from "react";
import { User, MapPin, Calendar, Users, Home } from "lucide-react";

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
    <div className="relative z-10 my-6 rounded-2xl bg-slate-50/90 p-5 border border-slate-200/80 shadow-2xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
        {/* 1. Cliente */}
        <div className="pt-2 sm:pt-0 sm:pr-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <User className="h-3.5 w-3.5 text-brand-600" />
            <span>Cliente</span>
          </div>
          <div className="text-base font-black text-slate-900 truncate">
            {clientName}
          </div>
        </div>

        {/* 2. Destino */}
        <div className="pt-3 sm:pt-0 sm:px-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5 text-brand-600" />
            <span>Destino</span>
          </div>
          <div className="text-base font-black text-brand-900 truncate">
            {destination}
          </div>
        </div>

        {/* 3. Período & Diárias */}
        <div className="pt-3 sm:pt-0 sm:px-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5 text-brand-600" />
            <span>Período da Hospedagem</span>
          </div>
          <div className="text-xs font-bold text-slate-900">
            {checkInFormatado} a {checkOutFormatado}
          </div>
          <div className="text-xs font-extrabold text-gold-600">
            {nights} diária{nights > 1 ? "s" : ""}
          </div>
        </div>

        {/* 4. Viajantes & Quartos */}
        <div className="pt-3 sm:pt-0 sm:pl-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Users className="h-3.5 w-3.5 text-brand-600" />
            <span>Viajantes e Acomodação</span>
          </div>
          <div className="text-xs font-bold text-slate-900">
            {adults} adulto{adults > 1 ? "s" : ""}{childrenCount > 0 ? `, ${childrenCount} criança(s)` : ""}
          </div>
          <div className="text-[11px] text-slate-500">
            {rooms} quarto{rooms > 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
