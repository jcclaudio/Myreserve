"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  PhoneCall,
  Mail,
  Calendar,
  ShieldCheck,
  PlusCircle,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  Layers,
} from "lucide-react";

interface Fornecedor {
  id: string;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  categoria: string;
  telefone_plantao?: string;
  email_plantao?: string;
  prazo_faturamento_dias: number;
  chave_pix?: string;
  ativo: boolean;
}

export default function FornecedoresPage() {
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNovo, setModalNovo] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Form
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [categoria, setCategoria] = useState("OPERADORA_HOTEL");
  const [telefonePlantao, setTelefonePlantao] = useState("");
  const [emailPlantao, setEmailPlantao] = useState("");
  const [prazoFaturamento, setPrazoFaturamento] = useState(15);
  const [chavePix, setChavePix] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarFornecedores();
  }, []);

  async function carregarFornecedores() {
    setLoading(true);
    try {
      const res = await fetch("/api/fornecedores");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setFornecedores(data.fornecedores);
      }
    } catch {
      console.error("Erro ao buscar fornecedores");
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  async function handleCriarFornecedor(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeFantasia.trim()) return;
    setSalvando(true);
    try {
      const res = await fetch("/api/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_fantasia: nomeFantasia,
          razao_social: razaoSocial,
          cnpj,
          categoria,
          telefone_plantao: telefonePlantao,
          email_plantao: emailPlantao,
          prazo_faturamento_dias: prazoFaturamento,
          chave_pix: chavePix,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setModalNovo(false);
        setNomeFantasia("");
        setRazaoSocial("");
        setCnpj("");
        setTelefonePlantao("");
        setEmailPlantao("");
        setChavePix("");
        mostrarToast("Fornecedor cadastrado com sucesso!");
        carregarFornecedores();
      } else {
        alert(data.error || "Erro ao cadastrar fornecedor.");
      }
    } catch {
      alert("Erro de conexão ao salvar fornecedor.");
    } finally {
      setSalvando(false);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1">
              <Building2 className="h-3.5 w-3.5" />
              Gestão de Fornecedores & Operadoras
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight">
              Parceiros & Plantão de Operações
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Catálogo de operadoras hoteleiras, consolidadoras aéreas e receptivos com contatos de plantão 24h para suporte a viagens.
            </p>
          </div>

          <button
            onClick={() => setModalNovo(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-brand-800 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-gold-400" />
            Cadastrar Fornecedor
          </button>
        </div>

        {/* Grid de Fornecedores */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Carregando parceiros...</div>
        ) : fornecedores.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 text-slate-500 text-sm">
            Nenhum fornecedor cadastrado ainda. Clique em "Cadastrar Fornecedor" para iniciar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {fornecedores.map((f) => (
              <div key={f.id} className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-brand-900 text-base">{f.nome_fantasia}</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">{f.categoria}</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    Ativo
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  {f.telefone_plantao && (
                    <div className="flex items-center gap-2 text-rose-700 font-bold bg-rose-50 p-2 rounded-lg">
                      <PhoneCall className="h-4 w-4" />
                      <span>Plantão 24h: {f.telefone_plantao}</span>
                    </div>
                  )}

                  {f.email_plantao && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{f.email_plantao}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Faturamento: {f.prazo_faturamento_dias} dias</span>
                  </div>

                  {f.chave_pix && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      <span>PIX: {f.chave_pix}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Novo Fornecedor */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-brand-900 text-base">Cadastrar Fornecedor / Parceiro</h3>
              <button onClick={() => setModalNovo(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCriarFornecedor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia (ex: Booking, Interep, BestBuy)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: BestBuy Travel"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
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
                    <option value="OPERADORA_HOTEL">Operadora de Hotéis</option>
                    <option value="CONSOLIDADORA_AEREA">Consolidadora Aérea</option>
                    <option value="RECEPTIVO_TRANSFER">Receptivo & Transfer</option>
                    <option value="SEGURO_VIAGEM">Seguro Viagem</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prazo Faturamento (Dias)</label>
                  <input
                    type="number"
                    value={prazoFaturamento}
                    onChange={(e) => setPrazoFaturamento(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Plantão 24h</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-8888"
                    value={telefonePlantao}
                    onChange={(e) => setTelefonePlantao(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Plantão / Suporte</label>
                  <input
                    type="email"
                    placeholder="suporte@fornecedor.com"
                    value={emailPlantao}
                    onChange={(e) => setEmailPlantao(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chave PIX / Dados Bancários</label>
                <input
                  type="text"
                  placeholder="Ex: financeiro@operadora.com.br"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
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
                  {salvando ? "Salvando..." : "Salvar Fornecedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
