"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUploadDropzone from "@/components/common/ImageUploadDropzone";
import {
  aplicarDestaquesNoGrupo,
  CanalInput,
  CotacaoCambioRef,
  Moeda,
  DEFAULT_AGENCY_COMMISSION_PCT,
  safeNumber,
} from "@/lib/calculations";
import {
  Building2,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Star,
  Coffee,
  Users,
  Save,
  RotateCw,
  Check,
  Plane,
  Car,
  Ticket,
  FerrisWheel,
  ShieldCheck,
  Bus,
  Compass,
  Layers,
  Luggage,
  X,
} from "lucide-react";

type ProductType =
  | "FLIGHT"
  | "TRANSFER"
  | "TICKET"
  | "TOUR"
  | "TRAVEL_INSURANCE"
  | "CAR_RENTAL"
  | "PARK"
  | "CUSTOM_SERVICE";

const PRODUCT_TYPES: { type: ProductType; label: string }[] = [
  { type: "FLIGHT", label: "Aéreo" },
  { type: "CAR_RENTAL", label: "Locação de Carro" },
  { type: "PARK", label: "Parques Temáticos" },
  { type: "TRAVEL_INSURANCE", label: "Seguro Viagem" },
  { type: "TICKET", label: "Ingressos" },
  { type: "TRANSFER", label: "Transfers" },
  { type: "TOUR", label: "Passeios & Tours" },
  { type: "CUSTOM_SERVICE", label: "Outros Serviços" },
];

function getSectionIcon(type: string) {
  switch (type) {
    case "FLIGHT":
      return <Plane className="h-4 w-4 text-sky-600" />;
    case "CAR_RENTAL":
      return <Car className="h-4 w-4 text-emerald-600" />;
    case "PARK":
      return <FerrisWheel className="h-4 w-4 text-amber-600" />;
    case "TRAVEL_INSURANCE":
      return <ShieldCheck className="h-4 w-4 text-emerald-700" />;
    case "TICKET":
      return <Ticket className="h-4 w-4 text-rose-600" />;
    case "TRANSFER":
      return <Bus className="h-4 w-4 text-purple-600" />;
    case "TOUR":
      return <Compass className="h-4 w-4 text-cyan-600" />;
    default:
      return <Layers className="h-4 w-4 text-slate-600" />;
  }
}

interface FormCanal extends CanalInput {
  tempId: string;
}

interface FormHotel {
  tempId: string;
  hotel_nome: string;
  link_hotel?: string;
  descricao?: string;
  canais: FormCanal[];
}

interface FormSectionOption {
  tempId: string;
  title: string;
  description: string;
  photo_url: string;
  external_link: string;
  price: number | "";
  currency: string;
  selected: boolean;
  metadata: Record<string, any>;
}

interface FormSection {
  tempId: string;
  product_type: ProductType;
  title: string;
  description: string;
  options: FormSectionOption[];
}

export default function NovaCotacaoPage() {
  const router = useRouter();

  // Dados da Viagem
  const [clienteNome, setClienteNome] = useState("");
  const [destino, setDestino] = useState("");
  const [dataIda, setDataIda] = useState("");
  const [dataVolta, setDataVolta] = useState("");
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [idadesCriancas, setIdadesCriancas] = useState<number[]>([]);
  const [quartos, setQuartos] = useState(1);

  // Câmbio e Margem Padrão (RN-07, RN-09)
  const [cotacaoUsd, setCotacaoUsd] = useState(5.45);
  const [cotacaoEur, setCotacaoEur] = useState(5.91);
  const [comissaoPadraoAgencia, setComissaoPadraoAgencia] = useState(DEFAULT_AGENCY_COMMISSION_PCT);
  const [cambioStatus, setCambioStatus] = useState<"loading" | "auto" | "manual">("loading");
  const [cambioErro, setCambioErro] = useState<string | null>(null);

  // Hotéis e Canais
  const [hoteis, setHoteis] = useState<FormHotel[]>([
    {
      tempId: "h-1",
      hotel_nome: "",
      canais: [
        {
          tempId: "c-1",
          canal_nome: "Booking.com",
          valor_mostrado: "",
          taxas: "",
          moeda: "BRL",
          comissao_fornecedor_pct: "",
          comissao_venda_pct: DEFAULT_AGENCY_COMMISSION_PCT,
          categoria_quarto: "Quarto Standard",
          cafe_da_manha: true,
          reembolsavel_ate: null,
          observacoes: "",
          escolhido_manual: false,
        },
      ],
    },
  ]);

  // Seções Multiproduto (Aéreo, Carros, Parques, etc.)
  const [sections, setSections] = useState<FormSection[]>([]);

  // Modal de Nova Seção Multiproduto
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

  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Buscar câmbio inicial (RN-09)
  useEffect(() => {
    carregarCambioOnline();
  }, []);

  async function carregarCambioOnline() {
    setCambioStatus("loading");
    setCambioErro(null);
    try {
      const res = await fetch("/api/exchange");
      const data = await res.json();
      if (data.success && data.usd && data.eur) {
        setCotacaoUsd(data.usd);
        setCotacaoEur(data.eur);
        setCambioStatus("auto");
      } else {
        setCambioStatus("manual");
        setCambioErro(
          data.error || "Não foi possível carregar o câmbio automaticamente. Digite os valores manualmente."
        );
      }
    } catch {
      setCambioStatus("manual");
      setCambioErro("Falha de conexão com o serviço de câmbio. Digite manualmente.");
    }
  }

  function handleCriancasChange(qtd: number) {
    const n = Math.max(0, qtd);
    setCriancas(n);
    if (n === 0) {
      setIdadesCriancas([]);
    } else {
      setIdadesCriancas((prev) => {
        const novo = [...prev];
        while (novo.length < n) novo.push(5);
        return novo.slice(0, n);
      });
    }
  }

  function handleIdadeChange(index: number, idade: number) {
    const novo = [...idadesCriancas];
    novo[index] = Math.max(0, Math.min(17, idade));
    setIdadesCriancas(novo);
  }

  // Ações de Hotéis
  function adicionarHotel() {
    const newId = `h-${Date.now()}`;
    setHoteis((prev) => [
      ...prev,
      {
        tempId: newId,
        hotel_nome: "",
        canais: [
          {
            tempId: `c-${Date.now()}-1`,
            canal_nome: "",
            valor_mostrado: "",
            taxas: "",
            moeda: "BRL",
            comissao_fornecedor_pct: "",
            comissao_venda_pct: comissaoPadraoAgencia,
            categoria_quarto: "Quarto Standard",
            cafe_da_manha: true,
            reembolsavel_ate: null,
            observacoes: "",
            escolhido_manual: false,
          },
        ],
      },
    ]);
  }

  function removerHotel(index: number) {
    if (hoteis.length <= 1) {
      alert("A cotação precisa de pelo menos um hotel cotado.");
      return;
    }
    setHoteis((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarNomeHotel(index: number, nome: string) {
    setHoteis((prev) =>
      prev.map((h, i) => (i === index ? { ...h, hotel_nome: nome } : h))
    );
  }

  function atualizarHotelCampo(index: number, campo: "link_hotel" | "descricao", valor: string) {
    setHoteis((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [campo]: valor } : h))
    );
  }

  // Ações de Canais
  function adicionarCanal(hotelIndex: number) {
    const newCanalId = `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setHoteis((prev) =>
      prev.map((h, i) => {
        if (i !== hotelIndex) return h;
        return {
          ...h,
          canais: [
            ...h.canais,
            {
              tempId: newCanalId,
              canal_nome: "",
              valor_mostrado: "",
              taxas: "",
              moeda: "BRL",
              comissao_fornecedor_pct: "",
              comissao_venda_pct: comissaoPadraoAgencia,
              categoria_quarto: "Quarto Standard",
              cafe_da_manha: true,
              reembolsavel_ate: null,
              observacoes: "",
              escolhido_manual: false,
            },
          ],
        };
      })
    );
  }

  function removerCanal(hotelIndex: number, canalIndex: number) {
    setHoteis((prev) =>
      prev.map((h, i) => {
        if (i !== hotelIndex) return h;
        if (h.canais.length <= 1) {
          alert("O hotel deve ter pelo menos um canal.");
          return h;
        }
        return {
          ...h,
          canais: h.canais.filter((_, cIdx) => cIdx !== canalIndex),
        };
      })
    );
  }

  function atualizarCanal(
    hotelIndex: number,
    canalIndex: number,
    dados: Partial<FormCanal>
  ) {
    setHoteis((prev) =>
      prev.map((h, i) => {
        if (i !== hotelIndex) return h;
        return {
          ...h,
          canais: h.canais.map((c, cIdx) =>
            cIdx === canalIndex ? { ...c, ...dados } : c
          ),
        };
      })
    );
  }

  function toggleEscolhaManual(hotelIndex: number, canalIndex: number) {
    setHoteis((prev) =>
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

  // Ações de Seções Multiproduto
  function handleCriarSecaoModal(e: React.FormEvent) {
    e.preventDefault();
    if (!novoTituloSecao.trim()) return;

    let initMeta: Record<string, any> = {};
    if (novoTipoProduto === "FLIGHT") {
      initMeta = {
        flight_class: classePassagemInicial || "Econômica",
        without_baggage_price:
          precoSemBagagemInicial === "" ? 0 : Number(precoSemBagagemInicial),
        label_without_baggage: labelSemBagagemInicial || "Apenas Mão (10kg)",
        with_baggage_price:
          precoComBagagemInicial === "" ? 0 : Number(precoComBagagemInicial),
        label_with_baggage: labelComBagagemInicial || "1 Mala 23kg Inclusa",
        flight_photos: fotoUrlInicial ? [fotoUrlInicial] : [],
      };
    } else {
      initMeta = {
        photos: fotoUrlInicial ? [fotoUrlInicial] : [],
      };
    }

    const newOption: FormSectionOption = {
      tempId: `opt-${Date.now()}`,
      title: tituloOpcaoInicial.trim() || novoTituloSecao.trim(),
      description: descricaoLongaInicial.trim(),
      photo_url: fotoUrlInicial.trim() || "",
      external_link: "",
      price:
        novoTipoProduto === "FLIGHT"
          ? precoSemBagagemInicial === ""
            ? 0
            : Number(precoSemBagagemInicial)
          : precoOpcaoInicial === ""
          ? 0
          : Number(precoOpcaoInicial),
      currency: "BRL",
      selected: true,
      metadata: initMeta,
    };

    const newSection: FormSection = {
      tempId: `sec-${Date.now()}`,
      product_type: novoTipoProduto,
      title: novoTituloSecao.trim(),
      description: novaDescricaoSecao.trim(),
      options: [newOption],
    };

    setSections((prev) => [...prev, newSection]);

    // Limpar modal
    setModalNovaSecaoAberto(false);
    setNovoTituloSecao("Passagens Aéreas");
    setNovaDescricaoSecao("");
    setTituloOpcaoInicial("");
    setPrecoSemBagagemInicial("");
    setLabelSemBagagemInicial("Apenas Mão (10kg)");
    setPrecoComBagagemInicial("");
    setLabelComBagagemInicial("1 Mala 23kg Inclusa");
    setPrecoOpcaoInicial("");
    setFotoUrlInicial("");
    setDescricaoLongaInicial("");
  }

  function handleAtualizarSecaoInline(sectionIdx: number, field: string, value: any) {
    setSections((prev) =>
      prev.map((s, idx) => (idx === sectionIdx ? { ...s, [field]: value } : s))
    );
  }

  function handleRemoverSecaoInline(sectionIdx: number) {
    if (confirm("Tem certeza que deseja remover esta seção de produto?")) {
      setSections((prev) => prev.filter((_, idx) => idx !== sectionIdx));
    }
  }

  function handleAdicionarOpcaoSecaoInline(sectionIdx: number) {
    const target = sections[sectionIdx];
    const isFlight = target?.product_type === "FLIGHT";

    let initMeta: Record<string, any> = {};
    if (isFlight) {
      initMeta = {
        flight_class: "Econômica",
        without_baggage_price: 0,
        label_without_baggage: "Apenas Mão (10kg)",
        with_baggage_price: 0,
        label_with_baggage: "1 Mala 23kg Inclusa",
        flight_photos: [],
      };
    } else {
      initMeta = {
        photos: [],
      };
    }

    const novaOpcao: FormSectionOption = {
      tempId: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: isFlight ? "Nova Opção de Voo" : `Opção de ${target?.title || "Produto"}`,
      description: "",
      photo_url: "",
      external_link: "",
      price: 0,
      currency: "BRL",
      selected: false,
      metadata: initMeta,
    };

    setSections((prev) =>
      prev.map((s, idx) =>
        idx === sectionIdx ? { ...s, options: [...s.options, novaOpcao] } : s
      )
    );
  }

  function handleRemoverOpcaoSecaoInline(sectionIdx: number, optionIdx: number) {
    setSections((prev) =>
      prev.map((s, idx) => {
        if (idx !== sectionIdx) return s;
        return {
          ...s,
          options: s.options.filter((_, oIdx) => oIdx !== optionIdx),
        };
      })
    );
  }

  function handleAtualizarOpcaoSecaoInline(
    sectionIdx: number,
    optionIdx: number,
    field: string,
    value: any
  ) {
    setSections((prev) =>
      prev.map((s, sIdx) => {
        if (sIdx !== sectionIdx) return s;
        return {
          ...s,
          options: s.options.map((opt, oIdx) =>
            oIdx === optionIdx ? { ...opt, [field]: value } : opt
          ),
        };
      })
    );
  }

  function handleAtualizarMetadataOpcao(
    sectionIdx: number,
    optionIdx: number,
    metaKey: string,
    value: any
  ) {
    setSections((prev) =>
      prev.map((s, sIdx) => {
        if (sIdx !== sectionIdx) return s;
        return {
          ...s,
          options: s.options.map((opt, oIdx) => {
            if (oIdx !== optionIdx) return opt;
            const currentMeta = opt.metadata || {};
            return {
              ...opt,
              metadata: {
                ...currentMeta,
                [metaKey]: value,
              },
            };
          }),
        };
      })
    );
  }

  // Objeto de câmbio para cálculo em tempo real
  const cambioRef: CotacaoCambioRef = {
    cotacao_usd: Number(cotacaoUsd) || 1,
    cotacao_eur: Number(cotacaoEur) || 1,
  };

  // Submissão do Formulário
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroForm(null);

    // Validações básicas
    if (!clienteNome.trim()) {
      setErroForm("Preencha o nome do cliente.");
      return;
    }
    if (!destino.trim()) {
      setErroForm("Preencha o destino.");
      return;
    }
    if (!dataIda || !dataVolta) {
      setErroForm("Preencha as datas de ida e volta.");
      return;
    }
    if (new Date(dataIda) >= new Date(dataVolta)) {
      setErroForm("A data de volta deve ser posterior à data de ida.");
      return;
    }
    if (criancas > 0 && idadesCriancas.length !== criancas) {
      setErroForm("A quantidade de idades deve corresponder exatamente ao número de crianças.");
      return;
    }

    // Validar Hotéis
    for (let i = 0; i < hoteis.length; i++) {
      const h = hoteis[i];
      if (!h.hotel_nome.trim()) {
        setErroForm(`Preencha o nome do Hotel ${i + 1}.`);
        return;
      }
      if (h.canais.length === 0) {
        setErroForm(`O Hotel "${h.hotel_nome}" deve ter pelo menos um canal cotado.`);
        return;
      }
      for (let j = 0; j < h.canais.length; j++) {
        const c = h.canais[j];
        if (!c.canal_nome.trim()) {
          setErroForm(`Preencha o nome do canal ${j + 1} no Hotel "${h.hotel_nome}".`);
          return;
        }
        if (safeNumber(c.valor_mostrado, 0) <= 0) {
          setErroForm(`O valor do canal "${c.canal_nome}" deve ser maior que zero.`);
          return;
        }
        if (safeNumber(c.comissao_venda_pct, 0) >= 100) {
          setErroForm(`A comissão de venda do canal "${c.canal_nome}" deve ser menor que 100%.`);
          return;
        }
      }
    }

    setSalvando(true);

    try {
      const payload = {
        cliente_nome: clienteNome,
        destino,
        data_ida: dataIda,
        data_volta: dataVolta,
        adultos,
        criancas,
        idades_criancas: idadesCriancas,
        quartos,
        cotacao_usd: cotacaoUsd,
        cotacao_eur: cotacaoEur,
        comissao_padrao_agencia_pct: comissaoPadraoAgencia,
        hoteis: hoteis.map((h, idx) => ({
          hotel_nome: h.hotel_nome,
          link_hotel: h.link_hotel || null,
          descricao: h.descricao || null,
          ordem_exibicao: idx,
          canais: h.canais.map((c) => ({
            canal_nome: c.canal_nome,
            valor_mostrado: safeNumber(c.valor_mostrado, 0),
            taxas: safeNumber(c.taxas, 0),
            moeda: c.moeda,
            comissao_fornecedor_pct: safeNumber(c.comissao_fornecedor_pct, 0),
            comissao_venda_pct: safeNumber(c.comissao_venda_pct, 0),
            categoria_quarto: c.categoria_quarto,
            cafe_da_manha: Boolean(c.cafe_da_manha),
            reembolsavel_ate: c.reembolsavel_ate || null,
            observacoes: c.observacoes || "",
            escolhido_manual: Boolean(c.escolhido_manual),
          })),
        })),
        sections: sections.map((s, sIdx) => ({
          product_type: s.product_type,
          title: s.title,
          description: s.description,
          sort_order: sIdx,
          options: s.options.map((opt, oIdx) => ({
            title: opt.title,
            description: opt.description,
            photo_url: opt.photo_url || null,
            external_link: opt.external_link || null,
            price: Number(opt.price) || 0,
            currency: opt.currency || "BRL",
            selected: Boolean(opt.selected),
            sort_order: oIdx,
            metadata: JSON.stringify(opt.metadata || {}),
          })),
        })),
      };

      const res = await fetch("/api/cotacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErroForm(data.error || "Erro ao salvar a cotação.");
        setSalvando(false);
        return;
      }

      router.push(`/cotacoes/${data.cotacao.id}`);
    } catch {
      setErroForm("Falha de comunicação com o servidor ao salvar cotação.");
      setSalvando(false);
    }
  }

  // Renderizar Card de Seção de Produto Multiproduto
  function renderCardSecaoProduto(section: FormSection, sIdx: number) {
    const isFlight = section.product_type === "FLIGHT";

    return (
      <div
        key={section.tempId || `sec-${sIdx}`}
        className="rounded-2xl bg-white border border-amber-300 ring-1 ring-amber-200 shadow-sm overflow-hidden transition-all space-y-4 p-5"
      >
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 flex-1">
            <span className="p-2 rounded-xl bg-brand-50 border border-brand-200">
              {getSectionIcon(section.product_type)}
            </span>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={section.title}
                onChange={(e) =>
                  handleAtualizarSecaoInline(sIdx, "title", e.target.value)
                }
                placeholder="Título da Seção..."
                className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
              />
              <input
                type="text"
                value={section.description || ""}
                onChange={(e) =>
                  handleAtualizarSecaoInline(sIdx, "description", e.target.value)
                }
                placeholder="Descrição / Detalhes Gerais da Seção..."
                className="rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-700 focus:border-brand-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdicionarOpcaoSecaoInline(sIdx)}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {isFlight ? "+ Opção de Voo" : "+ Opção"}
            </button>
            <button
              type="button"
              onClick={() => handleRemoverSecaoInline(sIdx)}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir Seção
            </button>
          </div>
        </div>

        {/* LISTA DE OPÇÕES DENTRO DA SEÇÃO */}
        <div className="space-y-3">
          {section.options.map((opt, oIdx) => {
            const meta = opt.metadata || {};
            const optPhotos: string[] = isFlight
              ? (meta.flight_photos as string[]) || (opt.photo_url ? [opt.photo_url] : [])
              : (meta.photos as string[]) || (opt.photo_url ? [opt.photo_url] : []);

            return (
              <div
                key={opt.tempId || `opt-${oIdx}`}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
              >
                {/* Linha 1: Título e Ações da Opção */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      {isFlight ? "Nome do Voo / Cia Aérea *" : "Título do Item / Opção *"}
                    </label>
                    <input
                      type="text"
                      value={opt.title}
                      onChange={(e) =>
                        handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "title", e.target.value)
                      }
                      placeholder={isFlight ? "Ex: Voo LATAM Direto (GRU -> MCO)" : "Ex: Carro SUV Automático..."}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "selected", !opt.selected)
                      }
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        opt.selected
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {opt.selected ? (
                        <>
                          <Check className="h-3 w-3" />
                          ✓ Selecionado na Proposta
                        </>
                      ) : (
                        <>
                          <Star className="h-3 w-3 text-slate-400" />
                          Marcar Escolha
                        </>
                      )}
                    </button>

                    {section.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoverOpcaoSecaoInline(sIdx, oIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir esta opção"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Linha 2: Campos Especializados para AÉREO */}
                {isFlight ? (
                  <div className="space-y-3 pt-1">
                    {/* Classe, Bagagens e Valores Customizados */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Classe da Passagem
                        </label>
                        <select
                          value={meta.flight_class || "Econômica"}
                          onChange={(e) =>
                            handleAtualizarMetadataOpcao(sIdx, oIdx, "flight_class", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold focus:border-brand-900 focus:outline-none"
                        >
                          <option value="Econômica">Classe Econômica</option>
                          <option value="Premium Economy">Premium Economy</option>
                          <option value="Executiva (Business)">Executiva (Business)</option>
                          <option value="Primeira Classe (First)">Primeira Classe (First)</option>
                        </select>
                      </div>

                      {/* Sem Bagagem */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                          <Luggage className="h-3 w-3 text-slate-400" />
                          Opção 1 (Sem Bagagem)
                        </label>
                        <input
                          type="text"
                          value={meta.label_without_baggage ?? "Apenas Mão (10kg)"}
                          onChange={(e) =>
                            handleAtualizarMetadataOpcao(sIdx, oIdx, "label_without_baggage", e.target.value)
                          }
                          placeholder="Etiqueta: Apenas Mão (10kg)"
                          className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-800 focus:border-brand-900 focus:outline-none"
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={meta.without_baggage_price ?? opt.price ?? ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? "" : Number(e.target.value);
                              handleAtualizarMetadataOpcao(sIdx, oIdx, "without_baggage_price", val);
                              handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "price", val);
                            }}
                            placeholder="0,00"
                            className="w-full rounded border border-slate-300 pl-8 pr-2 py-1 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Com Bagagem */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                          <Luggage className="h-3 w-3 text-emerald-600" />
                          Opção 2 (Com Bagagem)
                        </label>
                        <input
                          type="text"
                          value={meta.label_with_baggage ?? "1 Mala 23kg Inclusa"}
                          onChange={(e) =>
                            handleAtualizarMetadataOpcao(sIdx, oIdx, "label_with_baggage", e.target.value)
                          }
                          placeholder="Etiqueta: 1 Mala 23kg Inclusa"
                          className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-800 focus:border-brand-900 focus:outline-none"
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={meta.with_baggage_price ?? ""}
                            onChange={(e) =>
                              handleAtualizarMetadataOpcao(
                                sIdx,
                                oIdx,
                                "with_baggage_price",
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                            placeholder="0,00"
                            className="w-full rounded border border-slate-300 pl-8 pr-2 py-1 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Descrição Ampla / Trechos */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Descrição Ampla do Voo (Horários, Conexões, Regras)
                      </label>
                      <textarea
                        rows={3}
                        value={opt.description || ""}
                        onChange={(e) =>
                          handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "description", e.target.value)
                        }
                        placeholder="Ex: Voo de Ida: GRU 09:30 -> MCO 17:45 (Direto)..."
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-brand-900 focus:outline-none"
                      />
                    </div>

                    {/* Upload de Fotos do Voo / Trechos */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Fotos dos Trechos e Horários do Voo (Aparecerão no PDF)
                      </label>
                      <ImageUploadDropzone
                        label="Adicionar Print / Foto do Trecho"
                        helperText="Arraste prints dos voos ou clique para upload (PNG, JPG)"
                        compact
                        value={optPhotos[0] || ""}
                        onChange={(url: string) => {
                          const updated = [...optPhotos, url];
                          handleAtualizarMetadataOpcao(sIdx, oIdx, "flight_photos", updated);
                          handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "photo_url", updated[0]);
                        }}
                      />
                      {optPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {optPhotos.map((pUrl, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative group rounded-lg overflow-hidden border border-slate-300 w-24 h-16 bg-slate-100"
                            >
                              <img
                                src={pUrl}
                                alt={`Trecho ${pIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = optPhotos.filter((_, idx) => idx !== pIdx);
                                  handleAtualizarMetadataOpcao(sIdx, oIdx, "flight_photos", updated);
                                  handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "photo_url", updated[0] || "");
                                }}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                                title="Remover imagem"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Demais Produtos (Carro, Parques, Ingressos, Transfers, Seguro, Tours) */
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Valor Final na Proposta (R$) *
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={opt.price}
                            onChange={(e) =>
                              handleAtualizarOpcaoSecaoInline(
                                sIdx,
                                oIdx,
                                "price",
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                            placeholder="0,00"
                            className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Link Oficial / Voucher (Opcional)
                        </label>
                        <input
                          type="url"
                          value={opt.external_link || ""}
                          onChange={(e) =>
                            handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "external_link", e.target.value)
                          }
                          placeholder="https://..."
                          className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs focus:border-brand-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Descrição / O que está incluso
                      </label>
                      <textarea
                        rows={2}
                        value={opt.description || ""}
                        onChange={(e) =>
                          handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "description", e.target.value)
                        }
                        placeholder="Ex: Categoria Sedan Intermediário, km livre, proteção total contra terceiros..."
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-brand-900 focus:outline-none"
                      />
                    </div>

                    {/* Upload de Fotos do Produto */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Fotos do Produto / Veículo / Voucher (Aparecerão no topo do card e no PDF)
                      </label>
                      <ImageUploadDropzone
                        label="Adicionar Foto / Imagem"
                        helperText="Arraste foto do veículo, atração ou voucher (PNG, JPG)"
                        compact
                        value={optPhotos[0] || ""}
                        onChange={(url: string) => {
                          const updated = [...optPhotos, url];
                          handleAtualizarMetadataOpcao(sIdx, oIdx, "photos", updated);
                          handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "photo_url", updated[0]);
                        }}
                      />
                      {optPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {optPhotos.map((pUrl, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative group rounded-lg overflow-hidden border border-slate-300 w-24 h-16 bg-slate-100"
                            >
                              <img
                                src={pUrl}
                                alt={`Foto ${pIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = optPhotos.filter((_, idx) => idx !== pIdx);
                                  handleAtualizarMetadataOpcao(sIdx, oIdx, "photos", updated);
                                  handleAtualizarOpcaoSecaoInline(sIdx, oIdx, "photo_url", updated[0] || "");
                                }}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                                title="Remover imagem"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const secoesAereo = sections
    .map((section, originalIdx) => ({ section, originalIdx }))
    .filter((item) => item.section.product_type === "FLIGHT");

  const secoesOutrosProdutos = sections
    .map((section, originalIdx) => ({ section, originalIdx }))
    .filter((item) => item.section.product_type !== "FLIGHT");

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Nova Cotação Completa de Viagem
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Preencha os dados da viagem, passagens aéreas, hospedagem e todos os produtos turísticos adicionais.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-gold-300 border border-gold-400/40 shadow-lg shadow-brand-950/20 hover:bg-brand-800 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Save className="h-4 w-4 text-gold-400" />
                {salvando ? "Calculando e Salvando..." : "Salvar Cotação"}
              </button>
            </div>
          </div>

          {/* Alerta de Erro de Validação */}
          {erroForm && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 border border-red-200 shadow-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="font-medium">{erroForm}</div>
            </div>
          )}

          {/* Bloco: Dados do Cliente e Viagem */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-brand-600" />
              1. Dados do Cliente e Viagem
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Família Souza"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Destino */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destino *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paris, França"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Data Ida */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Check-in (Ida) *
                </label>
                <input
                  type="date"
                  required
                  value={dataIda}
                  onChange={(e) => setDataIda(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Data Volta */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Check-out (Volta) *
                </label>
                <input
                  type="date"
                  required
                  value={dataVolta}
                  onChange={(e) => setDataVolta(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Ocupantes e Quartos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adultos (≥ 1) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adultos}
                  onChange={(e) => setAdultos(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Crianças (0 a 17 anos)
                </label>
                <input
                  type="number"
                  min="0"
                  value={criancas}
                  onChange={(e) => handleCriancasChange(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quartos (≥ 1) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quartos}
                  onChange={(e) => setQuartos(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Idades das crianças dinâmicas */}
            {criancas > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Idades das Crianças (Obrigatório informar para cada uma)
                </label>
                <div className="flex flex-wrap gap-3">
                  {idadesCriancas.map((idade, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      <span className="text-xs text-slate-500 font-medium">
                        Criança {idx + 1}:
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="17"
                        required
                        value={idade}
                        onChange={(e) => handleIdadeChange(idx, parseInt(e.target.value) || 0)}
                        className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 font-bold focus:border-brand-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">anos</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bloco: Câmbio de Moedas & Comissão Padrão */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-600" />
                2. Câmbio e Comissão Padrão da Agência
              </h2>

              <div className="flex items-center gap-2">
                {cambioStatus === "auto" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Câmbio Automático (AwesomeAPI)
                  </span>
                ) : cambioStatus === "manual" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 border border-amber-200">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Entrada Manual Ativa
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 animate-pulse">
                    Consultando cotações de mercado...
                  </span>
                )}

                <button
                  type="button"
                  onClick={carregarCambioOnline}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Atualizar Câmbio Online"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {cambioErro && (
              <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <span>{cambioErro}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* USD */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Cotação USD (Dólar) *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Editável</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={cotacaoUsd}
                    onChange={(e) => setCotacaoUsd(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* EUR */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Cotação EUR (Euro) *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Editável</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={cotacaoEur}
                    onChange={(e) => setCotacaoEur(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Margem Padrão */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Comissão Padrão da Agência (%)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Sugestão</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="99.99"
                    required
                    value={comissaoPadraoAgencia}
                    onChange={(e) =>
                      setComissaoPadraoAgencia(parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-bold text-slate-500">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* 1. MÓDULO DE PASSAGENS AÉREAS (EM PRIMEIRO LUGAR) */}
          {/* ============================================================= */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Plane className="h-6 w-6 text-sky-600" />
                  1. Passagens Aéreas & Voos Cotados ({secoesAereo.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione opções de voos, fotos dos trechos, classes e valores com/sem bagagem.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNovoTipoProduto("FLIGHT");
                  setNovoTituloSecao("Passagens Aéreas");
                  setModalNovaSecaoAberto(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
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
                <Plane className="h-8 w-8 text-sky-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-xs font-bold text-slate-800">
                  Nenhuma opção de voo cotada ainda
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 mb-3">
                  Inclua passagens aéreas com classes, fotos dos trechos e valores com e sem bagagem.
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

          {/* ============================================================= */}
          {/* 2. MÓDULO DE HOSPEDAGEM (HOTÉIS & CANAIS DE VENDA) */}
          {/* ============================================================= */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-brand-600" />
                  2. Hospedagem & Hotéis Cotados ({hoteis.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione quantos hotéis e canais forem necessários. Os cálculos e destaques são atualizados em tempo real.
                </p>
              </div>

              <button
                type="button"
                onClick={adicionarHotel}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                + Adicionar Outro Hotel
              </button>
            </div>

            {hoteis.map((hotel, hotelIndex) => {
              const canaisCalculados = aplicarDestaquesNoGrupo(
                hotel.canais,
                cambioRef
              );

              return (
                <div
                  key={hotel.tempId}
                  className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/90 space-y-6"
                >
                  {/* Cabeçalho do Hotel */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Nome do Hotel #{hotelIndex + 1} *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Hôtel Plaza Athénée Paris"
                          value={hotel.hotel_nome}
                          onChange={(e) =>
                            atualizarNomeHotel(hotelIndex, e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Link Oficial / Booking (Opcional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={hotel.link_hotel || ""}
                          onChange={(e) =>
                            atualizarHotelCampo(hotelIndex, "link_hotel", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Descrição / Localização
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Próximo à Champs-Élysées"
                          value={hotel.descricao || ""}
                          onChange={(e) =>
                            atualizarHotelCampo(hotelIndex, "descricao", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => adicionarCanal(hotelIndex)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar Canal
                      </button>

                      {hoteis.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerHotel(hotelIndex)}
                          className="rounded-xl p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remover Hotel"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de Canais do Hotel */}
                  <div className="space-y-4">
                    {hotel.canais.map((canal, canalIndex) => {
                      const calc = canaisCalculados[canalIndex];

                      return (
                        <div
                          key={canal.tempId}
                          className={`rounded-xl p-4 transition-all border ${
                            canal.escolhido_manual
                              ? "bg-amber-50/40 border-amber-300 shadow-sm ring-1 ring-amber-300"
                              : "bg-slate-50/70 border-slate-200"
                          }`}
                        >
                          {/* Linha 1: Identificação do Canal, Moeda e Valores */}
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
                                  atualizarCanal(hotelIndex, canalIndex, {
                                    canal_nome: e.target.value,
                                  })
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
                                  atualizarCanal(hotelIndex, canalIndex, {
                                    moeda: e.target.value as Moeda,
                                  })
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
                                  atualizarCanal(hotelIndex, canalIndex, {
                                    valor_mostrado: e.target.value,
                                  })
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
                                  atualizarCanal(hotelIndex, canalIndex, {
                                    taxas: e.target.value,
                                  })
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
                                  atualizarCanal(hotelIndex, canalIndex, {
                                    comissao_fornecedor_pct: e.target.value,
                                  })
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
                                  atualizarCanal(hotelIndex, canalIndex, {
                                    comissao_venda_pct: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Linha 2: Detalhes do Quarto e Condições */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 items-center">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Categoria do Quarto *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Standard, Deluxe, Suíte..."
                                value={canal.categoria_quarto}
                                onChange={(e) =>
                                  atualizarCanal(hotelIndex, canalIndex, {
                                    categoria_quarto: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={canal.cafe_da_manha}
                                  onChange={(e) =>
                                    atualizarCanal(hotelIndex, canalIndex, {
                                      cafe_da_manha: e.target.checked,
                                    })
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
                                      : new Date(canal.reembolsavel_ate)
                                          .toISOString()
                                          .split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  atualizarCanal(hotelIndex, canalIndex, {
                                    reembolsavel_ate: e.target.value || null,
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 sm:pt-0">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleEscolhaManual(hotelIndex, canalIndex)
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  canal.escolhido_manual
                                    ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600 ring-2 ring-amber-300"
                                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                                }`}
                                title="Marcar como opção escolhida para a proposta do cliente"
                              >
                                {canal.escolhido_manual ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-white" />
                                    ✓ Opção Selecionada
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
                                    removerCanal(hotelIndex, canalIndex)
                                  }
                                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Remover Canal"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Linha 3: Card de Resultados Calculados em Tempo Real */}
                          {calc && (
                            <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                              <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">
                                  Comissão Fornec. (RN-01)
                                </span>
                                <strong className="text-slate-800">
                                  {canal.moeda} {calc.valor_comissao.toFixed(2)}
                                </strong>
                              </div>

                              <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">
                                  Custo Líquido (RN-02)
                                </span>
                                <strong className="text-slate-800">
                                  {canal.moeda} {calc.custo_liquido.toFixed(2)}
                                </strong>
                              </div>

                              <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">
                                  Cotação Usada (RN-03)
                                </span>
                                <strong className="text-slate-800">
                                  {calc.cotacao_utilizada.toFixed(2)}
                                </strong>
                              </div>

                              <div
                                className={`p-2 rounded-lg border ${
                                  calc.menor_custo_do_grupo
                                    ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300"
                                    : "bg-white/80 border-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-500 block">
                                    Custo em BRL (RN-04)
                                  </span>
                                  {calc.menor_custo_do_grupo && (
                                    <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded uppercase">
                                      Menor Custo
                                    </span>
                                  )}
                                </div>
                                <strong
                                  className={`${
                                    calc.menor_custo_do_grupo
                                      ? "text-emerald-800 text-sm"
                                      : "text-slate-800"
                                  }`}
                                >
                                  R$ {calc.custo_em_brl.toFixed(2)}
                                </strong>
                              </div>

                              <div
                                className={`p-2 rounded-lg border ${
                                  calc.maior_lucro_do_grupo
                                    ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300"
                                    : "bg-white/80 border-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-500 block">
                                    Venda Final (RN-05)
                                  </span>
                                  {calc.maior_lucro_do_grupo && (
                                    <span className="text-[9px] font-extrabold bg-amber-600 text-white px-1.5 py-0.2 rounded uppercase">
                                      Maior Lucro
                                    </span>
                                  )}
                                </div>
                                <strong
                                  className={`${
                                    calc.maior_lucro_do_grupo
                                      ? "text-amber-900 text-sm"
                                      : "text-slate-900"
                                  }`}
                                >
                                  R$ {calc.valor_final_venda.toFixed(2)}
                                </strong>
                              </div>

                              <div className="bg-gradient-to-br from-brand-50 to-emerald-50 p-2 rounded-lg border border-brand-200">
                                <span className="text-[10px] text-brand-800 block font-medium">
                                  Lucro Bruto Agência
                                </span>
                                <strong className="text-brand-900 font-bold">
                                  R${" "}
                                  {(
                                    calc.valor_final_venda - calc.custo_em_brl
                                  ).toFixed(2)}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ============================================================= */}
          {/* 3. MÓDULO DE PRODUTOS TURÍSTICOS & DEMAIS SERVIÇOS */}
          {/* ============================================================= */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="h-6 w-6 text-brand-900" />
                  3. Produtos Turísticos & Demais Serviços ({secoesOutrosProdutos.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione locação de carros, ingressos, parques temáticos, seguro viagem, transfers e passeios.
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

          {/* Botão de Salvar Inferior */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-500/25 hover:from-brand-700 hover:to-brand-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Save className="h-5 w-5" />
              {salvando ? "Calculando e Salvando..." : "Salvar Cotação Completa"}
            </button>
          </div>
        </form>
      </main>

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
                type="button"
                onClick={() => setModalNovaSecaoAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCriarSecaoModal} className="space-y-3">
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
                <span className="text-[11px] font-bold text-slate-800 border-b pb-1 border-slate-200 flex items-center gap-1.5">
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
                        </select>
                      </div>
                    </div>

                    {/* VALORES E ETIQUETAS DE BAGAGEM EDITÁVEIS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                        <label className="block text-[9px] font-bold text-slate-700 uppercase flex items-center gap-1">
                          <Luggage className="h-3 w-3 text-slate-400" />
                          Opção 1 (Sem Bagagem)
                        </label>
                        <input
                          type="text"
                          value={labelSemBagagemInicial}
                          onChange={(e) => setLabelSemBagagemInicial(e.target.value)}
                          placeholder="Etiqueta (ex: Apenas Mão 10kg)"
                          className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 focus:border-brand-900 focus:outline-none"
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-[11px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={precoSemBagagemInicial}
                            onChange={(e) =>
                              setPrecoSemBagagemInicial(
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                            placeholder="0,00"
                            className="w-full rounded border border-slate-300 pl-7 pr-2 py-1 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                        <label className="block text-[9px] font-bold text-slate-700 uppercase flex items-center gap-1">
                          <Luggage className="h-3 w-3 text-emerald-600" />
                          Opção 2 (Com Bagagem)
                        </label>
                        <input
                          type="text"
                          value={labelComBagagemInicial}
                          onChange={(e) => setLabelComBagagemInicial(e.target.value)}
                          placeholder="Etiqueta (ex: 1 Mala 23kg Inclusa)"
                          className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 focus:border-brand-900 focus:outline-none"
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-[11px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={precoComBagagemInicial}
                            onChange={(e) =>
                              setPrecoComBagagemInicial(
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                            placeholder="0,00"
                            className="w-full rounded border border-slate-300 pl-7 pr-2 py-1 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Descrição Ampla / Trechos */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Descrição Ampla do Voo (Horários, Conexões, Regras)
                      </label>
                      <textarea
                        rows={2}
                        value={descricaoLongaInicial}
                        onChange={(e) => setDescricaoLongaInicial(e.target.value)}
                        placeholder="Ex: Voo de Ida: GRU 09:30 -> MCO 17:45 (Direto)..."
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-brand-900 focus:outline-none"
                      />
                    </div>

                    {/* Foto / Print do Trecho */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Foto / Print do Trecho (Horários e Escalas)
                      </label>
                      <ImageUploadDropzone
                        label="Adicionar Print / Foto do Trecho"
                        helperText="Prints do voo (PNG, JPG)"
                        compact
                        value={fotoUrlInicial}
                        onChange={(url: string) => setFotoUrlInicial(url)}
                      />
                    </div>
                  </div>
                ) : (
                  /* CAMPOS PARA DEMAIS PRODUTOS TURÍSTICOS */
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Título da Opção / Item *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={`Ex: ${novoTituloSecao} Categoria VIP...`}
                        value={tituloOpcaoInicial}
                        onChange={(e) => setTituloOpcaoInicial(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Valor Total na Proposta (R$) *
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs font-bold text-slate-400">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={precoOpcaoInicial}
                          onChange={(e) =>
                            setPrecoOpcaoInicial(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          placeholder="0,00"
                          className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-brand-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Descrição / Detalhes
                      </label>
                      <textarea
                        rows={2}
                        value={descricaoLongaInicial}
                        onChange={(e) => setDescricaoLongaInicial(e.target.value)}
                        placeholder="Ex: O que está incluso, regras, observações..."
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-brand-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Foto do Produto / Imagem Ilustrativa
                      </label>
                      <ImageUploadDropzone
                        label="Adicionar Foto / Imagem"
                        helperText="Foto do veículo, atração ou voucher (PNG, JPG)"
                        compact
                        value={fotoUrlInicial}
                        onChange={(url: string) => setFotoUrlInicial(url)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNovaSecaoAberto(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Seção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
