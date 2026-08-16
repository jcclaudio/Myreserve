"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Award,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface ComissaoItem {
  id: string;
  valor_comissao: number;
  base_calculo_valor: number;
  percentual_aplicado: number;
  base_calculo_tipo: string;
  status: string;
  criado_em: string;
  data_pagamento?: string | null;
  sale: {
    id: string;
    sale_number: string;
    cliente_nome: string;
    destino: string;
    gross_sale_amount: number;
    agency_revenue: number;
    status: string;
  };
  plan?: {
    nome: string;
    base_calculo: string;
  } | null;
}

interface MetricasConsultor {
  totalComissoes: number;
  totalProvisionado: number;
  totalAprovado: number;
  totalPago: number;
  totalVendasValor: number;
}

export default function MeuFinanceiroPage() {
  const router = useRouter();
  const [comissoes, setComissoes] = useState<ComissaoItem[]>([]);
  const [metricas, setMetricas] = useState<MetricasConsultor | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    carregarMinhasComissoes();
  }, [filtroStatus]);

  async function carregarMinhasComissoes() {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      params.append("mine", "true");
      if (filtroStatus !== "TODOS") params.append("status", filtroStatus);

      const res = await fetch(`/api/comissoes?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setComissoes(data.comissoes);
        setMetricas(data.metricas);
      } else {
        setErrorMsg(data.error || "Erro ao carregar extrato de comissões.");
      }
    } catch {
      setErrorMsg("Erro de conexão ao buscar extrato de comissões.");
    } finally {
      setLoading(false);
    }
  }

  function formatBRL(val?: number) {
    return (val ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Pago
          </span>
        );
      case "APPROVED":
      case "PAYABLE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            <Clock className="h-3 w-3 text-blue-600" />
            Aprovado (A Receber)
          </span>
        );
      case "ACCRUED":
      case "CALCULATED":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            Provisionado
          </span>
        );
    }
  }

  function handleExportarCSV() {
    if (comissoes.length === 0) {
      alert("Nenhuma comissão para exportar.");
      return;
    }

    const headers = [
      "Venda_Numero",
      "Cliente",
      "Destino",
      "Valor_Venda_BRL",
      "Base_Calculo_Lucro_BRL",
      "Percentual_Aplicado",
      "Comissao_BRL",
      "Status",
      "Data_Criacao",
    ];

    const rows = comissoes.map((c) => [
      c.sale.sale_number,
      `"${c.sale.cliente_nome.replace(/"/g, '""')}"`,
      `"${c.sale.destino.replace(/"/g, '""')}"`,
      c.sale.gross_sale_amount.toFixed(2),
      c.base_calculo_valor.toFixed(2),
      `${c.percentual_aplicado}%`,
      c.valor_comissao.toFixed(2),
      c.status,
      new Date(c.criado_em).toLocaleDateString("pt-BR"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `meu_extrato_comissoes_fixtur_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg("Extrato de comissões baixado com sucesso!");
    setTimeout(() => setToastMsg(""), 4000);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gold-600 uppercase tracking-wider mb-1">
              <Award className="h-3.5 w-3.5" />
              Painel do Consultor
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight">
              Meu Financeiro & Comissões
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe suas vendas individuais, comissões adquiridas, previsão e extrato de repasses da FixTur.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportarCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-brand-900 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-500" />
              Exportar Extrato (CSV)
            </button>
            <Link
              href="/cotacoes/nova"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-brand-800 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-gold-400" />
              Nova Cotação
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARDS DE KPIS INDIVIDUAIS                                                 */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* GMV Individual */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Total em Vendas</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-900">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {formatBRL(metricas?.totalVendasValor)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {metricas?.totalComissoes || 0} venda(s) realizada(s)
              </p>
            </div>
          </div>

          {/* Comissão Provisionada */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Comissão Provisionada</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-amber-600">
                {formatBRL(metricas?.totalProvisionado)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">aguardando liquidação da venda</p>
            </div>
          </div>

          {/* Comissão Aprovada (A Receber) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Comissão Aprovada</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-blue-600">
                {formatBRL(metricas?.totalAprovado)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">liberada para próximo lote</p>
            </div>
          </div>

          {/* Comissão Efetivamente Paga */}
          <div className="rounded-2xl bg-brand-900 p-5 text-white shadow-sm border border-gold-500/30 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-24 w-24 bg-gold-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs font-bold text-gold-300 uppercase tracking-wider">
              <span>Total Já Recebido</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-gold-300">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-white">
                {formatBRL(metricas?.totalPago)}
              </span>
              <p className="text-[11px] text-gold-300 mt-0.5">comissões quitadas</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FILTROS E TABELA DE LANÇAMENTOS DE COMISSÃO                               */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filtrar Status:
              </span>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-900 cursor-pointer"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="ACCRUED">Provisionada</option>
                <option value="APPROVED">Aprovada (A Receber)</option>
                <option value="PAID">Paga</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span>Cálculo transparente sobre a margem de contribuição da venda</span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              Carregando comissões...
            </div>
          ) : errorMsg ? (
            <div className="py-12 px-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-800">{errorMsg}</p>
            </div>
          ) : comissoes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Nenhuma comissão registrada até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-3">Venda / Ref</th>
                    <th className="py-3.5 px-3">Cliente & Destino</th>
                    <th className="py-3.5 px-3">Valor da Venda</th>
                    <th className="py-3.5 px-3">Base da Comissão</th>
                    <th className="py-3.5 px-3">Regra / %</th>
                    <th className="py-3.5 px-3">Sua Comissão</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {comissoes.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Venda Ref */}
                      <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                        <span className="font-bold text-brand-900 font-mono">
                          {c.sale.sale_number}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                        </span>
                      </td>

                      {/* Cliente e Destino */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-900">
                          {c.sale.cliente_nome}
                        </div>
                        <div className="text-xs text-slate-400">
                          {c.sale.destino}
                        </div>
                      </td>

                      {/* Valor Total Venda */}
                      <td className="py-4 px-3 whitespace-nowrap font-semibold text-slate-800">
                        {formatBRL(c.sale.gross_sale_amount)}
                      </td>

                      {/* Base de Cálculo */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-700">
                          {formatBRL(c.base_calculo_valor)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Lucro Bruto da Agência
                        </span>
                      </td>

                      {/* Regra Aplicada */}
                      <td className="py-4 px-3 whitespace-nowrap text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                          {c.percentual_aplicado}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {c.plan?.nome || "Plano FixTur"}
                        </span>
                      </td>

                      {/* Valor da Comissão */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="font-black text-sm text-emerald-700">
                          {formatBRL(c.valor_comissao)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
