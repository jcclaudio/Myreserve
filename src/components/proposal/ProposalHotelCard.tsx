import { Coffee, ShieldCheck, AlertCircle, Building2, Check, ExternalLink } from "lucide-react";
import { ProposalHotelOption } from "@/lib/proposal-service";

interface ProposalHotelCardProps {
  hotel: ProposalHotelOption;
  index: number;
  nights: number;
}

export default function ProposalHotelCard({
  hotel,
  index,
  nights,
}: ProposalHotelCardProps) {
  return (
    <div className="break-inside-avoid rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 bg-white shadow-2xs">
      {/* Nome do Hotel com Badge Numérico e Link Seguro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-gold-300 font-semibold text-xs">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-brand-900 tracking-tight">
              {hotel.hotelNome}
            </h4>
            {hotel.descricao && (
              <p className="text-xs text-slate-500 font-normal mt-0.5">{hotel.descricao}</p>
            )}
          </div>
        </div>

        {hotel.linkHotel && (
          <a
            href={hotel.linkHotel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900 hover:underline"
          >
            <span>Ver Hotel Oficial / Fotos</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Canais / Quartos Selecionados */}
      <div className="space-y-4">
        {hotel.canais.map((canal) => (
          <div
            key={canal.id}
            className="rounded-xl bg-slate-50/60 p-4 sm:p-5 border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            {/* Detalhes do Quarto e Condições */}
            <div className="space-y-2.5 flex-1">
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                  Acomodação
                </span>
                <h5 className="text-base font-semibold text-slate-800 mt-0.5">
                  {canal.categoriaQuarto}
                </h5>
              </div>

              {/* Badges de Condição */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {canal.cafeDaManha ? (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50/80 text-amber-900 font-medium px-2.5 py-0.5 rounded-full border border-amber-200/70">
                    <Coffee className="h-3.5 w-3.5 text-amber-600" />
                    Café da manhã incluso
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 font-normal px-2.5 py-0.5 rounded-full">
                    Sem café da manhã
                  </span>
                )}

                {canal.reembolsavelAte ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-medium px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {canal.politicaCancelamentoDescricao}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 font-normal px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                    Tarifa não reembolsável
                  </span>
                )}

                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 font-medium px-2.5 py-0.5 rounded-full border border-blue-200/70">
                  <Check className="h-3 w-3 text-blue-600" />
                  Taxas inclusas
                </span>
              </div>

              {canal.observacoes && (
                <p className="text-xs text-slate-600 pt-1 leading-relaxed font-normal">
                  {canal.observacoes}
                </p>
              )}
            </div>

            {/* Card de Preço em Destaque */}
            <div className="text-left md:text-right bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs min-w-[200px]">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Valor Total ({nights} diária{nights > 1 ? "s" : ""})
              </span>
              <div className="text-xl font-bold text-brand-900 tracking-tight mt-0.5">
                {canal.valorFinalVendaFormatado}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                Taxas e impostos inclusos
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

