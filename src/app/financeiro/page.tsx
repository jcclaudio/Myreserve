"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  AlertCircle,
  Check,
  X,
  Edit2,
  Trash2,
  RefreshCw,
  Percent,
  Wallet,
  Download,
  PieChart,
  Layers,
  Sparkles,
  Users,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  UploadCloud,
  FileCode,
  QrCode,
  Copy,
  MessageCircle,
} from "lucide-react";

interface Transacao {
  id: string;
  descricao: string;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  valor_brl: number;
  moeda_original: "BRL" | "USD" | "EUR";
  valor_original: number;
  cotacao_cambio: number;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  data_vencimento: string;
  data_pagamento: string | null;
  metodo_pagamento: string;
  comprovante_ref?: string;
  observacoes?: string;
  cotacao?: {
    id: string;
    cliente_nome: string;
    destino: string;
  } | null;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
  criado_em: string;
}

interface MetricasFinanceiras {
  totalReceitasPagas: number;
  totalDespesasPagas: number;
  lucroLiquidoRealizado: number;
  margemLucroPct: number;
  totalReceitasPendentes: number;
  totalDespesasPendentes: number;
  totalTransacoes: number;
  totalCanceladas: number;
}

interface RecebivelItem {
  id: string;
  numero_parcela: number;
  total_parcelas: number;
  valor_parcela: number;
  valor_pago: number;
  saldo: number;
  data_vencimento: string;
  status: string;
  metodo_pagamento: string;
  documento_ref?: string;
  sale: {
    sale_number: string;
    cliente_nome: string;
    destino: string;
    consultor: { nome: string };
  };
}

interface PagavelItem {
  id: string;
  fornecedor_nome: string;
  descricao: string;
  valor_brl: number;
  valor_pago: number;
  saldo: number;
  data_vencimento: string;
  status: string;
  metodo_pagamento: string;
  comprovante_ref?: string;
  sale?: {
    sale_number: string;
    cliente_nome: string;
  } | null;
}

interface ConsultorPerformance {
  consultorId: string;
  nome: string;
  email: string;
  totalVendasCount: number;
  gmvTotal: number;
  agencyRevenueTotal: number;
  contributionMarginTotal: number;
  margemMediaPct: number;
  ticketMedio: number;
  comissaoTotal: number;
  comissaoPaga: number;
  comissaoPendente: number;
}

export default function FinanceiroPage() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<
    "FLUXO" | "RECEBIVEIS" | "PAGAVEIS" | "DRE" | "CONSULTORES" | "OFX" | "INTEGRIDADE"
  >("FLUXO");

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [metricas, setMetricas] = useState<MetricasFinanceiras | null>(null);
  const [recebiveis, setRecebiveis] = useState<RecebivelItem[]>([]);
  const [metricasRecebiveis, setMetricasRecebiveis] = useState<any>(null);
  const [pagaveis, setPagaveis] = useState<PagavelItem[]>([]);
  const [metricasPagaveis, setMetricasPagaveis] = useState<any>(null);
  const [performanceConsultores, setPerformanceConsultores] = useState<
    ConsultorPerformance[]
  >([]);
  const [dreData, setDreData] = useState<any>(null);
  const [integridade, setIntegridade] = useState<any>(null);

  // Estado da Conciliação OFX
  const [ofxInputText, setOfxInputText] = useState("");
  const [ofxResultado, setOfxResultado] = useState<any>(null);
  const [ofxCarregando, setOfxCarregando] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Filtros Transações
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState("TODOS");
  const [periodoAtivo, setPeriodoAtivo] = useState<string>("TODOS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Modal Nova Transação
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoTipo, setNovoTipo] = useState<"RECEITA" | "DESPESA">("RECEITA");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("VENDA_CLIENTE");
  const [novoValor, setNovoValor] = useState<number | "">("");
  const [novaMoeda, setNovaMoeda] = useState<"BRL" | "USD" | "EUR">("BRL");
  const [novoCambio, setNovoCambio] = useState<number>(1.0);
  const [novoStatus, setNovoStatus] = useState<"PENDENTE" | "PAGO">("PAGO");
  const [novoVencimento, setNovoVencimento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [novoMetodo, setNovoMetodo] = useState("PIX");
  const [novoComprovante, setNovoComprovante] = useState("");
  const [novaCotacaoId, setNovaCotacaoId] = useState("");
  const [novasObs, setNovasObs] = useState("");
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [formErrorNovo, setFormErrorNovo] = useState("");
  const [forecastData, setForecastData] = useState<any>(null);
  const [selectedPayableIds, setSelectedPayableIds] = useState<string[]>([]);
  const [liquidandoLote, setLiquidandoLote] = useState(false);

  // Estado da Cobrança PIX
  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [dadosPix, setDadosPix] = useState<any>(null);
  const [carregandoPix, setCarregandoPix] = useState(false);

  // Estado da Conciliação de Faturas de Fornecedores
  const [modoConciliacao, setModoConciliacao] = useState<"OFX" | "FATURA">("OFX");
  const [faturaInputText, setFaturaInputText] = useState("");
  const [faturaResultado, setFaturaResultado] = useState<any>(null);
  const [faturaCarregando, setFaturaCarregando] = useState(false);

  // Carregamento de dados de acordo com a aba ativa
  useEffect(() => {
    carregarAba(abaAtiva);
  }, [abaAtiva, filtroTipo, filtroStatus, filtroCategoria, periodoAtivo]);

  async function carregarAba(aba: string) {
    setLoading(true);
    setErrorMsg("");
    setSelectedPayableIds([]);
    try {
      if (aba === "FLUXO") {
        const params = new URLSearchParams();
        if (filtroTipo !== "TODOS") params.append("tipo", filtroTipo);
        if (filtroStatus !== "TODOS") params.append("status", filtroStatus);
        if (filtroCategoria !== "TODOS") params.append("categoria", filtroCategoria);
        if (periodoAtivo !== "TODOS") params.append("periodo", periodoAtivo);
        if (busca) params.append("busca", busca);
        if (dataInicio) params.append("data_inicio", dataInicio);
        if (dataFim) params.append("data_fim", dataFim);

        const [resTrans, resMetricas, resForecast] = await Promise.all([
          fetch(`/api/financeiro/transacoes?${params.toString()}`),
          fetch(`/api/financeiro/metricas?${params.toString()}`),
          fetch(`/api/financeiro/fluxo-caixa`),
        ]);

        if (resTrans.status === 401 || resTrans.status === 403) {
          router.push("/login");
          return;
        }

        const dataTrans = await resTrans.json();
        const dataMetricas = await resMetricas.json();
        const dataForecast = await resForecast.json();

        if (dataTrans.success) setTransacoes(dataTrans.transacoes);
        if (dataMetricas.success) setMetricas(dataMetricas.metricas);
        if (dataForecast.success) setForecastData(dataForecast.forecast);
      } else if (aba === "RECEBIVEIS") {
        const res = await fetch("/api/financeiro/recebiveis");
        const data = await res.json();
        if (data.success) {
          setRecebiveis(data.recebiveis);
          setMetricasRecebiveis(data.metricas);
        }
      } else if (aba === "PAGAVEIS") {
        const res = await fetch("/api/financeiro/pagaveis");
        const data = await res.json();
        if (data.success) {
          setPagaveis(data.pagaveis);
          setMetricasPagaveis(data.metricas);
        }
      } else if (aba === "CONSULTORES") {
        const res = await fetch("/api/financeiro/performance-consultores");
        const data = await res.json();
        if (data.success) {
          setPerformanceConsultores(data.performance);
        }
      } else if (aba === "DRE") {
        const res = await fetch("/api/financeiro/dre");
        const data = await res.json();
        if (data.success) {
          setDreData(data.dre);
        }
      } else if (aba === "INTEGRIDADE") {
        const res = await fetch("/api/financeiro/integridade");
        const data = await res.json();
        if (data.success) {
          setIntegridade(data.integridade);
        }
      }
    } catch {
      setErrorMsg("Erro ao comunicar com o servidor financeiro.");
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  async function handleLiquidarLote() {
    if (selectedPayableIds.length === 0) {
      alert("Selecione pelo menos uma fatura para liquidar.");
      return;
    }

    if (!confirm(`Deseja liquidar ${selectedPayableIds.length} fatura(s) selecionada(s)?`)) {
      return;
    }

    setLiquidandoLote(true);
    try {
      const res = await fetch("/api/financeiro/pagaveis/lote-liquidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payable_ids: selectedPayableIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        mostrarToast(data.mensagem || "Faturas liquidadas com sucesso!");
        carregarAba("PAGAVEIS");
      } else {
        alert(data.error || "Erro ao liquidar faturas em lote.");
      }
    } catch {
      alert("Erro de conexão ao liquidar faturas.");
    } finally {
      setLiquidandoLote(false);
    }
  }

  function formatBRL(val?: number) {
    return (val ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function handleLiquidarRecebivel(id: string) {
    try {
      const res = await fetch(`/api/financeiro/recebiveis/${id}/liquidar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        mostrarToast("Recebimento registrado com sucesso!");
        carregarAba("RECEBIVEIS");
      }
    } catch {
      alert("Erro ao liquidar recebível.");
    }
  }

  async function handleLiquidarPagavel(id: string) {
    try {
      const res = await fetch(`/api/financeiro/pagaveis/${id}/liquidar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        mostrarToast("Pagamento de fornecedor registrado com sucesso!");
        carregarAba("PAGAVEIS");
      }
    } catch {
      alert("Erro ao liquidar conta a pagar.");
    }
  }

  async function handleAbrirPix(receivableId: string) {
    setCarregandoPix(true);
    setModalPixAberto(true);
    setDadosPix(null);
    try {
      const res = await fetch(`/api/financeiro/recebiveis/${receivableId}/pix`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDadosPix(data.pix);
      } else {
        alert(data.error || "Erro ao gerar cobrança PIX.");
        setModalPixAberto(false);
      }
    } catch {
      alert("Erro de conexão ao gerar cobrança PIX.");
      setModalPixAberto(false);
    } finally {
      setCarregandoPix(false);
    }
  }

  function handleCopiarPix() {
    if (dadosPix?.payload_copia_cola) {
      navigator.clipboard.writeText(dadosPix.payload_copia_cola);
      mostrarToast("Código PIX Copia-e-Cola copiado com sucesso!");
    }
  }

  function handleCopiarWhatsAppPix() {
    if (dadosPix?.mensagem_whatsapp) {
      navigator.clipboard.writeText(dadosPix.mensagem_whatsapp);
      mostrarToast("Mensagem formatada para WhatsApp copiada!");
    }
  }

  async function handleProcessarOfx(autoLiquidar: boolean) {
    if (!ofxInputText.trim()) {
      alert("Cole o conteúdo do arquivo OFX ou faça o upload.");
      return;
    }
    setOfxCarregando(true);
    try {
      const res = await fetch("/api/financeiro/conciliacao/ofx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ofxText: ofxInputText, autoLiquidar }),
      });
      const data = await res.json();
      if (data.success) {
        setOfxResultado(data);
        mostrarToast(
          autoLiquidar
            ? `${data.conciliadosCount} lançamentos conciliados com sucesso!`
            : `${data.matchesEncontrados} correspondências encontradas para conciliação.`
        );
      } else {
        alert(data.error || "Erro ao processar OFX.");
      }
    } catch {
      alert("Erro de comunicação ao conciliar OFX.");
    } finally {
      setOfxCarregando(false);
    }
  }

  async function handleProcessarFaturaFornecedor(autoLiquidarMatches: boolean) {
    if (!faturaInputText.trim()) {
      alert("Cole o conteúdo CSV da fatura do fornecedor.");
      return;
    }
    setFaturaCarregando(true);
    try {
      const res = await fetch("/api/financeiro/conciliacao/fatura-fornecedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: faturaInputText, autoLiquidarMatches }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFaturaResultado(data);
        if (data.liquidadosEmLote > 0) {
          mostrarToast(`${data.liquidadosEmLote} fatura(s) conciliada(s) e baixada(s) com sucesso!`);
          carregarAba("PAGAVEIS");
        } else {
          mostrarToast(`${data.matchesPerfeitos} conferência(s) exata(s) e ${data.divergenciasValor} divergência(s).`);
        }
      } else {
        alert(data.error || "Erro ao processar fatura de fornecedor.");
      }
    } catch {
      alert("Erro de comunicação ao processar fatura.");
    } finally {
      setFaturaCarregando(false);
    }
  }

  async function handleSalvarNovoLancamento(e: React.FormEvent) {
    e.preventDefault();
    setFormErrorNovo("");

    if (!novaDescricao.trim()) {
      setFormErrorNovo("A descrição do lançamento é obrigatória.");
      return;
    }
    if (typeof novoValor !== "number" || novoValor <= 0) {
      setFormErrorNovo("Informe um valor numérico válido maior que zero.");
      return;
    }
    if (novaMoeda !== "BRL" && (!novoCambio || novoCambio <= 0)) {
      setFormErrorNovo("Informe uma cotação de câmbio válida para a moeda estrangeira.");
      return;
    }
    if (!novoVencimento) {
      setFormErrorNovo("A data de vencimento é obrigatória.");
      return;
    }

    setSalvandoNovo(true);
    try {
      const payload = {
        descricao: novaDescricao.trim(),
        tipo: novoTipo,
        categoria: novaCategoria,
        valor_original: Number(novoValor),
        moeda_original: novaMoeda,
        cotacao_cambio: novaMoeda === "BRL" ? 1.0 : Number(novoCambio),
        status: novoStatus,
        data_vencimento: novoVencimento,
        data_pagamento: novoStatus === "PAGO" ? novoVencimento : null,
        metodo_pagamento: novoMetodo,
        comprovante_ref: novoComprovante.trim(),
        observacoes: novasObs.trim(),
        cotacao_id: novaCotacaoId ? novaCotacaoId : null,
      };

      const res = await fetch("/api/financeiro/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormErrorNovo(data.error || "Erro ao salvar transação financeira.");
        return;
      }

      mostrarToast("Lançamento financeiro registrado com sucesso!");
      setModalNovoAberto(false);
      setNovaDescricao("");
      setNovoValor("");
      setNovoComprovante("");
      setNovasObs("");
      setNovaCotacaoId("");
      setFormErrorNovo("");
      carregarAba(abaAtiva);
    } catch {
      setFormErrorNovo("Erro de comunicação ao salvar lançamento.");
    } finally {
      setSalvandoNovo(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl border border-gold-500/30 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Gestão Financeira & Controladoria
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight">
              Sistema Operacional Financeiro FixTur
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Controle unificado de receitas, despesas de fornecedores, contas a receber, contas a pagar e rentabilidade.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setModalNovoAberto(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-brand-800 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-gold-400" />
              Novo Lançamento
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ABAS DO MÓDULO FINANCEIRO                                                 */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 mb-6">
          {[
            { id: "FLUXO", label: "Fluxo de Caixa", icon: DollarSign },
            { id: "RECEBIVEIS", label: "Contas a Receber", icon: Wallet },
            { id: "PAGAVEIS", label: "Contas a Pagar", icon: TrendingDown },
            { id: "DRE", label: "DRE Gerencial (P&L)", icon: BarChart3 },
            { id: "OFX", label: "Conciliação OFX", icon: UploadCloud },
            { id: "CONSULTORES", label: "Performance Consultores", icon: Users },
            { id: "INTEGRIDADE", label: "Auditoria & Integridade", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const ativo = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  ativo
                    ? "bg-brand-900 text-gold-300 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${ativo ? "text-gold-400" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* CONTEÚDO DA ABA SELECIONADA                                               */}
        {/* ========================================================================= */}

        {/* 1. ABA: FLUXO DE CAIXA */}
        {abaAtiva === "FLUXO" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Receitas Pagas</span>
                <div className="mt-2 text-2xl font-black text-emerald-700">
                  {formatBRL(metricas?.totalReceitasPagas)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Despesas Pagas</span>
                <div className="mt-2 text-2xl font-black text-rose-600">
                  {formatBRL(metricas?.totalDespesasPagas)}
                </div>
              </div>
              <div className="rounded-2xl bg-brand-900 p-5 text-white shadow-sm border border-gold-500/30">
                <span className="text-xs font-bold text-gold-300 uppercase">Lucro Líquido</span>
                <div className="mt-2 text-2xl font-black text-white">
                  {formatBRL(metricas?.lucroLiquidoRealizado)}
                </div>
                <div className="text-[11px] text-gold-300 mt-0.5">Margem: {metricas?.margemLucroPct ?? 0}%</div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">A Receber</span>
                <div className="mt-2 text-2xl font-black text-amber-600">
                  {formatBRL(metricas?.totalReceitasPendentes)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">A Pagar</span>
                <div className="mt-2 text-2xl font-black text-orange-600">
                  {formatBRL(metricas?.totalDespesasPendentes)}
                </div>
              </div>
            </div>

            {/* MATRIZ DE PREVISÃO DE FLUXO DE CAIXA E LIQUIDEZ */}
            {forecastData && (
              <div className="rounded-2xl bg-slate-900 p-6 text-white border border-slate-800 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-400/20 text-gold-300 border border-gold-400/30">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        Previsão de Fluxo de Caixa & Matriz de Liquidez
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Projeções automáticas baseadas nos vencimentos de recebíveis e pagamentos de fornecedores.
                      </p>
                    </div>
                  </div>

                  {forecastData.exchangeFluctuation && (
                    <div className="flex items-center gap-3 text-xs bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-300">
                      <span className="font-semibold text-gold-300">Exposição em Aberto:</span>
                      <span>USD: <strong className="text-emerald-400">${forecastData.exchangeFluctuation.totalExposureUsd}</strong></span>
                      <span className="text-slate-600">|</span>
                      <span>EUR: <strong className="text-brand-300">€{forecastData.exchangeFluctuation.totalExposureEur}</strong></span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[
                    { key: "d7", label: "Próximos 7 Dias", data: forecastData.windows?.d7 },
                    { key: "d15", label: "Próximos 15 Dias", data: forecastData.windows?.d15 },
                    { key: "d30", label: "Próximos 30 Dias", data: forecastData.windows?.d30 },
                    { key: "d60", label: "Próximos 60 Dias", data: forecastData.windows?.d60 },
                  ].map((win) => {
                    const item = win.data;
                    if (!item) return null;
                    const isDeficit = item.netProjected < 0;
                    return (
                      <div
                        key={win.key}
                        className={`rounded-xl p-4 border transition-all ${
                          isDeficit
                            ? "bg-rose-950/30 border-rose-800/60"
                            : "bg-slate-800/70 border-slate-700/80"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-2">
                          <span className="text-slate-300">{win.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isDeficit ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {isDeficit ? "Risco Déficit" : "Equilibrado"}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>(+) Entradas:</span>
                            <span className="font-semibold text-emerald-400">{formatBRL(item.totalReceivables)}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>(-) Saídas:</span>
                            <span className="font-semibold text-rose-400">{formatBRL(item.totalPayables)}</span>
                          </div>
                          <div className="border-t border-slate-700/80 pt-1.5 flex justify-between font-bold text-sm">
                            <span className="text-slate-300">Saldo:</span>
                            <span className={item.netProjected >= 0 ? "text-emerald-300" : "text-rose-400"}>
                              {formatBRL(item.netProjected)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-sm text-brand-900">
                Extrato Consolidado de Transações
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3.5 pl-6 pr-3">Tipo</th>
                      <th className="py-3.5 px-3">Descrição</th>
                      <th className="py-3.5 px-3">Valor (BRL)</th>
                      <th className="py-3.5 px-3">Vencimento</th>
                      <th className="py-3.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {transacoes.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-4 pl-6 pr-3 font-bold">
                          {t.tipo === "RECEITA" ? (
                            <span className="text-emerald-700">Entrada</span>
                          ) : (
                            <span className="text-rose-600">Saída</span>
                          )}
                        </td>
                        <td className="py-4 px-3 font-medium text-slate-900">{t.descricao}</td>
                        <td className="py-4 px-3 font-bold">{formatBRL(t.valor_brl)}</td>
                        <td className="py-4 px-3 text-slate-500">
                          {new Date(t.data_vencimento).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-4 px-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            t.status === "PAGO" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. ABA: CONTAS A RECEBER */}
        {abaAtiva === "RECEBIVEIS" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Total a Receber Aberto</span>
                <div className="mt-2 text-2xl font-black text-amber-600">
                  {formatBRL(metricasRecebiveis?.totalAberto)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Já Recebido</span>
                <div className="mt-2 text-2xl font-black text-emerald-700">
                  {formatBRL(metricasRecebiveis?.totalPago)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Parcelas Pendentes</span>
                <div className="mt-2 text-2xl font-black text-slate-800">
                  {metricasRecebiveis?.parcelasAbertasCount || 0}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-sm text-brand-900">
                Recebíveis de Clientes (Parcelas)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3.5 pl-6 pr-3">Venda / Cliente</th>
                      <th className="py-3.5 px-3">Parcela</th>
                      <th className="py-3.5 px-3">Valor (BRL)</th>
                      <th className="py-3.5 px-3">Vencimento</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {recebiveis.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-4 pl-6 pr-3 font-medium text-slate-900">
                          {r.sale?.cliente_nome || "Cliente"}
                          <span className="text-xs text-slate-400 block font-mono">
                            {r.sale?.sale_number}
                          </span>
                        </td>
                        <td className="py-4 px-3 font-semibold text-slate-700">
                          {r.numero_parcela} / {r.total_parcelas}
                        </td>
                        <td className="py-4 px-3 font-bold text-emerald-700">
                          {formatBRL(r.saldo || r.valor_parcela)}
                        </td>
                        <td className="py-4 px-3 text-slate-600">
                          {new Date(r.data_vencimento).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-4 px-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            r.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {r.status === "PAID" ? "Recebido" : "Em Aberto"}
                          </span>
                        </td>
                        <td className="py-4 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status !== "PAID" && (
                              <>
                                <button
                                  onClick={() => handleAbrirPix(r.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
                                  title="Gerar QR Code PIX e chave Copia-e-Cola"
                                >
                                  <QrCode className="h-3.5 w-3.5 text-teal-600" />
                                  PIX
                                </button>
                                <button
                                  onClick={() => handleLiquidarRecebivel(r.id)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                                >
                                  Dar Baixa
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. ABA: CONTAS A PAGAR (COM LIQUIDAÇÃO EM LOTE) */}
        {abaAtiva === "PAGAVEIS" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Total a Pagar Fornecedores</span>
                <div className="mt-2 text-2xl font-black text-rose-600">
                  {formatBRL(metricasPagaveis?.totalAberto)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Já Pago</span>
                <div className="mt-2 text-2xl font-black text-emerald-700">
                  {formatBRL(metricasPagaveis?.totalPago)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-brand-900">
                    Contas a Pagar a Operadores e Hotéis
                  </h4>
                  <p className="text-xs text-slate-500">
                    Selecione faturas de operadoras para realizar liquidação e conferência em lote.
                  </p>
                </div>

                {selectedPayableIds.length > 0 && (
                  <button
                    onClick={handleLiquidarLote}
                    disabled={liquidandoLote}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {liquidandoLote
                      ? "Processando..."
                      : `Liquidar ${selectedPayableIds.length} Selecionada(s)`}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3.5 pl-6 pr-2 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-brand-900 focus:ring-brand-900 cursor-pointer"
                          checked={
                            pagaveis.filter((p) => p.status !== "PAID").length > 0 &&
                            selectedPayableIds.length ===
                              pagaveis.filter((p) => p.status !== "PAID").length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              const openIds = pagaveis
                                .filter((p) => p.status !== "PAID")
                                .map((p) => p.id);
                              setSelectedPayableIds(openIds);
                            } else {
                              setSelectedPayableIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="py-3.5 px-3">Fornecedor</th>
                      <th className="py-3.5 px-3">Descrição / Venda</th>
                      <th className="py-3.5 px-3">Valor (BRL)</th>
                      <th className="py-3.5 px-3">Vencimento</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {pagaveis.map((p) => {
                      const isSelected = selectedPayableIds.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? "bg-emerald-50/40" : ""
                          }`}
                        >
                          <td className="py-4 pl-6 pr-2">
                            {p.status !== "PAID" && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPayableIds((prev) => [...prev, p.id]);
                                  } else {
                                    setSelectedPayableIds((prev) =>
                                      prev.filter((id) => id !== p.id)
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-brand-900 focus:ring-brand-900 cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="py-4 px-3 font-bold text-slate-900 font-mono">
                            {p.fornecedor_nome}
                          </td>
                          <td className="py-4 px-3 font-medium text-slate-900">
                            {p.descricao}
                            {p.sale && (
                              <span className="text-xs text-slate-400 block font-mono">
                                Venda: {p.sale.sale_number} ({p.sale.cliente_nome})
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 font-bold text-rose-600">
                            {formatBRL(p.valor_brl)}
                          </td>
                          <td className="py-4 px-3 text-slate-600">
                            {new Date(p.data_vencimento).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-4 px-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                p.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-orange-50 text-orange-700"
                              }`}
                            >
                              {p.status === "PAID" ? "Pago" : "A Pagar"}
                            </span>
                          </td>
                          <td className="py-4 pl-3 pr-6 text-right">
                            {p.status !== "PAID" && (
                              <button
                                onClick={() => handleLiquidarPagavel(p.id)}
                                className="rounded-lg bg-brand-900 px-3 py-1 text-xs font-bold text-white hover:bg-brand-800 transition-colors cursor-pointer"
                              >
                                Pagar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. ABA: DRE GERENCIAL (P&L COM RESULTADO CAMBIAL) */}
        {abaAtiva === "DRE" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                <div>
                  <h3 className="font-black text-brand-900 text-lg">DRE Gerencial — FixTur</h3>
                  <p className="text-xs text-slate-500">Demonstrativo de Resultado do Exercício consolidado com efeito cambial</p>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="/api/financeiro/dre/export"
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-brand-900 transition-colors"
                  >
                    <Download className="h-4 w-4 text-emerald-600" />
                    Exportar DRE (CSV)
                  </a>
                  <div className="text-right border-l pl-4 border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase block">Resultado Líquido Final</span>
                    <span className="text-2xl font-black text-emerald-700">
                      {formatBRL(dreData?.resultadoLiquidoFinal ?? dreData?.resultadoOperacional)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between py-3 font-semibold text-slate-800">
                  <span>(+) GMV / Venda Bruta</span>
                  <span className="font-mono">{formatBRL(dreData?.gmv)}</span>
                </div>

                <div className="flex items-center justify-between py-3 text-slate-600 pl-4">
                  <span>(-) Cancelamentos & Reembolsos</span>
                  <span className="font-mono text-rose-600">- {formatBRL(dreData?.reembolsos)}</span>
                </div>

                <div className="flex items-center justify-between py-3 font-bold text-slate-900 bg-slate-50/50 px-2 rounded-lg">
                  <span>(=) Venda Líquida</span>
                  <span className="font-mono">{formatBRL(dreData?.vendaLiquida)}</span>
                </div>

                <div className="flex items-center justify-between py-3 text-slate-600 pl-4">
                  <span>(-) Custos de Fornecedores Hoteleiros</span>
                  <span className="font-mono text-rose-600">- {formatBRL(dreData?.custosFornecedores)}</span>
                </div>

                <div className="flex items-center justify-between py-3 font-extrabold text-brand-900 bg-brand-50/60 px-2 rounded-lg">
                  <span>(=) Receita Bruta da Agência (Lucro Bruto)</span>
                  <span className="font-mono text-brand-900">
                    {formatBRL(dreData?.receitaAgencia)} ({dreData?.margemBrutaPct ?? 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 text-slate-600 pl-4">
                  <span>(-) Comissões dos Consultores</span>
                  <span className="font-mono text-rose-600">
                    - {formatBRL(dreData?.custosVariaveis?.comissoesConsultores)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 text-slate-600 pl-4">
                  <span>(-) Taxas de Meios de Pagamento</span>
                  <span className="font-mono text-rose-600">
                    - {formatBRL(dreData?.custosVariaveis?.taxasProcessamento)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 font-bold text-slate-900 bg-slate-50/50 px-2 rounded-lg">
                  <span>(=) Margem de Contribuição Líquida</span>
                  <span className="font-mono text-emerald-700">
                    {formatBRL(dreData?.margemContribuicao)} ({dreData?.margemContribuicaoPct ?? 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 text-slate-600 pl-4">
                  <span>(-) Despesas Operacionais Fixas / Administrativas</span>
                  <span className="font-mono text-rose-600">
                    - {formatBRL(dreData?.despesasOperacionais)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 font-bold text-brand-900 bg-slate-100/80 px-2 rounded-lg">
                  <span>(=) Resultado Operacional Gerencial</span>
                  <span className="font-mono text-brand-900">
                    {formatBRL(dreData?.resultadoOperacional)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 text-slate-700 pl-4">
                  <span>(+/-) Resultado Cambial Líquido (Hedge & Flutuações)</span>
                  <span className={`font-mono font-bold ${
                    (dreData?.resultadoCambial ?? 0) >= 0 ? "text-emerald-700" : "text-rose-600"
                  }`}>
                    {(dreData?.resultadoCambial ?? 0) >= 0 ? "+" : ""}{formatBRL(dreData?.resultadoCambial)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4 font-black text-base text-brand-900 bg-brand-900 text-white px-4 rounded-xl shadow-xs">
                  <span>(=) RESULTADO LÍQUIDO FINAL COM EFEITO CAMBIAL</span>
                  <span className="font-mono text-gold-300 text-lg">
                    {formatBRL(dreData?.resultadoLiquidoFinal ?? dreData?.resultadoOperacional)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ABA: CENTRAL DE CONCILIAÇÃO FINANCEIRA (OFX & FATURAS DE OPERADORAS) */}
        {abaAtiva === "OFX" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                <div>
                  <h3 className="font-black text-brand-900 text-lg">Central de Conciliação Financeira</h3>
                  <p className="text-xs text-slate-500">
                    Cruze extratos bancários ou faturas quinzenais de operadoras com o sistema MyReserve.
                  </p>
                </div>

                {/* Seletor de Modo de Conciliação */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setModoConciliacao("OFX")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      modoConciliacao === "OFX"
                        ? "bg-brand-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-brand-900"
                    }`}
                  >
                    Extrato Bancário (OFX)
                  </button>
                  <button
                    onClick={() => setModoConciliacao("FATURA")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      modoConciliacao === "FATURA"
                        ? "bg-brand-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-brand-900"
                    }`}
                  >
                    Faturas de Operadoras (CSV)
                  </button>
                </div>
              </div>

              {/* MODO 1: EXTRATO BANCÁRIO OFX */}
              {modoConciliacao === "OFX" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Conteúdo do Arquivo OFX</label>
                    <textarea
                      rows={6}
                      value={ofxInputText}
                      onChange={(e) => setOfxInputText(e.target.value)}
                      placeholder="Cole aqui o conteúdo do arquivo .ofx ou abra o arquivo no bloco de notas e copie o texto..."
                      className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:border-brand-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleProcessarOfx(false)}
                      disabled={ofxCarregando}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {ofxCarregando ? "Analisando..." : "1. Simular / Buscar Correspondências"}
                    </button>
                    <button
                      onClick={() => handleProcessarOfx(true)}
                      disabled={ofxCarregando}
                      className="rounded-xl bg-brand-900 px-4 py-2 text-xs font-bold text-white hover:bg-brand-800 transition-colors cursor-pointer shadow-sm"
                    >
                      {ofxCarregando ? "Conciliando..." : "2. Executar Baixa Automática"}
                    </button>
                  </div>

                  {ofxResultado && (
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <div className="text-xl font-bold text-slate-900">{ofxResultado.totalTransacoesExtrato}</div>
                          <div className="text-[11px] text-slate-500">Transações no OFX</div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl">
                          <div className="text-xl font-bold text-emerald-700">{formatBRL(ofxResultado.totalCreditos)}</div>
                          <div className="text-[11px] text-emerald-600">Total Créditos</div>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl">
                          <div className="text-xl font-bold text-rose-600">{formatBRL(ofxResultado.totalDebitos)}</div>
                          <div className="text-[11px] text-rose-500">Total Débitos</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <div className="text-xl font-bold text-blue-700">{ofxResultado.matchesEncontrados}</div>
                          <div className="text-[11px] text-blue-600">Correspondências</div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                            <tr>
                              <th className="p-3">Data</th>
                              <th className="p-3">Tipo</th>
                              <th className="p-3">Memo / Descrição</th>
                              <th className="p-3">Valor</th>
                              <th className="p-3">Vínculo MyReserve</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ofxResultado.sugestoes.map((s: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3">{new Date(s.transacaoExtrato.data).toLocaleDateString("pt-BR")}</td>
                                <td className="p-3 font-bold">
                                  {s.transacaoExtrato.tipo === "CREDITO" ? (
                                    <span className="text-emerald-700">Crédito</span>
                                  ) : (
                                    <span className="text-rose-600">Débito</span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-700">{s.transacaoExtrato.memo}</td>
                                <td className="p-3 font-bold">{formatBRL(s.transacaoExtrato.valor)}</td>
                                <td className="p-3 font-medium text-brand-900">{s.matchDescricao}</td>
                                <td className="p-3">
                                  {s.conciliado ? (
                                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                      Liquidado
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                      Sugerido
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODO 2: FATURAS DE OPERADORAS & FORNECEDORES (CSV) */}
              {modoConciliacao === "FATURA" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Conteúdo da Planilha de Faturamento (CSV / Padrão Operadoras)
                      </label>
                      <button
                        onClick={() => {
                          setFaturaInputText(
                            "Localizador;Fornecedor;Cliente;Valor;Data\n" +
                            "VEN-2026-001;CVC Operadora;Marcos Souza;1.450,80;2026-08-20\n" +
                            "VEN-2026-002;RexturAdvance;Beatriz Lima;3.200,50;2026-08-22\n" +
                            "VEN-2026-003;EZLink;Familia Silva;1.600,00;2026-08-25"
                          );
                        }}
                        className="text-[11px] text-brand-900 font-semibold underline hover:text-gold-600 cursor-pointer"
                      >
                        Carregar Exemplo de CSV
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={faturaInputText}
                      onChange={(e) => setFaturaInputText(e.target.value)}
                      placeholder="Cole aqui o texto CSV exportado da fatura da operadora (ex: Localizador;Fornecedor;Valor;Data)..."
                      className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:border-brand-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleProcessarFaturaFornecedor(false)}
                      disabled={faturaCarregando}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {faturaCarregando ? "Conferindo..." : "1. Conferir Fatura & Identificar Divergências"}
                    </button>
                    <button
                      onClick={() => handleProcessarFaturaFornecedor(true)}
                      disabled={faturaCarregando}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
                    >
                      {faturaCarregando ? "Processando..." : "2. Conciliar & Liquidar Matches Perfeitos"}
                    </button>
                  </div>

                  {faturaResultado && (
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                      {/* KPIs da Fatura */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <div className="text-xl font-bold text-slate-900">{faturaResultado.totalItensFatura}</div>
                          <div className="text-[11px] text-slate-500">Total Lançamentos</div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl">
                          <div className="text-xl font-bold text-emerald-700">{faturaResultado.matchesPerfeitos}</div>
                          <div className="text-[11px] text-emerald-600">Matches Perfeitos</div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl">
                          <div className="text-xl font-bold text-amber-700">{faturaResultado.divergenciasValor}</div>
                          <div className="text-[11px] text-amber-600">Divergências de Valor</div>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl">
                          <div className="text-xl font-bold text-rose-600">{faturaResultado.naoEncontrados}</div>
                          <div className="text-[11px] text-rose-500">Não Encontrados</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <div className="text-xl font-bold text-blue-700">{formatBRL(faturaResultado.totalValorFatura)}</div>
                          <div className="text-[11px] text-blue-600">Total Fatura</div>
                        </div>
                      </div>

                      {/* Tabela de Cruzamento */}
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                            <tr>
                              <th className="p-3">Localizador / Ref</th>
                              <th className="p-3">Operadora</th>
                              <th className="p-3">Valor Fatura</th>
                              <th className="p-3">Valor Sistema</th>
                              <th className="p-3">Status da Auditoria</th>
                              <th className="p-3">Detalhes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {faturaResultado.itens.map((item: any, idx: number) => {
                              const isMatch = item.status === "MATCH_PERFEITO";
                              const isDivergence = item.status === "DIVERGENCIA_VALOR";
                              const isNotFound = item.status === "NAO_ENCONTRADO";
                              const isPaid = item.status === "JA_PAGO";

                              return (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-3 font-mono font-bold text-slate-900">
                                    {item.fatura.localizador}
                                  </td>
                                  <td className="p-3 font-medium text-slate-700">
                                    {item.fatura.fornecedor}
                                  </td>
                                  <td className="p-3 font-bold text-slate-900">
                                    {formatBRL(item.fatura.valor)}
                                  </td>
                                  <td className="p-3 font-mono">
                                    {item.valorSistema ? formatBRL(item.valorSistema) : "—"}
                                  </td>
                                  <td className="p-3">
                                    {isMatch && (
                                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                        {item.conciliado ? "Liquidado" : "Match Exato"}
                                      </span>
                                    )}
                                    {isDivergence && (
                                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                        Divergência
                                      </span>
                                    )}
                                    {isNotFound && (
                                      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                                        Não Encontrado
                                      </span>
                                    )}
                                    {isPaid && (
                                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                                        Já Quitado
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-600 text-[11px]">
                                    {item.detalhes}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. ABA: PERFORMANCE POR CONSULTOR */}
        {abaAtiva === "CONSULTORES" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-sm text-brand-900">
                Ranking de Performance Multidimensional dos Consultores
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3.5 pl-6 pr-3">Consultor</th>
                      <th className="py-3.5 px-3">Vendas</th>
                      <th className="py-3.5 px-3">GMV (Total Vendido)</th>
                      <th className="py-3.5 px-3">Lucro Agência</th>
                      <th className="py-3.5 px-3">Margem %</th>
                      <th className="py-3.5 px-3">Margem Contribuição</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Comissão Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {performanceConsultores.map((c) => (
                      <tr key={c.consultorId} className="hover:bg-slate-50/80">
                        <td className="py-4 pl-6 pr-3 font-bold text-slate-900">
                          {c.nome}
                          <span className="text-xs text-slate-400 block">{c.email}</span>
                        </td>
                        <td className="py-4 px-3 font-medium">{c.totalVendasCount}</td>
                        <td className="py-4 px-3 font-semibold text-slate-800">{formatBRL(c.gmvTotal)}</td>
                        <td className="py-4 px-3 font-bold text-emerald-700">{formatBRL(c.agencyRevenueTotal)}</td>
                        <td className="py-4 px-3 font-medium">{c.margemMediaPct}%</td>
                        <td className="py-4 px-3 font-bold text-brand-900">{formatBRL(c.contributionMarginTotal)}</td>
                        <td className="py-4 pl-3 pr-6 text-right font-black text-gold-600">
                          {formatBRL(c.comissaoTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. ABA: AUDITORIA E INTEGRIDADE */}
        {abaAtiva === "INTEGRIDADE" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                {integridade?.status === "HEALTHY" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {integridade?.status === "HEALTHY"
                      ? "Sistema Financeiro 100% Íntegro"
                      : "Atenção Requerida na Integridade Financeira"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Última auditoria em tempo real: {integridade?.timestamp ? new Date(integridade.timestamp).toLocaleString("pt-BR") : "Agora"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-100 text-center">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-brand-900">{integridade?.contagens?.totalCotacoes || 0}</div>
                  <div className="text-[11px] text-slate-500">Cotações</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-brand-900">{integridade?.contagens?.totalSales || 0}</div>
                  <div className="text-[11px] text-slate-500">Vendas (Sales)</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-brand-900">{integridade?.contagens?.totalReceivables || 0}</div>
                  <div className="text-[11px] text-slate-500">Recebíveis</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-brand-900">{integridade?.contagens?.totalPayables || 0}</div>
                  <div className="text-[11px] text-slate-500">Pagáveis</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-brand-900">{integridade?.contagens?.totalCommissions || 0}</div>
                  <div className="text-[11px] text-slate-500">Comissões</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: NOVO LANÇAMENTO FINANCEIRO                                         */}
        {/* ========================================================================= */}
        {modalNovoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 my-8">
              {/* Cabeçalho do Modal */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                    <PlusCircle className="h-4 w-4" />
                    Entrada Manual
                  </div>
                  <h2 className="text-xl font-bold text-brand-900">Novo Lançamento Financeiro</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registre receitas de clientes, despesas operacionais ou pagamentos a fornecedores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalNovoAberto(false);
                    setFormErrorNovo("");
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSalvarNovoLancamento} className="space-y-4">
                {formErrorNovo && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formErrorNovo}</span>
                  </div>
                )}

                {/* Tipo de Transação (Receita / Despesa) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipo de Movimentação *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNovoTipo("RECEITA");
                        if (novaCategoria === "PAGAMENTO_FORNECEDOR" || novaCategoria === "DESPESA_OPERACIONAL") {
                          setNovaCategoria("VENDA_CLIENTE");
                        }
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all border ${
                        novoTipo === "RECEITA"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                      Receita (Entrada / Crédito)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNovoTipo("DESPESA");
                        if (novaCategoria === "VENDA_CLIENTE" || novaCategoria === "COMISSAO_AGENCIA") {
                          setNovaCategoria("PAGAMENTO_FORNECEDOR");
                        }
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all border ${
                        novoTipo === "DESPESA"
                          ? "bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500/20"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowUpRight className="h-4 w-4 text-rose-600" />
                      Despesa (Saída / Débito)
                    </button>
                  </div>
                </div>

                {/* Descrição & Categoria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Descrição do Lançamento *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Recebimento Pacote Paris ou Tarifa Operadora"
                      value={novaDescricao}
                      onChange={(e) => setNovaDescricao(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-brand-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria Contábil *
                    </label>
                    <select
                      value={novaCategoria}
                      onChange={(e) => setNovaCategoria(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm bg-white focus:border-brand-900 focus:outline-none"
                    >
                      <option value="VENDA_CLIENTE">Venda para Cliente (Pacote / Reserva)</option>
                      <option value="PAGAMENTO_FORNECEDOR">Pagamento a Fornecedor / Operadora</option>
                      <option value="COMISSAO_AGENCIA">Comissão de Agência / Over</option>
                      <option value="TAXA_CAMBIO_IOF">Taxa de Câmbio / Spread / IOF</option>
                      <option value="REEMBOLSO">Reembolso / Estorno ao Cliente</option>
                      <option value="DESPESA_OPERACIONAL">Despesa Operacional / Administrativa</option>
                      <option value="OUTRO">Outras Movimentações</option>
                    </select>
                  </div>
                </div>

                {/* Valor, Moeda & Câmbio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Valor Original *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={novoValor}
                      onChange={(e) => setNovoValor(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm font-semibold focus:border-brand-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Moeda *
                    </label>
                    <select
                      value={novaMoeda}
                      onChange={(e) => {
                        const m = e.target.value as "BRL" | "USD" | "EUR";
                        setNovaMoeda(m);
                        if (m === "BRL") setNovoCambio(1.0);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm bg-white focus:border-brand-900 focus:outline-none"
                    >
                      <option value="BRL">BRL (Real R$)</option>
                      <option value="USD">USD (Dólar US$)</option>
                      <option value="EUR">EUR (Euro €)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cotação Câmbio {novaMoeda !== "BRL" && "*"}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      disabled={novaMoeda === "BRL"}
                      value={novaMoeda === "BRL" ? 1.0 : novoCambio}
                      onChange={(e) => setNovoCambio(Number(e.target.value))}
                      className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-900 focus:outline-none ${
                        novaMoeda === "BRL" ? "bg-slate-50 text-slate-400" : "bg-white font-medium"
                      }`}
                    />
                  </div>
                </div>

                {/* Prévia em BRL se moeda estrangeira */}
                {novaMoeda !== "BRL" && typeof novoValor === "number" && novoValor > 0 && (
                  <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
                    <span>Equivalente em Moeda Nacional (BRL):</span>
                    <strong className="text-sm font-black text-brand-900">
                      {formatBRL(novoValor * (novoCambio || 1))}
                    </strong>
                  </div>
                )}

                {/* Vencimento, Status & Método */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data Vencimento *
                    </label>
                    <input
                      type="date"
                      value={novoVencimento}
                      onChange={(e) => setNovoVencimento(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status do Lançamento *
                    </label>
                    <select
                      value={novoStatus}
                      onChange={(e) => setNovoStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm bg-white focus:border-brand-900 focus:outline-none"
                    >
                      <option value="PAGO">Pago / Liquidado (Compensado)</option>
                      <option value="PENDENTE">Pendente (A Compensar / A Vencer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Método de Pagamento *
                    </label>
                    <select
                      value={novoMetodo}
                      onChange={(e) => setNovoMetodo(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm bg-white focus:border-brand-900 focus:outline-none"
                    >
                      <option value="PIX">PIX</option>
                      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                      <option value="BOLETO">Boleto Bancário</option>
                      <option value="TRANSFERENCIA">Transferência / TED</option>
                      <option value="FATURADO">Faturado 15/30 dias</option>
                      <option value="DINHEIRO">Dinheiro em Espécie</option>
                    </select>
                  </div>
                </div>

                {/* Comprovante / Ref & Observações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Documento / Comprovante (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: DOC-987456 ou Chave Pix"
                      value={novoComprovante}
                      onChange={(e) => setNovoComprovante(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Observações / Detalhes (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Parcela 1/3 referente à reserva"
                      value={novasObs}
                      onChange={(e) => setNovasObs(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Ações do Formulário */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setModalNovoAberto(false);
                      setFormErrorNovo("");
                    }}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoNovo}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    {salvandoNovo ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-gold-400" />
                        <span>Salvando Lançamento...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 text-gold-400" />
                        <span>Salvar Lançamento</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE COBRANÇA PIX COM QR CODE */}
        {modalPixAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              {/* Cabeçalho Modal */}
              <div className="bg-brand-900 px-6 py-4 text-white flex items-center justify-between border-b border-gold-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/20 text-teal-300 border border-teal-400/30">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Cobrança PIX — FixTur</h3>
                    <p className="text-[11px] text-gold-300">Padrão Banco Central do Brasil</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalPixAberto(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {carregandoPix ? (
                <div className="py-16 text-center text-slate-500 text-sm space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-brand-900 mx-auto" />
                  <p>Gerando chave e QR Code PIX...</p>
                </div>
              ) : dadosPix ? (
                <div className="p-6 space-y-5">
                  {/* Resumo da Cobrança */}
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cliente:</span>
                      <strong className="text-slate-900">{dadosPix.cliente_nome}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reserva / Parcela:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {dadosPix.sale_number} (Parc. {dadosPix.parcela})
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm">
                      <span className="font-bold text-slate-700">Valor da Parcela:</span>
                      <strong className="font-black text-emerald-700">
                        {formatBRL(dadosPix.valor)}
                      </strong>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <img
                      src={dadosPix.qrcode_url}
                      alt="QR Code PIX FixTur"
                      className="h-44 w-44 rounded-lg object-contain"
                    />
                    <span className="text-[11px] text-slate-400 mt-2">
                      Aponte a câmera do app do banco para pagar
                    </span>
                  </div>

                  {/* Copia e Cola */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Código PIX Copia-e-Cola:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={dadosPix.payload_copia_cola}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none select-all"
                      />
                      <button
                        onClick={handleCopiarPix}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        <Copy className="h-3.5 w-3.5 text-gold-400" />
                        Copiar
                      </button>
                    </div>
                  </div>

                  {/* Ação WhatsApp */}
                  <button
                    onClick={handleCopiarWhatsAppPix}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Copiar Mensagem Pronta para WhatsApp
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
