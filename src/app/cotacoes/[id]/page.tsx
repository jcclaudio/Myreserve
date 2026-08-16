"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Users,
  MapPin,
  FileText,
  TrendingUp,
  Star,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Share2,
  Trash2,
  RotateCw,
  Edit3,
  PlusCircle,
  X,
  Check,
  Plus,
  Plane,
  Car,
  Ticket,
  Compass,
  Shield,
  Key,
  Sparkles,
  Layers,
  History,
  Save,
  Undo2,
  ExternalLink,
  Luggage,
  Image as ImageIcon,
} from "lucide-react";
import { getSupplierTheme } from "@/lib/supplier-tokens";
import { PRODUCT_TYPES, ProductType } from "@/lib/multiproduct-schemas";
import { calcularCanal, aplicarDestaquesNoGrupo, Moeda } from "@/lib/calculations";
import ImageUploadDropzone from "@/components/common/ImageUploadDropzone";

interface Canal {
  id?: string;
  canal_nome: string;
  valor_mostrado: number | "";
  taxas: number | "";
  moeda: "BRL" | "USD" | "EUR";
  comissao_fornecedor_pct: number | "";
  comissao_venda_pct: number | "";
  categoria_quarto: string;
  cafe_da_manha: boolean;
  reembolsavel_ate: string | Date | null;
  observacoes: string | null;
  escolhido_manual?: boolean;
  valor_comissao?: number;
  custo_liquido?: number;
  cotacao_utilizada?: number;
  custo_em_brl?: number;
  valor_final_venda?: number;
  menor_custo_do_grupo?: boolean;
  maior_venda_do_grupo?: boolean;
}

interface Hotel {
  id?: string;
  hotel_nome: string;
  link_hotel?: string | null;
  foto_url?: string | null;
  descricao?: string | null;
  ordem_exibicao: number;
  canais: Canal[];
}

interface QuoteOption {
  id?: string;
  title: string;
  description?: string | null;
  photo_url?: string | null;
  external_link?: string | null;
  price: number | "";
  currency: string;
  selected: boolean;
  metadata?: string;
  sort_order?: number;
}

interface QuoteSection {
  id?: string;
  product_type: string;
  title: string;
  description?: string | null;
  sort_order: number;
  options: QuoteOption[];
}

interface CotacaoVersao {
  id: string;
  versao_numero: number;
  motivo_reabertura: string;
  criado_em: string;
}

interface CotacaoDetalhada {
  id: string;
  cliente_nome: string;
  destino: string;
  data_ida: string;
  data_volta: string;
  adultos: number;
  criancas: number;
  idades_criancas: string;
  quartos: number;
  cotacao_usd: number;
  cotacao_eur: number;
  comissao_padrao_agencia_pct: number;
  status: string;
  versao_atual: number;
  criado_em: string;
  usuario: {
    nome: string;
    email: string;
  };
  hoteis: Hotel[];
  sections?: QuoteSection[];
  versoes?: CotacaoVersao[];
}

export default function CotacaoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [cotacao, setCotacao] = useState<CotacaoDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [atualizandoEscolha, setAtualizandoEscolha] = useState<string | null>(null);
  const [gerandoFinanceiro, setGerandoFinanceiro] = useState(false);
  const [financeiroMsg, setFinanceiroMsg] = useState("");

  // ESTADO DE EDIÇÃO INLINE COMPLETO NA PÁGINA
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvandoTudo, setSalvandoTudo] = useState(false);

  // Cópia de trabalho para edição de todos os campos
  const [editClienteNome, setEditClienteNome] = useState("");
  const [editDestino, setEditDestino] = useState("");
  const [editDataIda, setEditDataIda] = useState("");
  const [editDataVolta, setEditDataVolta] = useState("");
  const [editAdultos, setEditAdultos] = useState(2);
  const [editCriancas, setEditCriancas] = useState(0);
  const [editIdadesCriancas, setEditIdadesCriancas] = useState<number[]>([]);
  const [editQuartos, setEditQuartos] = useState(1);
  const [editCotacaoUsd, setEditCotacaoUsd] = useState(5.0);
  const [editCotacaoEur, setEditCotacaoEur] = useState(5.5);
  const [editComissaoPadrao, setEditComissaoPadrao] = useState(14.0);
  const [editHoteis, setEditHoteis] = useState<Hotel[]>([]);
  const [editSections, setEditSections] = useState<QuoteSection[]>([]);

  // Modal de Reabertura com Versionamento
  const [modalReaberturaAberto, setModalReaberturaAberto] = useState(false);
  const [motivoReabertura, setMotivoReabertura] = useState("");
  const [reabrindo, setReabrindo] = useState(false);

  // Modal de Nova Seção de Produto Multiproduto
  const [modalNovaSecaoAberto, setModalNovaSecaoAberto] = useState(false);
  const [novoTipoProduto, setNovoTipoProduto] = useState<ProductType>("FLIGHT");
  const [novoTituloSecao, setNovoTituloSecao] = useState("Passagens Aéreas");
  const [novaDescricaoSecao, setNovaDescricaoSecao] = useState("");
  const [tituloOpcaoInicial, setTituloOpcaoInicial] = useState("");
  const [classePassagemInicial, setClassePassagemInicial] = useState("Econômica");
  const [precoSemBagagemInicial, setPrecoSemBagagemInicial] = useState<number | "">("");
  const [labelSemBagagemInicial, setLabelSemBagagemInicial] = useState("Apenas Mão (10kg)");
  const [precoComBagagemInicial, setPrecoComBagagemInicial] = useState<number | "">("");
  const [labelComBagagemInicial, setLabelComBagagemInicial] = useState("1 Mala 23kg Inclusa");
  const [precoOpcaoInicial, setPrecoOpcaoInicial] = useState<number | "">("");
  const [fotoUrlInicial, setFotoUrlInicial] = useState("");
  const [descricaoLongaInicial, setDescricaoLongaInicial] = useState("");
  const [salvandoSecao, setSalvandoSecao] = useState(false);

  useEffect(() => {
    carregarCotacao();
  }, [params.id]);

  async function carregarCotacao() {
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
      setCotacao(data.cotacao);
      prepararDadosEdicao(data.cotacao);
    } catch (err) {
      console.error("Erro ao carregar cotação:", err);
    } finally {
      setLoading(false);
    }
  }

  function prepararDadosEdicao(c: CotacaoDetalhada) {
    setEditClienteNome(c.cliente_nome);
    setEditDestino(c.destino);

    const idaIso = new Date(c.data_ida).toISOString().split("T")[0];
    const voltaIso = new Date(c.data_volta).toISOString().split("T")[0];
    setEditDataIda(idaIso);
    setEditDataVolta(voltaIso);

    setEditAdultos(c.adultos);
    setEditCriancas(c.criancas);
    try {
      setEditIdadesCriancas(
        Array.isArray(c.idades_criancas)
          ? c.idades_criancas
          : JSON.parse(c.idades_criancas || "[]")
      );
    } catch {
      setEditIdadesCriancas([]);
    }
    setEditQuartos(c.quartos);
    setEditCotacaoUsd(c.cotacao_usd);
    setEditCotacaoEur(c.cotacao_eur);
    setEditComissaoPadrao(c.comissao_padrao_agencia_pct);

    // Mapear hotéis e seus canais
    const cambioRef = {
      cotacao_usd: Number(c.cotacao_usd) || 5.0,
      cotacao_eur: Number(c.cotacao_eur) || 5.5,
    };

    const hoteisClone: Hotel[] = (c.hoteis || []).map((h, hIdx) => {
      const canaisFormatados = (h.canais || []).map((canal) => ({
        id: canal.id,
        canal_nome: canal.canal_nome,
        valor_mostrado: canal.valor_mostrado,
        taxas: canal.taxas || 0,
        moeda: canal.moeda as "BRL" | "USD" | "EUR",
        comissao_fornecedor_pct: canal.comissao_fornecedor_pct || 0,
        comissao_venda_pct: canal.comissao_venda_pct || c.comissao_padrao_agencia_pct || 14,
        categoria_quarto: canal.categoria_quarto || "Quarto Standard",
        cafe_da_manha: !!canal.cafe_da_manha,
        reembolsavel_ate: canal.reembolsavel_ate
          ? new Date(canal.reembolsavel_ate).toISOString().split("T")[0]
          : null,
        observacoes: canal.observacoes || "",
        escolhido_manual: !!canal.escolhido_manual,
      }));

      const canaisRecalc = aplicarDestaquesNoGrupo(canaisFormatados, cambioRef);

      return {
        id: h.id,
        hotel_nome: h.hotel_nome,
        link_hotel: h.link_hotel || "",
        foto_url: h.foto_url || "",
        descricao: h.descricao || "",
        ordem_exibicao: hIdx,
        canais: canaisRecalc.map((calc, cIdx) => ({
          ...canaisFormatados[cIdx],
          ...calc,
        })),
      };
    });

    setEditHoteis(hoteisClone);

    // Mapear seções multiproduto (Aéreo, Transfer, Seguro, etc.)
    const sectionsClone: QuoteSection[] = (c.sections || []).map((s, sIdx) => ({
      id: s.id,
      product_type: s.product_type,
      title: s.title,
      description: s.description || "",
      sort_order: sIdx,
      options: (s.options || []).map((o, oIdx) => ({
        id: o.id,
        title: o.title,
        description: o.description || "",
        photo_url: o.photo_url || "",
        external_link: o.external_link || "",
        price: o.price || 0,
        currency: o.currency || "BRL",
        selected: !!o.selected,
        sort_order: oIdx,
        metadata: typeof o.metadata === "string" ? o.metadata : JSON.stringify(o.metadata || {}),
      })),
    }));

    setEditSections(sectionsClone);
  }

  function handleEntrarModoEdicao() {
    if (cotacao) {
      prepararDadosEdicao(cotacao);
    }
    setModoEdicao(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelarEdicao() {
    if (cotacao) {
      prepararDadosEdicao(cotacao);
    }
    setModoEdicao(false);
  }

  // Manipuladores de Crianças & Idades
  function handleCriancasChange(qtd: number) {
    const n = Math.max(0, qtd);
    setEditCriancas(n);
    if (n === 0) {
      setEditIdadesCriancas([]);
    } else {
      setEditIdadesCriancas((prev) => {
        const novo = [...prev];
        while (novo.length < n) novo.push(5);
        return novo.slice(0, n);
      });
    }
  }

  function handleIdadeChange(index: number, idade: number) {
    const novo = [...editIdadesCriancas];
    novo[index] = Math.max(0, Math.min(17, idade));
    setEditIdadesCriancas(novo);
  }

  // Manipuladores de Edição dos Hotéis e Canais
  function handleAdicionarHotelInline() {
    setEditHoteis((prev) => [
      ...prev,
      {
        hotel_nome: "",
        link_hotel: "",
        descricao: "",
        ordem_exibicao: prev.length,
        canais: [
          {
            canal_nome: "Booking.com",
            valor_mostrado: "",
            taxas: "",
            moeda: "BRL",
            comissao_fornecedor_pct: "",
            comissao_venda_pct: editComissaoPadrao || 14,
            categoria_quarto: "Quarto Standard",
            cafe_da_manha: true,
            reembolsavel_ate: null,
            observacoes: "",
            escolhido_manual: true,
          },
        ],
      },
    ]);
  }

  function handleRemoverHotelInline(hotelIndex: number) {
    if (editHoteis.length <= 1) {
      alert("A cotação deve conter pelo menos um hotel.");
      return;
    }
    setEditHoteis((prev) => prev.filter((_, idx) => idx !== hotelIndex));
  }

  function handleAtualizarHotel(hotelIndex: number, campo: keyof Hotel, valor: any) {
    setEditHoteis((prev) =>
      prev.map((h, i) => (i === hotelIndex ? { ...h, [campo]: valor } : h))
    );
  }

  function handleAdicionarCanalInline(hotelIndex: number) {
    setEditHoteis((prev) =>
      prev.map((h, i) =>
        i === hotelIndex
          ? {
              ...h,
              canais: [
                ...h.canais,
                {
                  canal_nome: "",
                  valor_mostrado: "",
                  taxas: "",
                  moeda: "BRL",
                  comissao_fornecedor_pct: "",
                  comissao_venda_pct: editComissaoPadrao || 14,
                  categoria_quarto: "Quarto Standard",
                  cafe_da_manha: true,
                  reembolsavel_ate: null,
                  observacoes: "",
                  escolhido_manual: false,
                },
              ],
            }
          : h
      )
    );
  }

  function handleRemoverCanalInline(hotelIndex: number, canalIndex: number) {
    setEditHoteis((prev) =>
      prev.map((h, i) => {
        if (i !== hotelIndex) return h;
        if (h.canais.length <= 1) {
          alert("Todo hotel deve possuir pelo menos um canal cotado.");
          return h;
        }
        return {
          ...h,
          canais: h.canais.filter((_, cIdx) => cIdx !== canalIndex),
        };
      })
    );
  }

  function handleToggleEscolhaInline(hotelIndex: number, canalIndex: number) {
    setEditHoteis((prev) =>
      prev.map((h, i) => {
        if (i !== hotelIndex) return h;
        return {
          ...h,
          canais: h.canais.map((c, cIdx) =>
            cIdx === canalIndex ? { ...c, escolhido_manual: !c.escolhido_manual } : c
          ),
        };
      })
    );
  }

  function handleAtualizarCanalInline(
    hotelIndex: number,
    canalIndex: number,
    campo: keyof Canal,
    valor: any
  ) {
    setEditHoteis((prev) =>
      prev.map((h, hIdx) => {
        if (hIdx !== hotelIndex) return h;

        const canaisAtualizados = h.canais.map((c, cIdx) => {
          if (cIdx !== canalIndex) return c;
          return { ...c, [campo]: valor };
        });

        // Recalcular os canais deste hotel em tempo real
        const cambioRef = {
          cotacao_usd: Number(editCotacaoUsd) || 5.0,
          cotacao_eur: Number(editCotacaoEur) || 5.5,
        };

        const canaisFormatados = canaisAtualizados.map((c) => ({
          ...c,
          valor_mostrado: Number(c.valor_mostrado) || 0,
          taxas: Number(c.taxas) || 0,
          comissao_fornecedor_pct: Number(c.comissao_fornecedor_pct) || 0,
          comissao_venda_pct: Number(c.comissao_venda_pct) || 0,
          moeda: c.moeda as Moeda,
        }));

        const canaisRecalculados = aplicarDestaquesNoGrupo(
          canaisFormatados,
          cambioRef
        );

        return {
          ...h,
          canais: canaisRecalculados.map((calc, idx) => ({
            ...canaisAtualizados[idx],
            ...calc,
            reembolsavel_ate: canaisAtualizados[idx].reembolsavel_ate,
          })),
        };
      })
    );
  }

  // Manipuladores de Edição das Seções Multiproduto (Aéreo, Transfer, etc.)
  function handleAtualizarSecaoInline(sectionIndex: number, campo: keyof QuoteSection, valor: any) {
    setEditSections((prev) =>
      prev.map((s, idx) => (idx === sectionIndex ? { ...s, [campo]: valor } : s))
    );
  }

  function handleRemoverSecaoInline(sectionIndex: number) {
    setEditSections((prev) => prev.filter((_, idx) => idx !== sectionIndex));
  }

  function handleAdicionarOpcaoSecaoInline(sectionIndex: number) {
    setEditSections((prev) =>
      prev.map((s, idx) =>
        idx === sectionIndex
          ? {
              ...s,
              options: [
                ...s.options,
                {
                  title:
                    s.product_type === "FLIGHT"
                      ? `Opção de Voo #${s.options.length + 1}`
                      : s.product_type === "CAR_RENTAL"
                      ? `Opção de Carro #${s.options.length + 1} (Ex: SUV Automático)`
                      : s.product_type === "PARK"
                      ? `Opção de Parques #${s.options.length + 1}`
                      : s.product_type === "TRAVEL_INSURANCE"
                      ? `Opção de Seguro #${s.options.length + 1}`
                      : s.product_type === "TRANSFER"
                      ? `Opção de Transfer #${s.options.length + 1}`
                      : `Opção #${s.options.length + 1}`,
                  description: "",
                  photo_url: "",
                  external_link: "",
                  price: 0,
                  currency: "BRL",
                  selected: true,
                  sort_order: s.options.length,
                  metadata: JSON.stringify({
                    cabin_class: "Econômica",
                    price_without_baggage: 0,
                    price_with_baggage: 0,
                  }),
                },
              ],
            }
          : s
      )
    );
  }

  function handleRemoverOpcaoSecaoInline(sectionIndex: number, optionIndex: number) {
    setEditSections((prev) =>
      prev.map((s, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...s,
              options: s.options.filter((_, oIdx) => oIdx !== optionIndex),
            }
          : s
      )
    );
  }

  function handleAtualizarOpcaoSecaoInline(
    sectionIndex: number,
    optionIndex: number,
    campo: keyof QuoteOption,
    valor: any
  ) {
    setEditSections((prev) =>
      prev.map((s, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...s,
              options: s.options.map((o, oIdx) =>
                oIdx === optionIndex ? { ...o, [campo]: valor } : o
              ),
            }
          : s
      )
    );
  }

  function handleAtualizarMetadataOpcao(
    sectionIndex: number,
    optionIndex: number,
    metaField: string,
    metaValue: any
  ) {
    setEditSections((prev) =>
      prev.map((s, sIdx) => {
        if (sIdx !== sectionIndex) return s;
        return {
          ...s,
          options: s.options.map((o, oIdx) => {
            if (oIdx !== optionIndex) return o;
            let currentMeta: Record<string, any> = {};
            try {
              currentMeta = typeof o.metadata === "string" ? JSON.parse(o.metadata || "{}") : o.metadata || {};
            } catch {
              currentMeta = {};
            }
            const updated = { ...currentMeta, [metaField]: metaValue };
            return { ...o, metadata: JSON.stringify(updated) };
          }),
        };
      })
    );
  }

  async function handleSalvarTodasAlteracoes(e: React.FormEvent) {
    e.preventDefault();

    if (!editClienteNome.trim() || !editDestino.trim() || !editDataIda || !editDataVolta) {
      alert("Preencha o nome do cliente, destino e as datas da viagem.");
      return;
    }

    if (new Date(editDataVolta) <= new Date(editDataIda)) {
      alert("A data de check-out deve ser posterior à data de check-in.");
      return;
    }

    if (editHoteis.length === 0) {
      alert("Adicione pelo menos um hotel na cotação.");
      return;
    }

    for (let i = 0; i < editHoteis.length; i++) {
      const h = editHoteis[i];
      if (!h.hotel_nome.trim()) {
        alert(`Informe o nome do Hotel #${i + 1}.`);
        return;
      }
      if (h.canais.length === 0) {
        alert(`O Hotel "${h.hotel_nome}" deve conter pelo menos um canal de venda.`);
        return;
      }
      for (let j = 0; j < h.canais.length; j++) {
        const c = h.canais[j];
        if (!c.canal_nome.trim()) {
          alert(`Preencha o nome da opção ${j + 1} no Hotel "${h.hotel_nome}".`);
          return;
        }
        if (Number(c.valor_mostrado) <= 0) {
          alert(`O valor mostrado na opção "${c.canal_nome}" deve ser maior que zero.`);
          return;
        }
        if (Number(c.comissao_venda_pct) >= 100) {
          alert(`A comissão de venda na opção "${c.canal_nome}" deve ser menor que 100%.`);
          return;
        }
      }
    }

    setSalvandoTudo(true);
    try {
      const payloadCotacao = {
        cliente_nome: editClienteNome.trim(),
        destino: editDestino.trim(),
        data_ida: editDataIda,
        data_volta: editDataVolta,
        adultos: Number(editAdultos) || 1,
        criancas: Number(editCriancas) || 0,
        idades_criancas: editIdadesCriancas,
        quartos: Number(editQuartos) || 1,
        cotacao_usd: Number(editCotacaoUsd) || 5.0,
        cotacao_eur: Number(editCotacaoEur) || 5.5,
        comissao_padrao_agencia_pct: Number(editComissaoPadrao) || 14.0,
        hoteis: editHoteis.map((h, idx) => ({
          hotel_nome: h.hotel_nome.trim(),
          link_hotel: h.link_hotel?.trim() || null,
          descricao: h.descricao?.trim() || null,
          ordem_exibicao: idx,
          canais: h.canais.map((c) => ({
            canal_nome: c.canal_nome.trim(),
            valor_mostrado: Number(c.valor_mostrado) || 0,
            taxas: Number(c.taxas) || 0,
            moeda: c.moeda,
            comissao_fornecedor_pct: Number(c.comissao_fornecedor_pct) || 0,
            comissao_venda_pct: Number(c.comissao_venda_pct) || 0,
            categoria_quarto: c.categoria_quarto?.trim() || "Quarto Standard",
            cafe_da_manha: !!c.cafe_da_manha,
            reembolsavel_ate: c.reembolsavel_ate
              ? new Date(c.reembolsavel_ate).toISOString().split("T")[0]
              : null,
            observacoes: c.observacoes?.trim() || "",
            escolhido_manual: !!c.escolhido_manual,
          })),
        })),
      };

      // 1. Salvar Cotação e Hotéis
      const resCotacao = await fetch(`/api/cotacoes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadCotacao),
      });

      if (!resCotacao.ok) {
        const errData = await resCotacao.json();
        alert(errData.error || "Erro ao salvar cotação.");
        return;
      }

      // 2. Salvar Seções Multiproduto (Aéreo, Transfer, etc.)
      const resSections = await fetch(`/api/cotacoes/${params.id}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: editSections }),
      });

      if (!resSections.ok) {
        const errSec = await resSections.json();
        alert(errSec.error || "Erro ao salvar seções multiproduto.");
        return;
      }

      setModoEdicao(false);
      setFinanceiroMsg("Todas as alterações (Hotéis, Aéreo e Produtos) foram salvas com sucesso!");
      setTimeout(() => setFinanceiroMsg(""), 4000);
      carregarCotacao();
    } catch {
      alert("Erro de comunicação com o servidor ao salvar cotação.");
    } finally {
      setSalvandoTudo(false);
    }
  }

  async function handleReabrirCotacao(e: React.FormEvent) {
    e.preventDefault();
    if (!motivoReabertura.trim()) {
      alert("Informe a justificativa da reabertura.");
      return;
    }

    setReabrindo(true);
    try {
      const res = await fetch(`/api/cotacoes/${params.id}/reabrir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo_reabertura: motivoReabertura }),
      });

      const data = await res.json();
      if (res.ok) {
        setModalReaberturaAberto(false);
        setMotivoReabertura("");
        setFinanceiroMsg(data.mensagem || "Cotação reaberta para correção com nova versão!");
        setTimeout(() => setFinanceiroMsg(""), 5000);

        if (data.cotacao) {
          setCotacao(data.cotacao);
          prepararDadosEdicao(data.cotacao);
        } else {
          await carregarCotacao();
        }
        // Libera imediatamente todos os campos da página para edição
        setModoEdicao(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(data.error || "Erro ao reabrir cotação.");
      }
    } catch {
      alert("Erro de conexão ao reabrir cotação.");
    } finally {
      setReabrindo(false);
    }
  }

  async function handleCriarSecao(e: React.FormEvent) {
    e.preventDefault();
    if (!novoTituloSecao.trim()) {
      alert("Informe o título da seção de produto.");
      return;
    }

    setSalvandoSecao(true);
    try {
      const metadataPayload: Record<string, any> = {
        cabin_class: classePassagemInicial || "Econômica",
        price_without_baggage: Number(precoSemBagagemInicial) || 0,
        label_without_baggage: labelSemBagagemInicial.trim() || "Apenas Mão (10kg)",
        price_with_baggage: Number(precoComBagagemInicial) || 0,
        label_with_baggage: labelComBagagemInicial.trim() || "1 Mala 23kg Inclusa",
        photos: fotoUrlInicial.trim() ? [fotoUrlInicial.trim()] : [],
      };

      const finalPrice =
        Number(precoComBagagemInicial) ||
        Number(precoSemBagagemInicial) ||
        Number(precoOpcaoInicial) ||
        0;

      const res = await fetch(`/api/cotacoes/${params.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_type: novoTipoProduto,
          title: novoTituloSecao,
          description: novaDescricaoSecao,
          initial_option: tituloOpcaoInicial.trim()
            ? {
                title: tituloOpcaoInicial,
                description: descricaoLongaInicial.trim() || undefined,
                photo_url: fotoUrlInicial.trim() || null,
                price: finalPrice,
                selected: true,
                metadata: metadataPayload,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setModalNovaSecaoAberto(false);
        setNovoTituloSecao("");
        setNovaDescricaoSecao("");
        setTituloOpcaoInicial("");
        setPrecoSemBagagemInicial("");
        setLabelSemBagagemInicial("Apenas Mão (10kg)");
        setPrecoComBagagemInicial("");
        setLabelComBagagemInicial("1 Mala 23kg Inclusa");
        setPrecoOpcaoInicial("");
        setFotoUrlInicial("");
        setDescricaoLongaInicial("");
        setFinanceiroMsg("Seção de viagem adicionada com sucesso!");
        setTimeout(() => setFinanceiroMsg(""), 4000);
        carregarCotacao();
      } else {
        alert(data.error || "Erro ao criar seção de viagem.");
      }
    } catch {
      alert("Erro de conexão ao criar seção.");
    } finally {
      setSalvandoSecao(false);
    }
  }

  async function handleToggleOpcaoSecao(sectionId: string, optionId: string, selectedAtual: boolean) {
    try {
      const res = await fetch(`/api/cotacoes/${params.id}/sections/${sectionId}/options`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, selected: !selectedAtual }),
      });

      if (res.ok) {
        setCotacao((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            sections: (prev.sections || []).map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    options: s.options.map((o) =>
                      o.id === optionId ? { ...o, selected: !selectedAtual } : o
                    ),
                  }
                : s
            ),
          };
        });
      }
    } catch (err) {
      console.error("Erro ao alternar seleção de opção multiproduto:", err);
    }
  }

  async function handleGerarFinanceiro() {
    setGerandoFinanceiro(true);
    setFinanceiroMsg("");
    try {
      const res = await fetch(
        `/api/financeiro/cotacao/${params.id}/gerar-transacoes`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        setFinanceiroMsg(data.mensagem || "Transações lançadas com sucesso no Financeiro!");
        setTimeout(() => setFinanceiroMsg(""), 5000);
        carregarCotacao();
      } else {
        alert(data.error || "Não foi possível gerar as transações.");
      }
    } catch {
      alert("Erro ao comunicar com o módulo financeiro.");
    } finally {
      setGerandoFinanceiro(false);
    }
  }

  async function handleToggleEscolha(canalId: string, atual: boolean) {
    setAtualizandoEscolha(canalId);
    try {
      const res = await fetch(`/api/cotacoes/${params.id}/escolha`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canalId, escolhido: !atual }),
      });

      if (res.ok) {
        setCotacao((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            hoteis: prev.hoteis.map((h) => ({
              ...h,
              canais: h.canais.map((c) =>
                c.id === canalId ? { ...c, escolhido_manual: !atual } : c
              ),
            })),
          };
        });
      }
    } catch (err) {
      console.error("Erro ao alternar escolha:", err);
    } finally {
      setAtualizandoEscolha(null);
    }
  }

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

  if (loading || !cotacao) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">Carregando detalhes da cotação...</p>
      </div>
    );
  }

  const idades: number[] = JSON.parse(cotacao.idades_criancas || "[]");
  const ida = new Date(cotacao.data_ida).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
  const volta = new Date(cotacao.data_volta).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });

  const totalEscolhidos =
    cotacao.hoteis.flatMap((h) => h.canais.filter((c) => c.escolhido_manual)).length +
    (cotacao.sections?.flatMap((s) => s.options.filter((o) => o.selected)).length || 0);

  const secoesExibidas = modoEdicao ? editSections : cotacao.sections || [];

  function renderCardSecaoProduto(section: QuoteSection, sIdx: number) {
    return (
      <div
        key={section.id || `sec-${sIdx}`}
        className={`rounded-2xl bg-white border shadow-sm overflow-hidden transition-all ${
          modoEdicao ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200/80"
        }`}
      >
        {/* CABEÇALHO DA SEÇÃO DE PRODUTO */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs border border-slate-200 flex-shrink-0">
              {getSectionIcon(section.product_type)}
            </div>

            {!modoEdicao ? (
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {section.title}
                </h3>
                {section.description && (
                  <p className="text-xs text-slate-500">{section.description}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">
                    Título do Serviço / Produto *
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      handleAtualizarSecaoInline(sIdx, "title", e.target.value)
                    }
                    placeholder="Ex: Passagens Aéreas Internacionais"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">
                    Descrição Geral da Seção
                  </label>
                  <input
                    type="text"
                    value={section.description || ""}
                    onChange={(e) =>
                      handleAtualizarSecaoInline(sIdx, "description", e.target.value)
                    }
                    placeholder="Ex: Voos de ida e volta saindo de Guarulhos"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {modoEdicao && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdicionarOpcaoSecaoInline(sIdx)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-900 text-xs font-bold border border-brand-200 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                {section.product_type === "CAR_RENTAL"
                  ? "+ Carro"
                  : section.product_type === "FLIGHT"
                  ? "+ Voo"
                  : "+ Opção"}
              </button>
              <button
                type="button"
                onClick={() => handleRemoverSecaoInline(sIdx)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir Seção
              </button>
            </div>
          )}
        </div>

        {/* OPÇÕES DA SEÇÃO DE PRODUTO */}
        <div className="p-6 space-y-4">
          {section.options.map((opt, oIdx) => {
            let meta: Record<string, any> = {};
            try {
              meta = typeof opt.metadata === "string" ? JSON.parse(opt.metadata || "{}") : opt.metadata || {};
            } catch {
              meta = {};
            }

            const cabinClass = meta.cabin_class || "Econômica";
            const priceWithoutBaggage = meta.price_without_baggage ?? "";
            const labelWithoutBaggage =
              meta.label_without_baggage || meta.label_sem_bagagem || "Apenas Mão (10kg)";
            const priceWithBaggage = meta.price_with_baggage ?? "";
            const labelWithBaggage =
              meta.label_with_baggage || meta.label_com_bagagem || "1 Mala 23kg Inclusa";

            return (
              <div
                key={opt.id || `opt-${oIdx}`}
                className={`rounded-xl p-5 border transition-all space-y-4 ${
                  opt.selected
                    ? "bg-amber-50/40 border-amber-300 shadow-xs"
                    : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                }`}
              >
                {!modoEdicao ? (
                  /* MODO LEITURA */
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-extrabold text-slate-900">
                          {opt.title}
                        </h4>
                        {cabinClass && section.product_type === "FLIGHT" && (
                          <span className="bg-sky-50 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded border border-sky-200">
                            {cabinClass}
                          </span>
                        )}
                      </div>
                      {opt.photo_url && (
                        <div className="w-48 h-28 rounded-lg overflow-hidden border border-slate-200 bg-white p-1 shadow-2xs">
                          <img
                            src={opt.photo_url}
                            alt={opt.title}
                            className="w-full h-full object-contain bg-slate-50 rounded"
                          />
                        </div>
                      )}
                      {opt.description && (
                        <p className="text-xs text-slate-600 whitespace-pre-line bg-white/80 p-3 rounded-lg border border-slate-200/70">
                          {opt.description}
                        </p>
                      )}
                      {(Number(priceWithoutBaggage) > 0 || Number(priceWithBaggage) > 0) ? (
                        <div className="flex flex-wrap gap-3 pt-1 text-xs">
                          {Number(priceWithoutBaggage) > 0 && (
                            <span className="font-semibold text-slate-700 bg-white/90 px-2 py-1 rounded border border-slate-200">
                              Sem Bagagem ({labelWithoutBaggage}): <strong>{opt.currency} {Number(priceWithoutBaggage).toFixed(2)}</strong>
                            </span>
                          )}
                          {Number(priceWithBaggage) > 0 && (
                            <span className="font-bold text-brand-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                              Com Bagagem ({labelWithBaggage}): <strong>{opt.currency} {Number(priceWithBaggage).toFixed(2)}</strong>
                            </span>
                          )}
                        </div>
                      ) : (
                        Number(opt.price) > 0 && (
                          <div className="text-xs font-bold text-brand-900 pt-1">
                            Valor: {opt.currency} {Number(opt.price).toFixed(2)}
                          </div>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleOpcaoSecao(section.id!, opt.id!, opt.selected)
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        opt.selected
                          ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600 ring-2 ring-amber-300"
                          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.selected ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-white" />
                          ✓ Opção Selecionada
                        </>
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5 text-slate-400" />
                          Selecionar para Proposta
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* MODO EDIÇÃO COMPLETO COM CAMPOS PARA AÉREO, FOTOS E DUAS OPÇÕES DE VALORES */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                      <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                        {getSectionIcon(section.product_type)}
                        Opção #{oIdx + 1} ({section.title})
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={opt.selected}
                            onChange={(e) =>
                              handleAtualizarOpcaoSecaoInline(
                                sIdx,
                                oIdx,
                                "selected",
                                e.target.checked
                              )
                            }
                            className="rounded text-brand-900 focus:ring-brand-900 h-4 w-4"
                          />
                          <span>✓ Selecionada na Proposta</span>
                        </label>
                        {section.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoverOpcaoSecaoInline(sIdx, oIdx)}
                            className="text-xs text-rose-600 font-bold hover:underline"
                          >
                            Remover Opção
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EDICAO ESPECIFICA POR TIPO DE PRODUTO */}
                    {section.product_type === "FLIGHT" ? (
                      /* LAYOUT ESPECÍFICO PARA AÉREO */
                      <div className="space-y-4">
                        {/* Linha 1: Nome da Opção, Classe e Moeda */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Nome da Opção / Voo *
                            </label>
                            <input
                              type="text"
                              required
                              value={opt.title}
                              onChange={(e) =>
                                handleAtualizarOpcaoSecaoInline(
                                  sIdx,
                                  oIdx,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="Ex: Voo LATAM Direto (Guarulhos -> Orlando)"
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Tipo / Classe da Passagem
                            </label>
                            <select
                              value={cabinClass}
                              onChange={(e) =>
                                handleAtualizarMetadataOpcao(
                                  sIdx,
                                  oIdx,
                                  "cabin_class",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold focus:border-brand-900 focus:outline-none"
                            >
                              <option value="Econômica">Classe Econômica</option>
                              <option value="Premium Economy">Premium Economy</option>
                              <option value="Executiva (Business)">Executiva (Business)</option>
                              <option value="Primeira Classe (First)">Primeira Classe (First)</option>
                              <option value="Outra">Outra / Personalizada</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Moeda
                            </label>
                            <select
                              value={opt.currency}
                              onChange={(e) =>
                                handleAtualizarOpcaoSecaoInline(
                                  sIdx,
                                  oIdx,
                                  "currency",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold focus:border-brand-900 focus:outline-none"
                            >
                              <option value="BRL">BRL (R$)</option>
                              <option value="USD">USD (US$)</option>
                              <option value="EUR">EUR (€)</option>
                            </select>
                          </div>
                        </div>

                        {/* Linha 2: Duas Opções de Valores e Regras de Bagagem Editáveis */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                          {/* Bloco SEM Bagagem */}
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                                <Luggage className="h-3 w-3 text-slate-400" />
                                Valor SEM Bagagem (R$)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={priceWithoutBaggage}
                                onChange={(e) =>
                                  handleAtualizarMetadataOpcao(
                                    sIdx,
                                    oIdx,
                                    "price_without_baggage",
                                    Number(e.target.value) || 0
                                  )
                                }
                                placeholder="Ex: 5800.00"
                                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-900 focus:border-brand-900 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                Etiqueta / Regra (Sem Bagagem)
                              </label>
                              <input
                                type="text"
                                value={labelWithoutBaggage}
                                onChange={(e) =>
                                  handleAtualizarMetadataOpcao(
                                    sIdx,
                                    oIdx,
                                    "label_without_baggage",
                                    e.target.value
                                  )
                                }
                                placeholder="Ex: Apenas Mão (10kg), Item Pessoal..."
                                className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 focus:border-brand-900 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Bloco COM Bagagem */}
                          <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/30 space-y-2">
                            <div>
                              <label className="block text-[10px] font-bold text-brand-900 uppercase flex items-center gap-1">
                                <Luggage className="h-3 w-3 text-amber-600" />
                                Valor COM Bagagem (R$)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={priceWithBaggage}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  handleAtualizarMetadataOpcao(
                                    sIdx,
                                    oIdx,
                                    "price_with_baggage",
                                    val
                                  );
                                  handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "price", val);
                                }}
                                placeholder="Ex: 6513.00"
                                className="w-full rounded-lg border border-amber-300 bg-white p-2 text-xs font-bold text-brand-900 focus:border-brand-900 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-amber-900 uppercase">
                                Etiqueta / Regra (Com Bagagem)
                              </label>
                              <input
                                type="text"
                                value={labelWithBaggage}
                                onChange={(e) =>
                                  handleAtualizarMetadataOpcao(
                                    sIdx,
                                    oIdx,
                                    "label_with_baggage",
                                    e.target.value
                                  )
                                }
                                placeholder="Ex: 1 Mala 23kg Inclusa, 2 Malas 23kg..."
                                className="w-full rounded-lg border border-amber-300 bg-white p-1.5 text-xs font-semibold text-brand-900 focus:border-brand-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Linha 3: Foto/Print do Trecho e Horários & Link Oficial */}
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                          <ImageUploadDropzone
                            value={opt.photo_url || ""}
                            onChange={(imgData) => {
                              handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "photo_url", imgData);
                              handleAtualizarMetadataOpcao(sIdx, oIdx, "photos", imgData ? [imgData] : []);
                            }}
                            label="Foto / Print dos Trechos e Horários do Voo (Aparece no PDF)"
                            helperText="Tire um print da tela (PrintScreen / Win+Shift+S), cole aqui com Ctrl+V ou faça upload da imagem"
                          />

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Link de Detalhes / Cia Aérea (Opcional)
                            </label>
                            <input
                              type="url"
                              value={opt.external_link || ""}
                              onChange={(e) =>
                                handleAtualizarOpcaoSecaoInline(
                                  sIdx,
                                  oIdx,
                                  "external_link",
                                  e.target.value
                                )
                              }
                              placeholder="https://..."
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-brand-900 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Linha 4: Descrição Longa dos Trechos / Conexões / Horários */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Descrição Detalhada / Trechos, Escalas, Horários e Regras (Texto Longo)
                          </label>
                          <textarea
                            rows={4}
                            value={opt.description || ""}
                            onChange={(e) =>
                              handleAtualizarOpcaoSecaoInline(
                                sIdx,
                                oIdx,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Escreva livremente todos os trechos, horários de voo, tempo de conexão e regras de bagagem..."
                            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      /* LAYOUT PADRÃO PARA DEMAIS PRODUTOS (TRANSFER, INGRESSOS, PARQUES, CARROS, SEGURO, ETC.) */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Nome da Opção / Plano / Serviço *
                            </label>
                            <input
                              type="text"
                              required
                              value={opt.title}
                              onChange={(e) =>
                                handleAtualizarOpcaoSecaoInline(
                                  sIdx,
                                  oIdx,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="Ex: SUV Automático, Ingresso Disney 4 Dias..."
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Valor Total ({opt.currency}) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={opt.price}
                              onChange={(e) =>
                                handleAtualizarOpcaoSecaoInline(
                                  sIdx,
                                  oIdx,
                                  "price",
                                  Number(e.target.value) || 0
                                )
                              }
                              placeholder="0.00"
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                          <ImageUploadDropzone
                            value={opt.photo_url || ""}
                            onChange={(imgData) => {
                              handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "photo_url", imgData);
                              handleAtualizarMetadataOpcao(sIdx, oIdx, "photos", imgData ? [imgData] : []);
                            }}
                            label="Foto / Imagem / Voucher (Opcional - Aparece no PDF)"
                            helperText="Arraste uma imagem, selecione do computador ou cole um print com Ctrl+V"
                          />

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Link Oficial / Detalhes (Opcional)
                            </label>
                            <input
                              type="url"
                              value={opt.external_link || ""}
                              onChange={(e) =>
                                handleAtualizarOpcaoSecaoInline(
                                  sIdx,
                                  oIdx,
                                  "external_link",
                                  e.target.value
                                )
                              }
                              placeholder="https://..."
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-brand-900 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Descrição Detalhada / Regras / Coberturas
                          </label>
                          <textarea
                            rows={3}
                            value={opt.description || ""}
                            onChange={(e) =>
                              handleAtualizarOpcaoSecaoInline(
                                sIdx,
                                oIdx,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Descreva as condições, inclusões, termos e detalhes deste serviço..."
                            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {modoEdicao && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleAdicionarOpcaoSecaoInline(sIdx)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 hover:border-brand-600 hover:bg-brand-50/50 text-xs font-bold text-slate-700 hover:text-brand-900 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="h-4 w-4 text-brand-700" />
                {section.product_type === "CAR_RENTAL"
                  ? "+ Adicionar Outro Carro nesta Cotação (Ex: SUV, Sedan, Minivan)"
                  : section.product_type === "FLIGHT"
                  ? "+ Adicionar Outra Opção de Voo"
                  : `+ Adicionar Outra Opção em ${section.title}`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {financeiroMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl border border-gold-500/30 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{financeiroMsg}</span>
          <Link href="/financeiro" className="ml-2 underline text-gold-300">
            Ver Financeiro
          </Link>
        </div>
      )}

      {/* BARRA FIXA DE CONTROLE DE EDIÇÃO */}
      {modoEdicao && (
        <div className="sticky top-0 z-40 bg-amber-500 text-slate-950 px-4 py-3 shadow-lg border-b border-amber-600 transition-all animate-in slide-in-from-top duration-200">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Edit3 className="h-5 w-5 text-slate-950" />
              <span>
                MODO DE EDIÇÃO ATIVO — Todos os campos, hotéis, aéreos e serviços estão liberados para alteração direta.
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancelarEdicao}
                disabled={salvandoTudo}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-slate-800 shadow-xs transition-all cursor-pointer"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarTodasAlteracoes}
                disabled={salvandoTudo}
                className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-black text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5 text-gold-400" />
                {salvandoTudo ? "Salvando..." : "Salvar Todas as Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navegação e Ações Superiores */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Histórico
            </Link>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">
              Criado por <strong>{cotacao.usuario.nome}</strong> • Versão <strong>v{cotacao.versao_atual || 1}.0</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Reabrir para Correção com Versionamento */}
            <button
              onClick={() => setModalReaberturaAberto(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <History className="h-4 w-4 text-slate-500" />
              Reabrir para Correção
            </button>

            {/* BOTÃO PRINCIPAL: EDITAR COTAÇÃO */}
            {!modoEdicao ? (
              <button
                onClick={handleEntrarModoEdicao}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-900/30 bg-brand-50 px-4 py-2.5 text-xs font-black text-brand-900 shadow-sm hover:bg-brand-100 transition-all cursor-pointer ring-1 ring-brand-900/20"
              >
                <Edit3 className="h-4 w-4 text-brand-700" />
                Editar Cotação
              </button>
            ) : (
              <button
                onClick={handleSalvarTodasAlteracoes}
                disabled={salvandoTudo}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4 text-gold-400" />
                {salvandoTudo ? "Salvando..." : "Salvar Alterações"}
              </button>
            )}

            {/* Adicionar Outros Produtos (Aéreo, Transfer, Seguro, etc.) */}
            <button
              onClick={() => setModalNovaSecaoAberto(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold-400/50 bg-gold-50 px-3.5 py-2.5 text-xs font-bold text-gold-950 shadow-2xs hover:bg-gold-100 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-gold-700" />
              + Produto Turístico
            </button>

            {/* Lançar no Financeiro */}
            <button
              onClick={handleGerarFinanceiro}
              disabled={gerandoFinanceiro}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50"
            >
              <DollarSign className="h-4 w-4 text-emerald-600" />
              {gerandoFinanceiro ? "Lançando..." : "Lançar no Financeiro"}
            </button>

            {/* Gerar Proposta Cliente */}
            <Link
              href={`/cotacoes/${cotacao.id}/proposta`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-800 transition-all"
            >
              <FileText className="h-4 w-4 text-gold-400" />
              Visualizar Proposta
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PARÂMETROS GERAIS DA VIAGEM (LEITURA OU EDIÇÃO COMPLETA) */}
        {/* ------------------------------------------------------------- */}
        <div className={`rounded-2xl bg-white p-6 shadow-sm border transition-all ${
          modoEdicao ? "border-amber-400 ring-2 ring-amber-200/60 bg-amber-50/10" : "border-slate-200/80"
        }`}>
          {!modoEdicao ? (
            /* MODO LEITURA */
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    {cotacao.cliente_nome}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 border border-brand-200">
                    <MapPin className="h-3.5 w-3.5 text-brand-600" />
                    {cotacao.destino}
                  </span>
                  {totalEscolhidos > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      {totalEscolhidos} item(ns) selecionado(s) para proposta
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Nenhum item selecionado ainda
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Check-in: {ida} — Check-out: {volta}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="h-4 w-4 text-slate-400" />
                    {cotacao.adultos} adulto(s)
                    {cotacao.criancas > 0 &&
                      `, ${cotacao.criancas} criança(s) (idades: ${idades.join(", ")} anos)`}
                    , {cotacao.quartos} quarto(s)
                  </span>
                </div>
              </div>

              {/* Quadro de Câmbio e Comissão */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Câmbio USD</span>
                  <strong className="text-slate-900 font-bold">
                    R$ {cotacao.cotacao_usd.toFixed(4)}
                  </strong>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Câmbio EUR</span>
                  <strong className="text-slate-900 font-bold">
                    R$ {cotacao.cotacao_eur.toFixed(4)}
                  </strong>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Comissão Padrão</span>
                  <strong className="text-slate-900 font-bold">
                    {cotacao.comissao_padrao_agencia_pct.toFixed(2)}%
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            /* MODO DE EDIÇÃO COMPLETA */
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <span className="text-xs font-black uppercase text-brand-900 tracking-wider flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4" />
                  1. Parâmetros Principais da Viagem & Clientes
                </span>
                <span className="text-xs text-amber-700 font-bold">
                  ✎ Todos os campos liberados para alteração direta
                </span>
              </div>

              {/* Linha 1: Cliente, Destino e Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={editClienteNome}
                    onChange={(e) => setEditClienteNome(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destino Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={editDestino}
                    onChange={(e) => setEditDestino(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Check-in (Ida) *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDataIda}
                    onChange={(e) => setEditDataIda(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Check-out (Volta) *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDataVolta}
                    onChange={(e) => setEditDataVolta(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Linha 2: Adultos, Crianças, Quartos, Câmbio e Comissão */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Adultos
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editAdultos}
                    onChange={(e) => setEditAdultos(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Crianças
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editCriancas}
                    onChange={(e) => handleCriancasChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Quartos
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editQuartos}
                    onChange={(e) => setEditQuartos(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Câmbio USD (R$)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editCotacaoUsd}
                    onChange={(e) => setEditCotacaoUsd(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Câmbio EUR (R$)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editCotacaoEur}
                    onChange={(e) => setEditCotacaoEur(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Comissão Padrão (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editComissaoPadrao}
                    onChange={(e) => setEditComissaoPadrao(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-brand-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Se houver crianças, inputs dinâmicos de idades */}
              {editCriancas > 0 && (
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-xs font-bold text-amber-900 block">
                    Idades das Crianças ({editCriancas})
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: editCriancas }).map((_, idx) => (
                      <div key={idx} className="w-28">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Criança #{idx + 1} (anos)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={17}
                          value={editIdadesCriancas[idx] ?? 5}
                          onChange={(e) => handleIdadeChange(idx, Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================= */}
        {/* 1. MÓDULO DE PASSAGENS AÉREAS & VOOS COTADOS */}
        {/* ============================================================= */}
        {(() => {
          const secoesAereo = secoesExibidas
            .map((section, originalIdx) => ({ section, originalIdx }))
            .filter((item) => item.section.product_type === "FLIGHT");

          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Plane className="h-5 w-5 text-sky-600" />
                    1. Passagens Aéreas & Voos Cotados ({secoesAereo.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cadastre opções de voo, classes tarifárias, bagagens e fotos/prints de itinerários com horários.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNovoTipoProduto("FLIGHT");
                    setNovoTituloSecao("Passagens Aéreas");
                    setModalNovaSecaoAberto(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-950 bg-sky-50 border border-sky-300 px-3.5 py-2 rounded-xl hover:bg-sky-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="h-4 w-4 text-sky-700" />
                  + Adicionar Aéreo
                </button>
              </div>

              {secoesAereo.length > 0 ? (
                <div className="space-y-5">
                  {secoesAereo.map(({ section, originalIdx }) =>
                    renderCardSecaoProduto(section, originalIdx)
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-6 text-center">
                  <Plane className="h-8 w-8 text-sky-400 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-800">
                    Nenhuma passagem aérea cadastrada nesta cotação
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 mb-3">
                    Inclua opções de voos com foto dos trechos e valores com e sem bagagem.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipoProduto("FLIGHT");
                      setNovoTituloSecao("Passagens Aéreas");
                      setModalNovaSecaoAberto(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    + Adicionar Passagem Aérea
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================= */}
        {/* 2. MÓDULO DE HOSPEDAGEM (HOTÉIS & CANAIS DE VENDA) */}
        {/* ============================================================= */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-900" />
                2. Hospedagem & Hotéis Cotados ({modoEdicao ? editHoteis.length : cotacao.hoteis.length})
              </h2>
              {modoEdicao && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Edite nomes, canais, moedas, taxas e comissões com recálculo automático em tempo real.
                </p>
              )}
            </div>

            {modoEdicao && (
              <button
                type="button"
                onClick={handleAdicionarHotelInline}
                className="inline-flex items-center gap-1.5 text-xs font-black text-brand-900 bg-brand-50 border border-brand-300 px-4 py-2 rounded-xl hover:bg-brand-100 transition-all cursor-pointer shadow-xs"
              >
                <PlusCircle className="h-4 w-4 text-brand-700" />
                + Adicionar Outro Hotel
              </button>
            )}
          </div>

          {(modoEdicao ? editHoteis : cotacao.hoteis).map((hotel, hotelIndex) => (
            <div
              key={hotel.id || `hotel-${hotelIndex}`}
              className={`rounded-2xl bg-white border shadow-sm overflow-hidden transition-all ${
                modoEdicao ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200/80"
              }`}
            >
              {/* CABEÇALHO DO HOTEL */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-gold-300 font-bold text-xs flex-shrink-0">
                    {hotelIndex + 1}
                  </div>

                  {!modoEdicao ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {hotel.hotel_nome}
                        </h3>
                        {hotel.link_hotel && (
                          <a
                            href={hotel.link_hotel}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      {hotel.descricao && (
                        <p className="text-xs text-slate-500">{hotel.descricao}</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">
                          Nome do Hotel #{hotelIndex + 1} *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Hôtel Plaza Athénée Paris"
                          value={hotel.hotel_nome}
                          onChange={(e) =>
                            handleAtualizarHotel(hotelIndex, "hotel_nome", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">
                          Link Oficial / Booking (Opcional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={hotel.link_hotel || ""}
                          onChange={(e) =>
                            handleAtualizarHotel(hotelIndex, "link_hotel", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-brand-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">
                          Descrição / Localização
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Próximo à Champs-Élysées"
                          value={hotel.descricao || ""}
                          onChange={(e) =>
                            handleAtualizarHotel(hotelIndex, "descricao", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-brand-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {modoEdicao && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdicionarCanalInline(hotelIndex)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-900 text-xs font-bold border border-brand-200 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      + Canal
                    </button>
                    {(modoEdicao ? editHoteis : cotacao.hoteis).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoverHotelInline(hotelIndex)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir Hotel
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* LISTA DE CANAIS / TARIFAS */}
              <div className="p-6 space-y-4">
                {hotel.canais.map((canal, canalIndex) => {
                  const supplierTheme = getSupplierTheme(canal.canal_nome);
                  return (
                    <div
                      key={canal.id || `canal-${canalIndex}`}
                      className={`rounded-xl p-5 border transition-all ${
                        canal.escolhido_manual
                          ? "bg-amber-50/40 border-amber-300 shadow-sm ring-1 ring-amber-300"
                          : "bg-slate-50/70 border-slate-200"
                      }`}
                    >
                      {!modoEdicao ? (
                        /* MODO LEITURA DO CANAL */
                        <div>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border ${supplierTheme.badgeClass}`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${supplierTheme.dotColor}`}
                                ></span>
                                {canal.canal_nome}
                              </span>

                              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {canal.categoria_quarto}
                              </span>
                              {canal.cafe_da_manha && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                                  <Coffee className="h-3.5 w-3.5 text-amber-600" />
                                  Café da manhã incluso
                                </span>
                              )}
                              {canal.reembolsavel_ate && (
                                <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                                  Cancelamento grátis até{" "}
                                  {new Date(canal.reembolsavel_ate).toLocaleDateString(
                                    "pt-BR",
                                    { timeZone: "UTC" }
                                  )}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                handleToggleEscolha(canal.id!, canal.escolhido_manual!)
                              }
                              disabled={atualizandoEscolha === canal.id}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                                canal.escolhido_manual
                                  ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600 ring-2 ring-amber-300"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                              }`}
                            >
                              {canal.escolhido_manual ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-white" />
                                  ✓ Opção Selecionada na Proposta
                                </>
                              ) : (
                                <>
                                  <Star className="h-3.5 w-3.5 text-slate-400" />
                                  Marcar Escolha
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                                Valor Fornecedor
                              </span>
                              <strong className="text-slate-800 text-sm font-bold block">
                                {canal.moeda} {Number(canal.valor_mostrado).toFixed(2)}
                              </strong>
                              <span className="text-[10px] text-slate-500">
                                Comis. {canal.comissao_fornecedor_pct}%
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Custo Líquido (RN-02)
                              </span>
                              <strong className="text-slate-800 text-sm font-bold block mt-1">
                                {canal.moeda} {(canal.custo_liquido || 0).toFixed(2)}
                              </strong>
                              <span className="text-[10px] text-slate-500">
                                Câmbio: {(canal.cotacao_utilizada || 1).toFixed(2)}
                              </span>
                            </div>

                            <div
                              className={`p-3 rounded-lg border ${
                                canal.menor_custo_do_grupo
                                  ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                  Custo BRL (RN-04)
                                </span>
                                {canal.menor_custo_do_grupo && (
                                  <span className="bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                    MENOR CUSTO
                                  </span>
                                )}
                              </div>
                              <strong className="text-slate-900 text-sm font-black block mt-1">
                                R$ {(canal.custo_em_brl || 0).toFixed(2)}
                              </strong>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                                Margem Venda (RN-05)
                              </span>
                              <strong className="text-slate-800 text-sm font-bold block">
                                {Number(canal.comissao_venda_pct).toFixed(2)}%
                              </strong>
                              <span className="text-[10px] text-slate-500">
                                Margem Agência
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Venda Final Cliente
                              </span>
                              <strong className="text-slate-900 text-sm font-black block mt-1">
                                R$ {(canal.valor_final_venda || 0).toFixed(2)}
                              </strong>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Lucro Bruto Agência
                              </span>
                              <strong className="text-brand-900 text-sm font-black block mt-1">
                                R$ {((canal.valor_final_venda || 0) - (canal.custo_em_brl || 0)).toFixed(2)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* MODO DE EDIÇÃO COMPLETO DO CANAL */
                        <div className="space-y-4">
                          {/* LINHA 1: Canal, Moeda, Valor, Taxas, Comissões */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Canal de Venda (Fornecedor) *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Booking, Best Buy, Interep..."
                                value={canal.canal_nome}
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "canal_nome",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Moeda *
                              </label>
                              <select
                                value={canal.moeda}
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "moeda",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-500 focus:outline-none"
                              >
                                <option value="BRL">BRL (R$)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Valor Fornecedor *
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                required
                                placeholder="0.00"
                                value={canal.valor_mostrado}
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "valor_mostrado",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Taxas (na moeda)
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={canal.taxas ?? ""}
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "taxas",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Comis. Fornecedor %
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0%"
                                value={canal.comissao_fornecedor_pct}
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "comissao_fornecedor_pct",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Comis. Venda % (Markup) *
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                required
                                placeholder="14%"
                                value={canal.comissao_venda_pct}
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "comissao_venda_pct",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* LINHA 2: Categoria Quarto, Café, Reembolsável, Observações e Ações */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Categoria do Quarto *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Standard, Deluxe..."
                                value={canal.categoria_quarto}
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "categoria_quarto",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-3 pt-4 sm:pt-0">
                              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={canal.cafe_da_manha}
                                  onChange={(e) =>
                                    handleAtualizarCanalInline(
                                      hotelIndex,
                                      canalIndex,
                                      "cafe_da_manha",
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                                />
                                <Coffee className="h-3.5 w-3.5 text-amber-600" />
                                Café da manhã
                              </label>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Reembolsável até (opcional)
                              </label>
                              <input
                                type="date"
                                value={
                                  canal.reembolsavel_ate
                                    ? typeof canal.reembolsavel_ate === "string"
                                      ? canal.reembolsavel_ate
                                      : new Date(canal.reembolsavel_ate).toISOString().split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "reembolsavel_ate",
                                    e.target.value || null
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Observações
                              </label>
                              <input
                                type="text"
                                placeholder="Notas internas..."
                                value={canal.observacoes || ""}
                                onChange={(e) =>
                                  handleAtualizarCanalInline(
                                    hotelIndex,
                                    canalIndex,
                                    "observacoes",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 sm:pt-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleEscolhaInline(hotelIndex, canalIndex)
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  canal.escolhido_manual
                                    ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600 ring-2 ring-amber-300"
                                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                                }`}
                                title="Marcar como opção escolhida para a proposta"
                              >
                                {canal.escolhido_manual ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-white" />
                                    ✓ Selecionada
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-3.5 w-3.5 text-slate-400" />
                                    Marcar Escolha
                                  </>
                                )}
                              </button>

                              {hotel.canais.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoverCanalInline(hotelIndex, canalIndex)
                                  }
                                  className="inline-flex items-center gap-1 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
                                  title="Excluir este canal"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================= */}
        {/* 3. MÓDULO DE PRODUTOS TURÍSTICOS & DEMAIS SERVIÇOS */}
        {/* ============================================================= */}
        {(() => {
          const secoesOutrosProdutos = secoesExibidas
            .map((section, originalIdx) => ({ section, originalIdx }))
            .filter((item) => item.section.product_type !== "FLIGHT");

          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-brand-900" />
                    3. Produtos Turísticos & Demais Serviços ({secoesOutrosProdutos.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Adicione e gerencie locação de carros, ingressos, parques temáticos, seguro viagem, transfers e passeios.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNovoTipoProduto("CAR_RENTAL");
                    setNovoTituloSecao("Locação de Carro");
                    setModalNovaSecaoAberto(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-950 bg-gold-50 border border-gold-300 px-3.5 py-2 rounded-xl hover:bg-gold-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="h-4 w-4 text-gold-700" />
                  + Adicionar Produto Turístico
                </button>
              </div>

              {secoesOutrosProdutos.length > 0 ? (
                <div className="space-y-5">
                  {secoesOutrosProdutos.map(({ section, originalIdx }) =>
                    renderCardSecaoProduto(section, originalIdx)
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-800">
                    Nenhum produto turístico adicional adicionado
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 mb-3">
                    Você pode incluir locação de carros, ingressos de atrações, parques, seguro viagem ou transfers.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipoProduto("CAR_RENTAL");
                      setNovoTituloSecao("Locação de Carro");
                      setModalNovaSecaoAberto(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-900 bg-white border border-slate-300 hover:bg-slate-100 px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    + Adicionar Produto Turístico
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* MODAL DE REABERTURA COM VERSIONAMENTO */}
      {modalReaberturaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-brand-900" />
                <h3 className="font-bold text-brand-900 text-base">
                  Reabrir Cotação para Correção
                </h3>
              </div>
              <button
                onClick={() => setModalReaberturaAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReabrirCotacao} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Reabrir esta cotação criará um <strong>snapshot imutável da versão atual (v{cotacao.versao_atual || 1})</strong> e avançará para a versão <strong>v{(cotacao.versao_atual || 1) + 1}</strong> com registro de auditoria completo.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo da Reabertura / Correção *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Cliente solicitou alteração de datas ou inclusão de seguro adicional..."
                  value={motivoReabertura}
                  onChange={(e) => setMotivoReabertura(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-brand-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalReaberturaAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reabrindo}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {reabrindo ? "Reabrindo..." : "Confirmar e Criar Nova Versão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOVA SEÇÃO MULTIPRODUTO (LAYOUT COMPACTO & ERGONÔMICO) */}
      {modalNovaSecaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-4 sm:p-5 space-y-3 my-auto">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gold-600" />
                <h3 className="font-bold text-brand-900 text-sm sm:text-base">
                  Adicionar Produto Turístico à Viagem
                </h3>
              </div>
              <button
                onClick={() => setModalNovaSecaoAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCriarSecao} className="space-y-3">
              {/* SELETOR COMPACTO DOS 8 PRODUTOS TURÍSTICOS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Categoria do Produto *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {PRODUCT_TYPES.map((pt) => {
                    const isSelected = novoTipoProduto === pt.type;
                    return (
                      <button
                        key={pt.type}
                        type="button"
                        onClick={() => {
                          setNovoTipoProduto(pt.type);
                          setNovoTituloSecao(pt.label);
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-brand-900 text-white border-brand-900 shadow-2xs ring-1 ring-gold-400"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="scale-90">{getSectionIcon(pt.type)}</span>
                        <span className="truncate">{pt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Título da Seção na Proposta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Passagens Aéreas, Ingressos Disney..."
                  value={novoTituloSecao}
                  onChange={(e) => setNovoTituloSecao(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold focus:border-brand-900 focus:outline-none"
                />
              </div>

              {/* CARD DE OPÇÃO INICIAL DINÂMICO POR TIPO DE PRODUTO */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-800 block border-b pb-1 border-slate-200 flex items-center gap-1.5">
                  {getSectionIcon(novoTipoProduto)}
                  {novoTipoProduto === "FLIGHT" ? "Detalhes do Voo" : `Opção de ${novoTituloSecao}`}
                </span>

                {novoTipoProduto === "FLIGHT" ? (
                  /* CAMPOS EXCLUSIVOS DE AÉREO (COMPACTO) */
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Nome do Voo / Cia Aérea *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Voo LATAM Direto (GRU -> MCO)"
                          value={tituloOpcaoInicial}
                          onChange={(e) => setTituloOpcaoInicial(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Tipo / Classe
                        </label>
                        <select
                          value={classePassagemInicial}
                          onChange={(e) => setClassePassagemInicial(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold focus:border-brand-900 focus:outline-none"
                        >
                          <option value="Econômica">Classe Econômica</option>
                          <option value="Premium Economy">Premium Economy</option>
                          <option value="Executiva (Business)">Executiva (Business)</option>
                          <option value="Primeira Classe (First)">Primeira Classe (First)</option>
                          <option value="Outra">Outra / Personalizada</option>
                        </select>
                      </div>
                    </div>

                    {/* DUAS OPÇÕES DE VALORES E ETIQUETAS EDITÁVEIS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                            <Luggage className="h-3 w-3 text-slate-400" />
                            Valor Sem Bagagem (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 5800.00"
                            value={precoSemBagagemInicial}
                            onChange={(e) => setPrecoSemBagagemInicial(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">
                            Regra / Etiqueta (Sem Bagagem)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Apenas Mão (10kg)"
                            value={labelSemBagagemInicial}
                            onChange={(e) => setLabelSemBagagemInicial(e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-800 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-900 uppercase flex items-center gap-1">
                            <Luggage className="h-3 w-3 text-amber-600" />
                            Valor Com Bagagem (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 6513.00"
                            value={precoComBagagemInicial}
                            onChange={(e) => setPrecoComBagagemInicial(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full rounded-md border border-amber-300 bg-amber-50/30 px-2.5 py-1 text-xs font-bold text-brand-900 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-amber-900 uppercase">
                            Regra / Etiqueta (Com Bagagem)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 1 Mala 23kg Inclusa"
                            value={labelComBagagemInicial}
                            onChange={(e) => setLabelComBagagemInicial(e.target.value)}
                            className="w-full rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-bold text-brand-900 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FOTO DO TRECHO / HORÁRIOS */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <ImageUploadDropzone
                        value={fotoUrlInicial}
                        onChange={(imgData) => setFotoUrlInicial(imgData)}
                        label="Foto / Print dos Trechos (Ctrl+V)"
                        helperText="Cole o print do voo com Ctrl+V ou selecione imagem"
                        compact={true}
                      />
                    </div>

                    {/* DESCRIÇÃO */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Descrição / Trechos e Horários
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Trechos de ida/volta, horários e regras..."
                        value={descricaoLongaInicial}
                        onChange={(e) => setDescricaoLongaInicial(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs leading-relaxed focus:border-brand-900 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  /* CAMPOS DEMAIS PRODUTOS (COMPACTO) */
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Nome da Opção / Plano / Serviço *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={
                            novoTipoProduto === "CAR_RENTAL"
                              ? "Ex: SUV Automático - Localiza"
                              : novoTipoProduto === "PARK"
                              ? "Ex: Disney 4 Dias Básico"
                              : novoTipoProduto === "TRAVEL_INSURANCE"
                              ? "Ex: Seguro GTA Euro Max USD 75k"
                              : novoTipoProduto === "TRANSFER"
                              ? "Ex: Van Privativa MCO -> Hotel"
                              : "Ex: Nome do Passeio ou Serviço..."
                          }
                          value={tituloOpcaoInicial}
                          onChange={(e) => setTituloOpcaoInicial(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Valor (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={precoOpcaoInicial}
                          onChange={(e) => setPrecoOpcaoInicial(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <ImageUploadDropzone
                        value={fotoUrlInicial}
                        onChange={(imgData) => setFotoUrlInicial(imgData)}
                        label="Foto / Voucher (Opcional)"
                        helperText="Cole com Ctrl+V ou selecione imagem"
                        compact={true}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Descrição / Coberturas (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Descreva as condições e detalhes deste serviço..."
                        value={descricaoLongaInicial}
                        onChange={(e) => setDescricaoLongaInicial(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs leading-relaxed focus:border-brand-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalNovaSecaoAberto(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoSecao}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {salvandoSecao ? "Adicionando..." : "Salvar Produto na Cotação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
