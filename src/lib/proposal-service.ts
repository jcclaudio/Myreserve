/**
 * 🏨 FIXTUR PROPOSAL ENGINE 2.0 — PROPOSAL SERVICE & MULTIPRODUCT VIEW MODEL
 * Fonte única da verdade para montagem e validação de propostas comerciais completas de viagens.
 */

export interface ProposalChannelOption {
  id: string;
  categoriaQuarto: string;
  cafeDaManha: boolean;
  reembolsavelAte: Date | null;
  politicaCancelamentoDescricao: string;
  observacoes?: string | null;
  valorFinalVenda: number;
  valorFinalVendaFormatado: string;
  taxasInclusas: boolean;
}

export interface ProposalHotelOption {
  id: string;
  hotelNome: string;
  linkHotel?: string | null;
  fotoUrl?: string | null;
  descricao?: string | null;
  canais: ProposalChannelOption[];
}

export interface ProposalProductItem {
  id: string;
  title: string;
  description?: string | null;
  photoUrl?: string | null;
  externalLink?: string | null;
  price: number;
  priceFormatted: string;
  currency: string;
  metadata?: Record<string, any>;
}

export interface ProposalProductSection {
  id: string;
  productType: string;
  title: string;
  description?: string | null;
  options: ProposalProductItem[];
}

export interface ProposalViewModel {
  proposal: {
    number: string;
    version: string;
    createdAt: Date;
    createdAtFormatado: string;
  };
  agency: {
    name: string;
    slogan: string;
    site: string;
  };
  consultant: {
    name: string;
    email: string;
  };
  client: {
    name: string;
  };
  trip: {
    destination: string;
    checkIn: Date;
    checkOut: Date;
    checkInFormatado: string;
    checkOutFormatado: string;
    nights: number;
    adults: number;
    children: number;
    childrenAges: number[];
    rooms: number;
  };
  hotels: ProposalHotelOption[];
  sections: ProposalProductSection[];
  hasSelectedOptions: boolean;
  importantInformation: string[];
  mandatoryDisclaimer: string;
}

/**
 * Valida URLs seguras (apenas http e https, bloqueando javascript:, data:, file:)
 */
export function sanitizeSafeUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("/images/") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return null;
}

export const STANDARD_PRODUCT_ORDER: Record<string, number> = {
  FLIGHT: 1,
  HOTEL: 2,
  CAR_RENTAL: 3,
  PARK: 4,
  TRAVEL_INSURANCE: 5,
  TICKET: 6,
  TRANSFER: 7,
  TOUR: 8,
  CUSTOM_SERVICE: 9,
};

export class ProposalAssembler {
  /**
   * Calcula número exato de diárias considerando normalização UTC
   */
  static calculateNights(checkIn: Date | string, checkOut: Date | string): number {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);

    const utc1 = Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
    const utc2 = Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate());

    const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }

  /**
   * Monta o ProposalViewModel a partir dos dados canônicos da cotação
   */
  static assemble(cotacao: any): ProposalViewModel {
    if (!cotacao) {
      throw new Error("Cotação inválida para montagem de proposta.");
    }

    const checkIn = new Date(cotacao.data_ida);
    const checkOut = new Date(cotacao.data_volta);
    const nights = this.calculateNights(checkIn, checkOut);

    const checkInFormatado = checkIn.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    const checkOutFormatado = checkOut.toLocaleDateString("pt-BR", { timeZone: "UTC" });

    // Código comercial amigável: FT-PROP-YYYY-XXXX (a partir do timestamp/id)
    const ano = checkIn.getUTCFullYear() || new Date().getFullYear();
    const shortHash = (cotacao.id || "0000").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
    const proposalNumber = `FT-PROP-${ano}-${shortHash}`;

    const idades: number[] = Array.isArray(cotacao.idades_criancas)
      ? cotacao.idades_criancas
      : JSON.parse(cotacao.idades_criancas || "[]");

    const hotels: ProposalHotelOption[] = (cotacao.hoteis || []).map((h: any) => {
      const canaisEscolhidos = (h.canais || []).filter((c: any) => c.escolhido_manual);
      return {
        id: h.id,
        hotelNome: h.hotel_nome,
        linkHotel: sanitizeSafeUrl(h.link_hotel),
        fotoUrl: sanitizeSafeUrl(h.foto_url),
        descricao: h.descricao || null,
        canais: canaisEscolhidos.map((c: any) => {
          let cancelamentoDesc = "Tarifa não reembolsável";
          if (c.reembolsavel_ate) {
            const dtCanc = new Date(c.reembolsavel_ate).toLocaleDateString("pt-BR", { timeZone: "UTC" });
            cancelamentoDesc = `Cancelamento grátis até ${dtCanc}`;
          }

          return {
            id: c.id,
            categoriaQuarto: c.categoria_quarto || "Acomodação Standard",
            cafeDaManha: !!c.cafe_da_manha,
            reembolsavelAte: c.reembolsavel_ate ? new Date(c.reembolsavel_ate) : null,
            politicaCancelamentoDescricao: cancelamentoDesc,
            observacoes: c.observacoes || null,
            valorFinalVenda: c.valor_final_venda,
            valorFinalVendaFormatado: c.valor_final_venda.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            taxasInclusas: true,
          };
        }),
      };
    }).filter((h: ProposalHotelOption) => h.canais.length > 0);

    // Mapeamento de Seções Multiproduto ordenadas pelo padrão da FixTur (Aéreo, Carros, Parques, Seguro, etc.)
    const rawSections = (cotacao.sections || []).map((sec: any) => {
      const selectedOptions = (sec.options || []).filter((opt: any) => opt.selected);
      return {
        id: sec.id,
        productType: sec.product_type,
        title: sec.title,
        description: sec.description || null,
        options: selectedOptions.map((opt: any) => {
          let meta: Record<string, any> = {};
          try {
            meta = typeof opt.metadata === "string" ? JSON.parse(opt.metadata) : opt.metadata || {};
          } catch {
            meta = {};
          }

          // Higienizar fotos no metadata
          if (Array.isArray(meta.photos)) {
            meta.photos = meta.photos.map((p: any) => sanitizeSafeUrl(p)).filter(Boolean);
          }
          if (Array.isArray(meta.flight_photos)) {
            meta.flight_photos = meta.flight_photos.map((p: any) => sanitizeSafeUrl(p)).filter(Boolean);
          }

          const primaryPhoto =
            sanitizeSafeUrl(opt.photo_url) ||
            (meta.flight_photos && meta.flight_photos[0]) ||
            (meta.photos && meta.photos[0]) ||
            null;

          return {
            id: opt.id,
            title: opt.title,
            description: opt.description || null,
            photoUrl: primaryPhoto,
            externalLink: sanitizeSafeUrl(opt.external_link),
            price: opt.price,
            priceFormatted: opt.price.toLocaleString("pt-BR", {
              style: "currency",
              currency: opt.currency || "BRL",
            }),
            currency: opt.currency || "BRL",
            metadata: meta,
          };
        }),
      };
    }).filter((sec: ProposalProductSection) => sec.options.length > 0);

    // Ordenação estrita padrão FixTur
    const sections = rawSections.sort((a: any, b: any) => {
      const orderA = STANDARD_PRODUCT_ORDER[a.productType] || 99;
      const orderB = STANDARD_PRODUCT_ORDER[b.productType] || 99;
      return orderA - orderB;
    });

    const hasSelectedOptions = hotels.length > 0 || sections.length > 0;

    return {
      proposal: {
        number: proposalNumber,
        version: `v${cotacao.versao_atual || 1}.0`,
        createdAt: cotacao.criado_em ? new Date(cotacao.criado_em) : new Date(),
        createdAtFormatado: new Date().toLocaleDateString("pt-BR"),
      },
      agency: {
        name: "FixTur Turismo",
        slogan: "Experiências e viagens sob medida",
        site: "fixtur.com.br",
      },
      consultant: {
        name: cotacao.usuario?.nome || "Consultor FixTur",
        email: cotacao.usuario?.email || "contato@fixtur.com.br",
      },
      client: {
        name: cotacao.cliente_nome,
      },
      trip: {
        destination: cotacao.destino,
        checkIn,
        checkOut,
        checkInFormatado,
        checkOutFormatado,
        nights,
        adults: cotacao.adultos,
        children: cotacao.criancas || 0,
        childrenAges: idades,
        rooms: cotacao.quartos || 1,
      },
      hotels,
      sections,
      hasSelectedOptions,
      importantInformation: [
        "Valores sujeitos a alteração e disponibilidade no momento da emissão/confirmação.",
        "Horários padrão de check-in a partir das 14h / 15h e check-out até 11h / 12h, conforme política de cada hotel.",
        "Documentação de viagem (passaportes, vistos, vacinas) é de responsabilidade dos viajantes.",
      ],
      mandatoryDisclaimer: "Nada reservado, apenas cotado. | Valores sujeitos à alteração sem aviso prévio",
    };
  }
}
