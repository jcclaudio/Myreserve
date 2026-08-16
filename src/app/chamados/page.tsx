"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LifeBuoy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Search,
  Filter,
  AlertCircle,
  X,
  MessageSquare,
  ShieldAlert,
  Flame,
  Plane,
  Check,
  Building2,
} from "lucide-react";

interface Chamado {
  id: string;
  ticket_number: string;
  titulo: string;
  descricao: string;
  categoria: string;
  prioridade: string;
  sla_minutos: number;
  sla_limite: string;
  status: string;
  cliente_nome: string;
  cliente_contato?: string;
  solucao?: string;
  criado_por: { nome: string };
  responsavel?: { nome: string } | null;
  sale?: { sale_number: string; destino: string } | null;
  criado_em: string;
}

export default function ChamadosPage() {
  const router = useRouter();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroPrioridade, setFiltroPrioridade] = useState("TODOS");

  // Modal Novo
  const [modalNovo, setModalNovo] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("SUPORTE_GERAL");
  const [prioridade, setPrioridade] = useState("MEDIA");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteContato, setClienteContato] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Modal Resolver
  const [chamadoResolvendo, setChamadoResolvendo] = useState<Chamado | null>(null);
  const [solucaoTexto, setSolucaoTexto] = useState("");
  const [resolvendo, setResolvendo] = useState(false);

  useEffect(() => {
    carregarChamados();
  }, [filtroStatus, filtroPrioridade]);

  async function carregarChamados() {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (filtroStatus !== "TODOS") params.append("status", filtroStatus);
      if (filtroPrioridade !== "TODOS") params.append("prioridade", filtroPrioridade);

      const res = await fetch(`/api/chamados?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setChamados(data.chamados);
        setMetricas(data.metricas);
      } else {
        setErrorMsg(data.error || "Erro ao carregar chamados.");
      }
    } catch {
      setErrorMsg("Erro de conexão ao buscar chamados.");
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  async function handleCriarChamado(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim() || !clienteNome.trim()) {
      alert("Preencha título, descrição e cliente.");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch("/api/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descricao,
          categoria,
          prioridade,
          cliente_nome: clienteNome,
          cliente_contato: clienteContato,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setModalNovo(false);
        setTitulo("");
        setDescricao("");
        setClienteNome("");
        setClienteContato("");
        mostrarToast(data.mensagem || "Chamado aberto com sucesso!");
        carregarChamados();
      } else {
        alert(data.error || "Erro ao abrir chamado.");
      }
    } catch {
      alert("Erro ao comunicar com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarResolucao(e: React.FormEvent) {
    e.preventDefault();
    if (!chamadoResolvendo || !solucaoTexto.trim()) return;
    setResolvendo(true);
    try {
      const res = await fetch(`/api/chamados/${chamadoResolvendo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVIDO",
          solucao: solucaoTexto.trim(),
        }),
      });
      if (res.ok) {
        setChamadoResolvendo(null);
        setSolucaoTexto("");
        mostrarToast("Chamado resolvido com sucesso!");
        carregarChamados();
      } else {
        alert("Erro ao resolver chamado.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setResolvendo(false);
    }
  }

  function getSlaBadge(c: Chamado) {
    if (c.status === "RESOLVIDO") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Resolvido
        </span>
      );
    }
    const agora = new Date();
    const limite = new Date(c.sla_limite);
    const diffMinutos = Math.floor(
      (limite.getTime() - agora.getTime()) / (1000 * 60)
    );

    if (diffMinutos < 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200 animate-pulse">
          <Flame className="h-3 w-3 text-red-600" />
          SLA Violado ({Math.abs(diffMinutos)}m atrás)
        </span>
      );
    } else if (diffMinutos <= 60) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
          <Clock className="h-3 w-3 text-amber-600" />
          {diffMinutos}m restantes (Risco)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
        <Clock className="h-3 w-3 text-slate-400" />
        {Math.floor(diffMinutos / 60)}h {diffMinutos % 60}m restantes
      </span>
    );
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
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <LifeBuoy className="h-3.5 w-3.5" />
              Operações & Suporte a Viagens (ITSM)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight">
              Central de Chamados & SLA
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestão de ocorrências pós-venda, pedidos de alteração, no-show e emergências com controle de SLA em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setModalNovo(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-brand-800 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-gold-400" />
              Abrir Chamado
            </button>
          </div>
        </div>

        {/* Radar de SLA e Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase">Abertos</span>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {metricas?.totalAbertos || 0}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase">Em Atendimento</span>
            <div className="mt-2 text-2xl font-black text-blue-600">
              {metricas?.totalEmAtendimento || 0}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase">SLA em Risco</span>
            <div className="mt-2 text-2xl font-black text-amber-600">
              {metricas?.totalSlaEmRisco || 0}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase">SLA Violado</span>
            <div className="mt-2 text-2xl font-black text-rose-600">
              {metricas?.totalSlaViolado || 0}
            </div>
          </div>

          <div className="rounded-2xl bg-brand-900 p-5 text-white shadow-sm border border-gold-500/30">
            <span className="text-xs font-bold text-gold-300 uppercase">Resolvidos</span>
            <div className="mt-2 text-2xl font-black text-white">
              {metricas?.totalResolvidos || 0}
            </div>
          </div>
        </div>

        {/* Tabela de Chamados */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Status:</span>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="TODOS">Todos</option>
                <option value="ABERTO">Aberto</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="RESOLVIDO">Resolvido</option>
              </select>

              <span className="text-xs font-bold text-slate-700 uppercase ml-2">Prioridade:</span>
              <select
                value={filtroPrioridade}
                onChange={(e) => setFiltroPrioridade(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="TODOS">Todas</option>
                <option value="CRITICA_EMERGENCIA">Crítica (Emergência)</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Carregando chamados...</div>
          ) : chamados.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Nenhum chamado de suporte encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3.5 pl-6 pr-3">Ticket</th>
                    <th className="py-3.5 px-3">Título / Categoria</th>
                    <th className="py-3.5 px-3">Cliente</th>
                    <th className="py-3.5 px-3">Prioridade</th>
                    <th className="py-3.5 px-3">SLA / Prazo</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {chamados.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="py-4 pl-6 pr-3 font-bold font-mono text-brand-900">
                        {c.ticket_number}
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-900">{c.titulo}</div>
                        <div className="text-xs text-slate-400">{c.categoria}</div>
                      </td>
                      <td className="py-4 px-3 font-medium text-slate-900">
                        {c.cliente_nome}
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
                          c.prioridade === "CRITICA_EMERGENCIA"
                            ? "bg-rose-100 text-rose-800"
                            : c.prioridade === "ALTA"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-slate-100 text-slate-800"
                        }`}>
                          {c.prioridade}
                        </span>
                      </td>
                      <td className="py-4 px-3">{getSlaBadge(c)}</td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        {c.status !== "RESOLVIDO" && (
                          <button
                            onClick={() => {
                              setChamadoResolvendo(c);
                              setSolucaoTexto("");
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            Resolver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Chamado */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-brand-900 text-base">Abrir Chamado de Operações & Suporte</h3>
              <button onClick={() => setModalNovo(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCriarChamado} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título do Chamado</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: No-Show no Hotel Paris ou Troca de Voo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-brand-900 focus:outline-none"
                  >
                    <option value="NO_SHOW_EMERGENCIA">No-Show / Emergência Hotel</option>
                    <option value="ALTERACAO_RESERVA">Alteração de Reserva</option>
                    <option value="UPGRADE_QUARTO">Upgrade de Quarto</option>
                    <option value="CANCELAMENTO_REEMBOLSO">Cancelamento & Reembolso</option>
                    <option value="PROBLEMA_PAGAMENTO">Problema de Pagamento</option>
                    <option value="SUPORTE_GERAL">Suporte Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Criticidade (SLA)</label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-brand-900 focus:outline-none"
                  >
                    <option value="CRITICA_EMERGENCIA">Crítica (SLA: 30 min)</option>
                    <option value="ALTA">Alta (SLA: 2 horas)</option>
                    <option value="MEDIA">Média (SLA: 4 horas)</option>
                    <option value="BAIXA">Baixa (SLA: 24 horas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Passageiro / Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição Detalhada do Problema</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Informe o voucher, o que ocorreu e o que precisa ser feito..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-900 hover:bg-brand-800 rounded-xl"
                >
                  {salvando ? "Abrindo..." : "Registrar Chamado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resolver Chamado */}
      {chamadoResolvendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-brand-900 text-base">
                Resolver Chamado {chamadoResolvendo.ticket_number}
              </h3>
              <button onClick={() => setChamadoResolvendo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarResolucao} className="space-y-3">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                <strong>Ocorrência:</strong> {chamadoResolvendo.titulo} ({chamadoResolvendo.cliente_nome})
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descreva a Solução Aplicada
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ex: Contatado o hotel e confirmado novo quarto com voucher reenviado por WhatsApp ao cliente."
                  value={solucaoTexto}
                  onChange={(e) => setSolucaoTexto(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setChamadoResolvendo(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resolvendo}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {resolvendo ? "Salvando..." : "Confirmar Resolução"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
