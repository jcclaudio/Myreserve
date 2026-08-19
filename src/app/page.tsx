"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  PlusCircle,
  Search,
  Calendar,
  MapPin,
  Building2,
  FileText,
  Trash2,
  Eye,
  ExternalLink,
  Filter,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface CotacaoSummary {
  id: string;
  cliente_nome: string;
  destino: string;
  data_ida: string;
  data_volta: string;
  adultos: number;
  criancas: number;
  quartos: number;
  cotacao_usd: number;
  cotacao_eur: number;
  comissao_padrao_agencia_pct: number;
  criado_em: string;
  usuario: {
    nome: string;
    email: string;
  };
  hoteis: Array<{
    id: string;
    hotel_nome: string;
    canais: Array<{
      id: string;
      canal_nome: string;
      moeda: string;
      valor_mostrado: number;
      valor_final_venda: number;
      custo_em_brl: number;
      escolhido_manual: boolean;
      menor_custo_do_grupo: boolean;
      maior_venda_do_grupo: boolean;
    }>;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [cotacoes, setCotacoes] = useState<CotacaoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroDestino, setFiltroDestino] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  useEffect(() => {
    carregarCotacoes();
  }, []);

  async function carregarCotacoes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCliente) params.set("cliente", filtroCliente);
      if (filtroDestino) params.set("destino", filtroDestino);
      if (filtroDataInicio) params.set("data_inicio", filtroDataInicio);
      if (filtroDataFim) params.set("data_fim", filtroDataFim);

      const res = await fetch(`/api/cotacoes?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setCotacoes(data.cotacoes || []);
    } catch (err) {
      console.error("Erro ao carregar cotações:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletar(id: string, clienteNome: string) {
    if (
      !confirm(
        `Tem certeza que deseja excluir a cotação do cliente "${clienteNome}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/cotacoes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCotacoes((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert("Erro ao excluir cotação.");
      }
    } catch {
      alert("Falha na comunicação com o servidor.");
    }
  }

  function handleFiltrar(e: React.FormEvent) {
    e.preventDefault();
    carregarCotacoes();
  }

  function limparFiltros() {
    setFiltroCliente("");
    setFiltroDestino("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setTimeout(() => {
      fetch("/api/cotacoes")
        .then((r) => r.json())
        .then((data) => setCotacoes(data.cotacoes || []));
    }, 50);
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cotações de Hospedagem
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Histórico centralizado de cotações com comparativo multicanal e precificação em BRL.
            </p>
          </div>

          <Link
            href="/cotacoes/nova"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 py-3 text-sm font-bold text-gold-300 border border-gold-400/30 shadow-lg shadow-brand-950/20 hover:bg-brand-800 transition-all cursor-pointer"
          >
            <PlusCircle className="h-5 w-5 text-gold-400" />
            Nova Cotação
          </Link>
        </div>

        {/* Filtros de Busca */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
          <form
            onSubmit={handleFiltrar}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
          >
            {/* Cliente */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cliente
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nome do cliente..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Destino */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Destino
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cidade, país..."
                  value={filtroDestino}
                  onChange={(e) => setFiltroDestino(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Criado a partir de
              </label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Até
              </label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Ações de Filtro */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtrar
              </button>
              {(filtroCliente || filtroDestino || filtroDataInicio || filtroDataFim) && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Cotações */}
        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
              <p className="mt-3 text-sm text-slate-500">Carregando cotações...</p>
            </div>
          ) : cotacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-4">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">
                Nenhuma cotação encontrada
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Não encontramos cotações com os filtros selecionados ou nenhuma cotação foi cadastrada ainda.
              </p>
              <Link
                href="/cotacoes/nova"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Criar Primeira Cotação
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cotacoes.map((cotacao) => {
                const totalHoteis = cotacao.hoteis.length;
                const totalCanais = cotacao.hoteis.reduce(
                  (acc, h) => acc + h.canais.length,
                  0
                );
                const canaisEscolhidos = cotacao.hoteis.flatMap((h) =>
                  h.canais.filter((c) => c.escolhido_manual)
                );
                const temEscolha = canaisEscolhidos.length > 0;

                const ida = new Date(cotacao.data_ida).toLocaleDateString("pt-BR", {
                  timeZone: "UTC",
                });
                const volta = new Date(cotacao.data_volta).toLocaleDateString(
                  "pt-BR",
                  { timeZone: "UTC" }
                );
                const criadoEm = new Date(cotacao.criado_em).toLocaleDateString(
                  "pt-BR"
                );

                return (
                  <div
                    key={cotacao.id}
                    className="group rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 hover:border-brand-300 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Informações Principais */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">
                            {cotacao.cliente_nome}
                          </h2>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {cotacao.destino}
                          </span>
                          {temEscolha && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              {canaisEscolhidos.length} opção(ões) selecionada(s)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {ida} até {volta}
                          </span>
                          <span>•</span>
                          <span>
                            {cotacao.adultos} adulto(s)
                            {cotacao.criancas > 0 &&
                              `, ${cotacao.criancas} criança(s)`}
                            , {cotacao.quartos} quarto(s)
                          </span>
                          <span>•</span>
                          <span>
                            Agente:{" "}
                            <strong className="text-slate-700 font-medium">
                              {cotacao.usuario.nome}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>Criado em: {criadoEm}</span>
                        </div>

                        {/* Resumo de Hotéis e Canais */}
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <div className="text-xs bg-slate-50 text-slate-600 rounded-lg px-2.5 py-1 border border-slate-100">
                            <strong>{totalHoteis}</strong> hotel(is) cotado(s) •{" "}
                            <strong>{totalCanais}</strong> canal(is) de venda
                          </div>
                          {cotacao.hoteis.map((h) => (
                            <span
                              key={h.id}
                              className="text-xs bg-brand-50/70 text-brand-800 rounded-lg px-2.5 py-1 font-medium border border-brand-100"
                            >
                              {h.hotel_nome}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto">
                        {/* Proposta Cliente */}
                        <Link
                          href={`/cotacoes/${cotacao.id}/proposta`}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors text-center"
                          title="Visualizar Proposta Limpa para o Cliente"
                        >
                          <FileText className="h-3.5 w-3.5 text-brand-400" />
                          Proposta Cliente
                        </Link>

                        {/* Ver / Editar Cotação */}
                        <Link
                          href={`/cotacoes/${cotacao.id}`}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors text-center"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          Detalhes / Editar
                        </Link>

                        {/* Excluir */}
                        <button
                          onClick={() =>
                            handleDeletar(cotacao.id, cotacao.cliente_nome)
                          }
                          className="inline-flex items-center justify-center rounded-xl p-2.5 sm:p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir cotação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
