"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  Key,
  Edit2,
  Lock,
  Mail,
  User,
  AlertCircle,
  Check,
  X,
  FileText,
  Eye,
  EyeOff,
  TrendingUp,
} from "lucide-react";

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "AGENTE" | "FINANCEIRO";
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  _count: {
    cotacoes: number;
  };
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("TODOS");
  const [filterStatus, setFilterStatus] = useState<string>("TODOS");

  // Modal Novo Usuário
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoRole, setNovoRole] = useState<"ADMIN" | "AGENTE" | "FINANCEIRO">("AGENTE");
  const [mostrarSenhaNovo, setMostrarSenhaNovo] = useState(false);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [formErrorNovo, setFormErrorNovo] = useState("");

  // Modal Editar Usuário
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioItem | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "AGENTE" | "FINANCEIRO">("AGENTE");
  const [editAtivo, setEditAtivo] = useState(true);
  const [editSenha, setEditSenha] = useState("");
  const [mostrarSenhaEdit, setMostrarSenhaEdit] = useState(false);
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [formErrorEdit, setFormErrorEdit] = useState("");

  // Toast de Sucesso
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/usuarios");
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsuarios(data.usuarios);
      } else {
        setErrorMsg(data.error || "Falha ao carregar usuários.");
      }
    } catch {
      setErrorMsg("Erro ao conectar à API de administração.");
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setFormErrorNovo("");

    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim()) {
      setFormErrorNovo("Preencha todos os campos obrigatórios.");
      return;
    }

    if (novaSenha.length < 6) {
      setFormErrorNovo("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setSalvandoNovo(true);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoNome.trim(),
          email: novoEmail.trim(),
          senha: novaSenha,
          role: novoRole,
          ativo: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormErrorNovo(data.error || "Erro ao criar colaborador.");
        return;
      }

      setModalNovoAberto(false);
      setNovoNome("");
      setNovoEmail("");
      setNovaSenha("");
      setNovoRole("AGENTE");
      mostrarToast(`Usuário ${data.usuario.nome} criado com sucesso!`);
      carregarUsuarios();
    } catch {
      setFormErrorNovo("Erro ao conectar com o servidor.");
    } finally {
      setSalvandoNovo(false);
    }
  }

  function abrirModalEdicao(u: UsuarioItem) {
    setUsuarioEditando(u);
    setEditNome(u.nome);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditAtivo(u.ativo);
    setEditSenha("");
    setFormErrorEdit("");
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioEditando) return;
    setFormErrorEdit("");

    if (!editNome.trim() || !editEmail.trim()) {
      setFormErrorEdit("Nome e e-mail não podem ficar vazios.");
      return;
    }

    if (editSenha && editSenha.length < 6) {
      setFormErrorEdit("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setSalvandoEdit(true);
    try {
      const payload: any = {
        nome: editNome.trim(),
        email: editEmail.trim(),
        role: editRole,
        ativo: editAtivo,
      };

      if (editSenha.trim()) {
        payload.senha = editSenha;
      }

      const res = await fetch(`/api/admin/usuarios/${usuarioEditando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormErrorEdit(data.error || "Erro ao salvar alterações.");
        return;
      }

      setUsuarioEditando(null);
      mostrarToast(`Usuário ${data.usuario.nome} atualizado!`);
      carregarUsuarios();
    } catch {
      setFormErrorEdit("Erro ao comunicar com o servidor.");
    } finally {
      setSalvandoEdit(false);
    }
  }

  async function handleToggleStatusRapido(u: UsuarioItem) {
    try {
      const res = await fetch(`/api/admin/usuarios/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !u.ativo }),
      });
      const data = await res.json();
      if (res.ok) {
        mostrarToast(
          `Usuário ${u.nome} foi ${!u.ativo ? "ativado" : "desativado"}.`
        );
        carregarUsuarios();
      } else {
        alert(data.error || "Não foi possível alterar o status.");
      }
    } catch {
      alert("Erro ao conectar com o servidor.");
    }
  }

  // Filtros
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "TODOS" || u.role === filterRole;
    const matchStatus =
      filterStatus === "TODOS" ||
      (filterStatus === "ATIVO" && u.ativo) ||
      (filterStatus === "INATIVO" && !u.ativo);
    return matchSearch && matchRole && matchStatus;
  });

  // Métricas
  const totalUsuarios = usuarios.length;
  const totalAgentes = usuarios.filter((u) => u.role === "AGENTE").length;
  const totalAdmins = usuarios.filter((u) => u.role === "ADMIN").length;
  const totalFinanceiro = usuarios.filter((u) => u.role === "FINANCEIRO").length;
  const totalAtivos = usuarios.filter((u) => u.ativo).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-900 text-gold-300 border border-gold-400/30">
            <Shield className="h-3 w-3 text-gold-400" />
            Administrador
          </span>
        );
      case "FINANCEIRO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <DollarSign className="h-3 w-3 text-indigo-500" />
            Financeiro / Gestor
          </span>
        );
      case "AGENTE":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Briefcase className="h-3 w-3 text-emerald-600" />
            Consultor / Agente
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Toast Notificação */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl border border-gold-500/30 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Cabeçalho da Página */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gold-600 uppercase tracking-wider mb-1">
              <Shield className="h-3.5 w-3.5" />
              Painel de Administração
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight">
              Gestão de Usuários & Permissões
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Cadastre novos consultores, configure níveis de acesso e gerencie a equipe da FIX Turismo.
            </p>
          </div>

          <button
            onClick={() => {
              setModalNovoAberto(true);
              setFormErrorNovo("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-800 transition-all cursor-pointer hover:shadow-lg active:scale-95"
          >
            <UserPlus className="h-4 w-4 text-gold-400" />
            Novo Colaborador
          </button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total de Usuários</span>
              <Users className="h-4 w-4 text-brand-900" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-900">{totalUsuarios}</span>
              <span className="text-xs text-emerald-600 font-medium">{totalAtivos} ativos</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Consultores (Agentes)</span>
              <Briefcase className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{totalAgentes}</span>
              <span className="text-[11px] text-slate-400">cotações individuais</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Administradores</span>
              <Shield className="h-4 w-4 text-gold-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-900">{totalAdmins}</span>
              <span className="text-[11px] text-slate-400">acesso total</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Financeiro / Gestão</span>
              <DollarSign className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-950">{totalFinanceiro}</span>
              <span className="text-[11px] text-slate-400">todas cotações</span>
            </div>
          </div>
        </div>

        {/* Barra de Busca & Filtros */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-2xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex w-full md:w-auto items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
              <span>Perfil:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-900 cursor-pointer"
              >
                <option value="TODOS">Todos os Perfis</option>
                <option value="ADMIN">Administrador</option>
                <option value="AGENTE">Consultor / Agente</option>
                <option value="FINANCEIRO">Financeiro / Gestor</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
              <span>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-900 cursor-pointer"
              >
                <option value="TODOS">Todos</option>
                <option value="ATIVO">Ativos</option>
                <option value="INATIVO">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              Carregando dados dos colaboradores...
            </div>
          ) : errorMsg ? (
            <div className="py-12 px-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-800">{errorMsg}</p>
              <button
                onClick={carregarUsuarios}
                className="mt-3 text-xs font-bold text-brand-900 underline cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Nenhum usuário encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-4">Colaborador</th>
                    <th className="py-3.5 px-4">Perfil / Acesso</th>
                    <th className="py-3.5 px-4 text-center">Cotações</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Cadastrado em</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {usuariosFiltrados.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Avatar e Nome */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-gold-300 font-bold text-xs border border-gold-400/30">
                            {u.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.nome}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Perfil */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Cotações Criadas */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          <FileText className="h-3 w-3 text-slate-400" />
                          {u._count.cotacoes}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Data de Criação */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(u.criado_em).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>

                      {/* Ações */}
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => abrirModalEdicao(u)}
                            title="Editar Dados / Redefinir Senha"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-brand-900 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                            Editar
                          </button>

                          <button
                            onClick={() => handleToggleStatusRapido(u)}
                            title={u.ativo ? "Desativar Colaborador" : "Ativar Colaborador"}
                            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                              u.ativo
                                ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                                : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                            }`}
                          >
                            {u.ativo ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NOVO USUÁRIO                                                     */}
      {/* ========================================================================= */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/75 px-6 py-4">
              <div className="flex items-center gap-2 text-brand-900 font-bold text-base">
                <UserPlus className="h-5 w-5 text-gold-500" />
                <span>Cadastrar Novo Colaborador</span>
              </div>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleCriarUsuario} className="p-6 space-y-4">
              {formErrorNovo && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{formErrorNovo}</span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail Corporativo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="carlos@fixturismo.com.br"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Perfil / Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Perfil de Acesso (Permissões) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      novoRole === "AGENTE"
                        ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Consultor</span>
                      <input
                        type="radio"
                        name="novoRole"
                        value="AGENTE"
                        checked={novoRole === "AGENTE"}
                        onChange={() => setNovoRole("AGENTE")}
                        className="text-emerald-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Cria cotações e visualiza apenas as suas.
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      novoRole === "FINANCEIRO"
                        ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Financeiro</span>
                      <input
                        type="radio"
                        name="novoRole"
                        value="FINANCEIRO"
                        checked={novoRole === "FINANCEIRO"}
                        onChange={() => setNovoRole("FINANCEIRO")}
                        className="text-indigo-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Visualiza cotações de toda a agência.
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      novoRole === "ADMIN"
                        ? "border-brand-900 bg-brand-50/60 ring-1 ring-brand-900"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-brand-900">Administrador</span>
                      <input
                        type="radio"
                        name="novoRole"
                        value="ADMIN"
                        checked={novoRole === "ADMIN"}
                        onChange={() => setNovoRole("ADMIN")}
                        className="text-brand-900"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Acesso total e gestão de usuários.
                    </span>
                  </label>
                </div>
              </div>

              {/* Senha Inicial */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha Inicial <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={mostrarSenhaNovo ? "text" : "password"}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaNovo(!mostrarSenhaNovo)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {mostrarSenhaNovo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoNovo}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  {salvandoNovo ? "Cadastrando..." : "Cadastrar Colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDITAR USUÁRIO & REDEFINIR SENHA                                 */}
      {/* ========================================================================= */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/75 px-6 py-4">
              <div className="flex items-center gap-2 text-brand-900 font-bold text-base">
                <Edit2 className="h-5 w-5 text-gold-500" />
                <span>Editar Colaborador: {usuarioEditando.nome}</span>
              </div>
              <button
                onClick={() => setUsuarioEditando(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulário de Edição */}
            <form onSubmit={handleSalvarEdicao} className="p-6 space-y-4">
              {formErrorEdit && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{formErrorEdit}</span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-brand-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Perfil / Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Perfil de Acesso
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      editRole === "AGENTE"
                        ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Consultor</span>
                      <input
                        type="radio"
                        name="editRole"
                        value="AGENTE"
                        checked={editRole === "AGENTE"}
                        onChange={() => setEditRole("AGENTE")}
                        className="text-emerald-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Cotações próprias
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      editRole === "FINANCEIRO"
                        ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Financeiro</span>
                      <input
                        type="radio"
                        name="editRole"
                        value="FINANCEIRO"
                        checked={editRole === "FINANCEIRO"}
                        onChange={() => setEditRole("FINANCEIRO")}
                        className="text-indigo-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Todas as cotações
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      editRole === "ADMIN"
                        ? "border-brand-900 bg-brand-50/60 ring-1 ring-brand-900"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-brand-900">Admin</span>
                      <input
                        type="radio"
                        name="editRole"
                        value="ADMIN"
                        checked={editRole === "ADMIN"}
                        onChange={() => setEditRole("ADMIN")}
                        className="text-brand-900"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Acesso total
                    </span>
                  </label>
                </div>
              </div>

              {/* Status Ativo / Inativo */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Conta Ativa</span>
                    <p className="text-[11px] text-slate-500">
                      Se desativado, o colaborador não conseguirá fazer login.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editAtivo}
                    onChange={(e) => setEditAtivo(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                  />
                </label>
              </div>

              {/* Redefinição de Senha (Opcional) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Redefinir Senha <span className="text-slate-400 font-normal lowercase">(deixe em branco para manter a atual)</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={mostrarSenhaEdit ? "text" : "password"}
                    placeholder="Digite a nova senha..."
                    value={editSenha}
                    onChange={(e) => setEditSenha(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaEdit(!mostrarSenhaEdit)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {mostrarSenhaEdit ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  {salvandoEdit ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
