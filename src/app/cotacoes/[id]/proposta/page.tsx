"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  Building2,
  Plane,
  Key,
  Sparkles,
  Shield,
  Ticket,
  Car,
  Compass,
} from "lucide-react";
import { ProposalAssembler, ProposalViewModel } from "@/lib/proposal-service";
import ProposalWatermark from "@/components/proposal/ProposalWatermark";
import ProposalHeader from "@/components/proposal/ProposalHeader";
import ProposalTripSummary from "@/components/proposal/ProposalTripSummary";
import ProposalHotelCard from "@/components/proposal/ProposalHotelCard";
import ProposalProductSectionCard from "@/components/proposal/ProposalProductSectionCard";
import ProposalImportantInfo from "@/components/proposal/ProposalImportantInfo";
import ProposalFooter from "@/components/proposal/ProposalFooter";

export default function PropostaClientePage() {
  const params = useParams();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<ProposalViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    carregarProposta();
  }, [params.id]);

  async function carregarProposta() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cotacoes/${params.id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        alert("Cotação não encontrada.");
        router.push("/");
        return;
      }
      const data = await res.json();
      const vm = ProposalAssembler.assemble(data.cotacao);
      setViewModel(vm);
    } catch (err) {
      console.error("Erro ao carregar proposta:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleImprimir() {
    window.print();
  }

  function handleCopiarWhatsApp() {
    if (!viewModel) return;

    let texto = `✈️ *PROPOSTA DE VIAGEM — ${viewModel.client.name.toUpperCase()}*\n`;
    texto += `📍 *Destino:* ${viewModel.trip.destination}\n`;
    texto += `📅 *Período:* ${viewModel.trip.checkInFormatado} a ${viewModel.trip.checkOutFormatado} (${viewModel.trip.nights} diárias)\n`;
    texto += `👥 *Viajantes:* ${viewModel.trip.adults} adulto(s)${
      viewModel.trip.children > 0 ? `, ${viewModel.trip.children} criança(s)` : ""
    } | ${viewModel.trip.rooms} quarto(s)\n\n`;

    // 1. AÉREO
    const flightSections = (viewModel.sections || []).filter((s) => s.productType === "FLIGHT");
    if (flightSections.length > 0) {
      texto += `✈️ *1. PASSAGENS AÉREAS:*\n`;
      flightSections.forEach((sec) => {
        sec.options.forEach((opt) => {
          const meta = opt.metadata || {};
          const cabinClass = meta.cabin_class || meta.class_type;
          const priceWithout = Number(meta.price_without_baggage) || 0;
          const labelWithout =
            meta.label_without_baggage || meta.label_sem_bagagem || "Apenas Mão (10kg)";
          const priceWith = Number(meta.price_with_baggage) || 0;
          const labelWith =
            meta.label_with_baggage || meta.label_com_bagagem || "1 Mala 23kg Inclusa";

          texto += `• *${opt.title}*${cabinClass ? ` (${cabinClass})` : ""}\n`;
          if (opt.description) texto += `  ${opt.description}\n`;

          if (priceWithout > 0 || priceWith > 0) {
            if (priceWithout > 0) texto += `  🧳 Sem Bagagem (${labelWithout}): ${opt.currency} ${priceWithout.toFixed(2)}\n`;
            if (priceWith > 0) texto += `  🧳 Com Bagagem (${labelWith}): ${opt.currency} ${priceWith.toFixed(2)}\n`;
          } else if (opt.price > 0) {
            texto += `  💰 Valor: ${opt.priceFormatted}\n`;
          }

          if (opt.photoUrl) {
            texto += `  📷 Trechos/Horários: ${opt.photoUrl}\n`;
          }
        });
      });
      texto += `\n`;
    }

    // 2. HOSPEDAGEM
    if (viewModel.hotels.length > 0) {
      texto += `🏨 *2. HOSPEDAGEM & HOTÉIS:*\n`;
      let contH = 1;
      viewModel.hotels.forEach((hotel) => {
        hotel.canais.forEach((canal) => {
          texto += `*${contH}. ${hotel.hotelNome}*\n`;
          texto += `• Quarto: ${canal.categoriaQuarto}\n`;
          texto += `• Regime: ${canal.cafeDaManha ? "Café da manhã incluso" : "Sem café da manhã"}\n`;
          texto += `• Política: ${canal.politicaCancelamentoDescricao}\n`;
          if (canal.observacoes) texto += `• Detalhes: ${canal.observacoes}\n`;
          texto += `💰 *Valor Total: ${canal.valorFinalVendaFormatado}*\n\n`;
          contH++;
        });
      });
    }

    // 3. LOCAÇÃO DE CARRO
    const carSections = (viewModel.sections || []).filter((s) => s.productType === "CAR_RENTAL");
    if (carSections.length > 0) {
      texto += `🚗 *3. LOCAÇÃO DE VEÍCULOS:*\n`;
      carSections.forEach((sec) => {
        sec.options.forEach((opt) => {
          texto += `• *${opt.title}*\n`;
          if (opt.description) texto += `  Detalhes: ${opt.description}\n`;
          if (opt.price > 0) texto += `  💰 Valor: ${opt.priceFormatted}\n`;
        });
      });
      texto += `\n`;
    }

    // 4. PARQUES
    const parkSections = (viewModel.sections || []).filter((s) => s.productType === "PARK");
    if (parkSections.length > 0) {
      texto += `🎡 *4. PARQUES TEMÁTICOS:*\n`;
      parkSections.forEach((sec) => {
        sec.options.forEach((opt) => {
          texto += `• *${opt.title}*\n`;
          if (opt.description) texto += `  Detalhes: ${opt.description}\n`;
          if (opt.price > 0) texto += `  💰 Valor: ${opt.priceFormatted}\n`;
        });
      });
      texto += `\n`;
    }

    // 5. SEGURO VIAGEM
    const insuranceSections = (viewModel.sections || []).filter((s) => s.productType === "TRAVEL_INSURANCE");
    if (insuranceSections.length > 0) {
      texto += `🛡️ *5. SEGURO VIAGEM:*\n`;
      insuranceSections.forEach((sec) => {
        sec.options.forEach((opt) => {
          texto += `• *${opt.title}*\n`;
          if (opt.description) texto += `  Detalhes: ${opt.description}\n`;
          if (opt.price > 0) texto += `  💰 Valor: ${opt.priceFormatted}\n`;
        });
      });
      texto += `\n`;
    }

    // 6. INGRESSOS
    const ticketSections = (viewModel.sections || []).filter((s) => s.productType === "TICKET");
    if (ticketSections.length > 0) {
      texto += `🎟️ *6. INGRESSOS:*\n`;
      ticketSections.forEach((sec) => {
        sec.options.forEach((opt) => {
          texto += `• *${opt.title}*\n`;
          if (opt.description) texto += `  Detalhes: ${opt.description}\n`;
          if (opt.price > 0) texto += `  💰 Valor: ${opt.priceFormatted}\n`;
        });
      });
      texto += `\n`;
    }

    // 7. TRANSFERS
    const transferSections = (viewModel.sections || []).filter((s) => s.productType === "TRANSFER");
    if (transferSections.length > 0) {
      texto += `🚐 *7. TRANSFERS & TRASLADOS:*\n`;
      transferSections.forEach((sec) => {
        sec.options.forEach((opt) => {
          texto += `• *${opt.title}*\n`;
          if (opt.description) texto += `  Detalhes: ${opt.description}\n`;
          if (opt.price > 0) texto += `  💰 Valor: ${opt.priceFormatted}\n`;
        });
      });
      texto += `\n`;
    }

    // 8. PASSEIOS & OUTROS
    const otherSections = (viewModel.sections || []).filter(
      (s) => s.productType === "TOUR" || s.productType === "CUSTOM_SERVICE"
    );
    if (otherSections.length > 0) {
      texto += `🗺️ *8. PASSEIOS & EXPERIÊNCIAS:*\n`;
      otherSections.forEach((sec) => {
        sec.options.forEach((opt) => {
          texto += `• *${opt.title}*\n`;
          if (opt.description) texto += `  Detalhes: ${opt.description}\n`;
          if (opt.price > 0) texto += `  💰 Valor: ${opt.priceFormatted}\n`;
        });
      });
      texto += `\n`;
    }

    texto += `_${viewModel.mandatoryDisclaimer}_\n\n`;
    texto += `Atenciosamente,\n*${viewModel.consultant.name}* | ${viewModel.agency.name}`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  if (loading || !viewModel) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-900 border-t-transparent"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Gerando proposta comercial FixTur...
          </p>
        </div>
      </div>
    );
  }

  // Segmentação por produtos conforme a hierarquia solicitada:
  // 1. Aéreo, 2. Hospedagens, 3. Locação de carro, 4. Parques, 5. Seguro Viagem, 6. Ingressos, 7. Transfers, 8. Passeios/Outros
  const flightSections = (viewModel.sections || []).filter((s) => s.productType === "FLIGHT");
  const carSections = (viewModel.sections || []).filter((s) => s.productType === "CAR_RENTAL");
  const parkSections = (viewModel.sections || []).filter((s) => s.productType === "PARK");
  const insuranceSections = (viewModel.sections || []).filter((s) => s.productType === "TRAVEL_INSURANCE");
  const ticketSections = (viewModel.sections || []).filter((s) => s.productType === "TICKET");
  const transferSections = (viewModel.sections || []).filter((s) => s.productType === "TRANSFER");
  const otherSections = (viewModel.sections || []).filter(
    (s) => s.productType === "TOUR" || s.productType === "CUSTOM_SERVICE"
  );

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 print:bg-white print:p-0 print:m-0">
      {/* Barra de Ferramentas Superior (Oculta na Impressão) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm no-print">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <Link
            href={`/cotacoes/${params.id}`}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2.5 sm:py-2 rounded-xl transition-colors text-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Cotação Interna
          </Link>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              onClick={handleCopiarWhatsApp}
              disabled={!viewModel.hasSelectedOptions}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              {copiado ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-emerald-700" />
                  Copiar WhatsApp
                </>
              )}
            </button>

            <button
              onClick={handleImprimir}
              disabled={!viewModel.hasSelectedOptions}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-900 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800 transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              <Printer className="h-4 w-4 text-gold-400" />
              Imprimir / PDF
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo da Proposta */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 print:p-0 print:max-w-full">
        {/* Alerta de seleção vazia (RN-08) */}
        {!viewModel.hasSelectedOptions && (
          <div className="mb-6 rounded-2xl bg-amber-50 p-6 border border-amber-200 shadow-sm no-print">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 flex-shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-amber-900">
                  Nenhuma opção foi selecionada ainda!
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Conforme a regra <strong>RN-08</strong>, a proposta do cliente inclui exclusivamente os canais e serviços que você marca manualmente como <strong>&quot;Opção Escolhida / Selecionada&quot;</strong>.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/cotacoes/${params.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-900 text-white px-4 py-2 rounded-xl hover:bg-brand-800 transition-colors"
                  >
                    Voltar e Selecionar Opções
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Folha A4 da Proposta Comercial */}
        <div className="relative bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 print-page print:rounded-none print:shadow-none print:border-none overflow-hidden">
          {/* Marca-d'água Institucional de Baixa Opacidade */}
          <ProposalWatermark />

          {/* 1. Cabeçalho Oficial FixTur com fundo Azul Profundo Full-Bleed */}
          <ProposalHeader
            proposalNumber={viewModel.proposal.number}
            createdAtFormatado={viewModel.proposal.createdAtFormatado}
            consultantName={viewModel.consultant.name}
          />

          {/* Corpo da Proposta com Espaçamento Limpo */}
          <div className="relative z-10 px-6 sm:px-10 py-6 space-y-6">
            {/* 2. Resumo da Viagem (Trip Summary Clean) */}
            <ProposalTripSummary
              clientName={viewModel.client.name}
              destination={viewModel.trip.destination}
              checkInFormatado={viewModel.trip.checkInFormatado}
              checkOutFormatado={viewModel.trip.checkOutFormatado}
              nights={viewModel.trip.nights}
              adults={viewModel.trip.adults}
              childrenCount={viewModel.trip.children}
              rooms={viewModel.trip.rooms}
            />

            {/* HIERARQUIA PADRONIZADA DOS ITENS DA PROPOSTA (PDF / TELA) */}
            <div className="space-y-6 my-6">
              {/* 1. PASSAGENS AÉREAS (SE HOUVER) */}
              {flightSections.length > 0 && (
                <div className="space-y-4 proposal-section-block break-inside-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 section-header break-after-avoid">
                    <Plane className="h-4.5 w-4.5 text-sky-700" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-widest">
                      1. Passagens Aéreas
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {flightSections.map((sec) => (
                      <ProposalProductSectionCard key={sec.id} section={sec} />
                    ))}
                  </div>
                </div>
              )}

              {/* 2. HOSPEDAGEM & HOTÉIS (SE HOUVER) */}
              {viewModel.hotels.length > 0 && (
                <div className="space-y-4 proposal-section-block break-inside-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 section-header break-after-avoid">
                    <Building2 className="h-4.5 w-4.5 text-brand-800" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-widest">
                      {flightSections.length > 0 ? "2. Hospedagem & Hotéis" : "1. Hospedagem & Hotéis"}
                    </h3>
                  </div>
                  <div className="space-y-5">
                    {viewModel.hotels.map((hotel, idx) => (
                      <ProposalHotelCard
                        key={hotel.id}
                        hotel={hotel}
                        index={idx}
                        nights={viewModel.trip.nights}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. LOCAÇÃO DE CARRO (SE HOUVER) */}
              {carSections.length > 0 && (
                <div className="space-y-4 proposal-section-block break-inside-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 section-header break-after-avoid">
                    <Key className="h-4.5 w-4.5 text-indigo-700" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-widest">
                      Locação de Veículos
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {carSections.map((sec) => (
                      <ProposalProductSectionCard key={sec.id} section={sec} />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. PARQUES TEMÁTICOS (SE HOUVER) */}
              {parkSections.length > 0 && (
                <div className="space-y-4 proposal-section-block break-inside-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 section-header break-after-avoid">
                    <Sparkles className="h-4.5 w-4.5 text-gold-600" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-widest">
                      Ingressos de Parques Temáticos
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {parkSections.map((sec) => (
                      <ProposalProductSectionCard key={sec.id} section={sec} />
                    ))}
                  </div>
                </div>
              )}

              {/* 5. SEGURO VIAGEM (SE HOUVER) */}
              {insuranceSections.length > 0 && (
                <div className="space-y-4 proposal-section-block break-inside-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 section-header break-after-avoid">
                    <Shield className="h-4.5 w-4.5 text-teal-700" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-widest">
                      Seguro Viagem & Assistência
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {insuranceSections.map((sec) => (
                      <ProposalProductSectionCard key={sec.id} section={sec} />
                    ))}
                  </div>
                </div>
              )}

              {/* 6. INGRESSOS (SE HOUVER) */}
              {ticketSections.length > 0 && (
                <div className="space-y-4 proposal-section-block break-inside-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 section-header break-after-avoid">
                    <Ticket className="h-4.5 w-4.5 text-purple-700" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-widest">
                      Ingressos para Atrações
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {ticketSections.map((sec) => (
                      <ProposalProductSectionCard key={sec.id} section={sec} />
                    ))}
                  </div>
                </div>
              )}

              {/* 7. TRANSFERS & TRASLADOS (SE HOUVER) */}
              {transferSections.length > 0 && (
                <div className="space-y-4 proposal-section-block break-inside-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 section-header break-after-avoid">
                    <Car className="h-4.5 w-4.5 text-emerald-700" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-widest">
                      Transfers & Traslados
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {transferSections.map((sec) => (
                      <ProposalProductSectionCard key={sec.id} section={sec} />
                    ))}
                  </div>
                </div>
              )}

              {/* 8. PASSEIOS, TOURS E SERVIÇOS ADICIONAIS (SE HOUVER) */}
              {otherSections.length > 0 && (
                <div className="space-y-4 proposal-section-block break-inside-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 section-header break-after-avoid">
                    <Compass className="h-4.5 w-4.5 text-amber-700" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-widest">
                      Passeios, Tours & Experiências
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {otherSections.map((sec) => (
                      <ProposalProductSectionCard key={sec.id} section={sec} />
                    ))}
                  </div>
                </div>
              )}

              {!viewModel.hasSelectedOptions && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-normal">
                    Selecione as opções na tela de edição da cotação para que apareçam na proposta.
                  </p>
                </div>
              )}
            </div>

            {/* 4. Informações Importantes */}
            <div className="break-inside-avoid proposal-section-block">
              <ProposalImportantInfo items={viewModel.importantInformation} />
            </div>
          </div>

          {/* 5. Rodapé Comercial & Frase Obrigatória com fundo Azul Profundo Full-Bleed */}
          <div className="break-inside-avoid proposal-section-block">
            <ProposalFooter
              mandatoryDisclaimer={viewModel.mandatoryDisclaimer}
              agencyName={viewModel.agency.name}
              site={viewModel.agency.site}
              consultantEmail={viewModel.consultant.email}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

