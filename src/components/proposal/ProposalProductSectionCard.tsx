import React from "react";
import {
  Plane,
  Car,
  Ticket,
  Compass,
  Shield,
  Key,
  Sparkles,
  Layers,
  ExternalLink,
  Check,
  Luggage,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import { ProposalProductSection } from "@/lib/proposal-service";

interface ProposalProductSectionCardProps {
  section: ProposalProductSection;
}

export default function ProposalProductSectionCard({
  section,
}: ProposalProductSectionCardProps) {
  function getSectionIcon(type: string) {
    switch (type) {
      case "FLIGHT":
        return <Plane className="h-4 w-4 text-sky-600" />;
      case "TRANSFER":
        return <Car className="h-4 w-4 text-emerald-600" />;
      case "TICKET":
        return <Ticket className="h-4 w-4 text-purple-600" />;
      case "TOUR":
        return <Compass className="h-4 w-4 text-amber-600" />;
      case "TRAVEL_INSURANCE":
        return <Shield className="h-4 w-4 text-teal-600" />;
      case "CAR_RENTAL":
        return <Key className="h-4 w-4 text-indigo-600" />;
      case "PARK":
        return <Sparkles className="h-4 w-4 text-gold-500" />;
      default:
        return <Layers className="h-4 w-4 text-brand-600" />;
    }
  }

  return (
    <div className="break-inside-avoid rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 bg-white shadow-2xs">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/60 shadow-2xs">
          {getSectionIcon(section.productType)}
        </div>
        <div>
          <h4 className="text-base font-semibold text-slate-800 tracking-tight">
            {section.title}
          </h4>
          {section.description && (
            <p className="text-xs text-slate-500 font-normal">{section.description}</p>
          )}
        </div>
      </div>

      {/* Lista de Opções da Seção */}
      <div className="space-y-4">
        {section.options.map((opt) => {
          const meta = opt.metadata || {};
          const cabinClass = meta.cabin_class || meta.class_type || meta.flight_class;
          const priceWithoutBaggage =
            Number(meta.price_without_baggage ?? meta.without_baggage_price) || 0;
          const priceWithBaggage =
            Number(meta.price_with_baggage ?? meta.with_baggage_price) || 0;
          const hasDualPricing = priceWithoutBaggage > 0 || priceWithBaggage > 0;

          // Coleta todas as fotos
          const allPhotos: string[] = [];
          if (opt.photoUrl && !allPhotos.includes(opt.photoUrl)) {
            allPhotos.push(opt.photoUrl);
          }
          if (Array.isArray(meta.flight_photos)) {
            meta.flight_photos.forEach((p: string) => {
              if (p && typeof p === "string" && !allPhotos.includes(p)) {
                allPhotos.push(p);
              }
            });
          }
          if (Array.isArray(meta.photos)) {
            meta.photos.forEach((p: string) => {
              if (p && typeof p === "string" && !allPhotos.includes(p)) {
                allPhotos.push(p);
              }
            });
          }
          if (meta.photo_url && typeof meta.photo_url === "string" && !allPhotos.includes(meta.photo_url)) {
            allPhotos.push(meta.photo_url);
          }
          if (meta.foto_url && typeof meta.foto_url === "string" && !allPhotos.includes(meta.foto_url)) {
            allPhotos.push(meta.foto_url);
          }

          const labelWithoutBaggage =
            meta.label_without_baggage || meta.label_sem_bagagem || "Apenas Mão (10kg)";
          const labelWithBaggage =
            meta.label_with_baggage || meta.label_com_bagagem || "1 Mala 23kg Inclusa";

          return (
            <div
              key={opt.id}
              className="rounded-xl bg-slate-50/60 p-4 sm:p-5 border border-slate-200/70 space-y-4"
            >
              {/* Topo da Opção: Título, Classe e Selo de Seleção */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/50">
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="text-base font-semibold text-slate-800">
                    {opt.title}
                  </h5>

                  {cabinClass && section.productType === "FLIGHT" && (
                    <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-sky-200/70">
                      <Plane className="h-3 w-3 text-sky-600" />
                      {cabinClass}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Opção Selecionada
                  </span>
                </div>

                {opt.externalLink && (
                  <a
                    href={opt.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900 hover:underline"
                  >
                    <span>
                      {section.productType === "CAR_RENTAL"
                        ? "Ver Detalhes do Veículo"
                        : section.productType === "FLIGHT"
                        ? "Ver Itinerário Oficial"
                        : "Ver Detalhes Oficiais"}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* 1. Galeria de Fotos */}
              {allPhotos.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-brand-700" />
                    {section.productType === "CAR_RENTAL"
                      ? "Foto do Veículo / Categoria do Carro"
                      : section.productType === "FLIGHT"
                      ? "Horários & Trechos dos Voos (Comprovante / Itinerário)"
                      : section.productType === "PARK" || section.productType === "TICKET"
                      ? "Foto / Mapa / Voucher do Ingresso"
                      : "Foto / Imagem Ilustrativa / Voucher"}
                  </span>
                  <div className={allPhotos.length === 1 ? "w-full" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
                    {allPhotos.map((foto, fIdx) => (
                      <div
                        key={fIdx}
                        className="w-full rounded-xl overflow-hidden border border-slate-200/80 bg-white shadow-2xs p-1"
                      >
                        <img
                          src={foto}
                          alt={`${opt.title} - Foto ${fIdx + 1}`}
                          className="w-full h-auto object-contain max-h-[500px] rounded-lg bg-slate-50 mx-auto block"
                          loading="eager"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Área Inferior: Descrição e Valores */}
              {hasDualPricing ? (
                /* Layout para Voo com Duas Opções de Bagagem */
                <div className="space-y-3 pt-1">
                  {opt.description && (
                    <div className="text-xs text-slate-600 font-normal leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200/60">
                      {opt.description}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opção 1: Sem Bagagem */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1 truncate">
                          <Luggage className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          Sem Bagagem Despachada
                        </span>
                        {labelWithoutBaggage && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                            {labelWithoutBaggage}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold text-slate-800">
                        {opt.currency} {priceWithoutBaggage.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Taxas de embarque inclusas
                      </span>
                    </div>

                    {/* Opção 2: Com Bagagem */}
                    <div className="bg-gold-50/40 p-3.5 rounded-xl border border-gold-300/70 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-gold-900 uppercase tracking-wider flex items-center gap-1 truncate">
                          <Luggage className="h-3.5 w-3.5 text-gold-700 flex-shrink-0" />
                          Com Bagagem Despachada
                        </span>
                        {labelWithBaggage && (
                          <span className="text-[10px] bg-gold-100 text-gold-900 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                            {labelWithBaggage}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold text-brand-900">
                        {opt.currency} {priceWithBaggage.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Taxas de embarque inclusas
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Layout para Carros, Ingressos, Parques, Seguros, Transfers e Tours */
                <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 pt-1">
                  {opt.description ? (
                    <div className="flex-1 text-xs text-slate-600 font-normal leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center">
                      <div className="w-full">{opt.description}</div>
                    </div>
                  ) : null}

                  {opt.price > 0 && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs min-w-[200px] text-right flex flex-col justify-center sm:self-auto">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        {section.productType === "CAR_RENTAL" ? "Valor da Locação" : "Valor do Serviço"}
                      </span>
                      <div className="text-lg font-bold text-brand-900 tracking-tight mt-0.5">
                        {opt.priceFormatted}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Taxas inclusas
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
