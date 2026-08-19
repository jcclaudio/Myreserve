"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import FixLogo from "@/components/FixLogo";
import {
  ListFilter,
  LogOut,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Shield,
  Users,
  DollarSign,
  LifeBuoy,
  Building2,
  Menu,
  X,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";

interface UserData {
  id: string;
  nome: string;
  email: string;
  role: string; // ADMIN | AGENTE | FINANCEIRO
  ativo?: boolean;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [exchange, setExchange] = useState<{
    usd?: number;
    eur?: number;
    error?: string;
  }>({});
  const [loadingExchange, setLoadingExchange] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMe();
    fetchExchange();
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchMe() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.usuario);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExchange() {
    setLoadingExchange(true);
    try {
      const res = await fetch("/api/exchange");
      const data = await res.json();
      if (data.success) {
        setExchange({ usd: data.usd, eur: data.eur });
      } else {
        setExchange({ error: data.error });
      }
    } catch {
      setExchange({ error: "Falha ao conectar à API de câmbio" });
    } finally {
      setLoadingExchange(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "FINANCEIRO":
        return "Financeiro / Gestor";
      case "AGENTE":
      default:
        return "Consultor";
    }
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  // Ocultar Navbar em páginas públicas de proposta ou no login
  if (pathname === "/login" || pathname?.includes("/proposta")) {
    return null;
  }

  const isCotacoesActive = pathname === "/" || pathname?.startsWith("/cotacoes");
  const isFinanceiroActive =
    pathname?.startsWith("/financeiro") || pathname?.startsWith("/meu-financeiro");
  const isOperacoesActive =
    pathname?.startsWith("/chamados") || pathname?.startsWith("/fornecedores");
  const isAdminActive = pathname?.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur shadow-sm no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo FIX Turismo & Navegação Principal */}
        <div className="flex items-center gap-6 lg:gap-10" ref={navRef}>
          {/* Botão Hambúrguer Mobile */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-brand-900 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}

          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-90 py-1"
          >
            <FixLogo size="sm" variant="dark" />
          </Link>

          {/* Links de Navegação Desktop Agrupados com Respiro */}
          {user && (
            <nav className="hidden md:flex items-center gap-2 lg:gap-3">
              {/* 1. Cotações (Histórico) */}
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isCotacoesActive
                    ? "bg-brand-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                }`}
              >
                <ListFilter className="h-4 w-4" />
                Cotações
              </Link>

              {/* 2. Submenu Financeiro */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("financeiro")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isFinanceiroActive
                      ? "bg-brand-900 text-gold-300 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                  }`}
                >
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span>Financeiro</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      openDropdown === "financeiro" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === "financeiro" && (
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-200/90 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link
                      href="/meu-financeiro"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        pathname?.startsWith("/meu-financeiro")
                          ? "bg-brand-50 text-brand-900"
                          : "text-slate-700 hover:bg-slate-50 hover:text-brand-900"
                      }`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-50 text-gold-600 border border-gold-200/60">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div>Meu Financeiro</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Minhas comissões & extrato
                        </div>
                      </div>
                    </Link>

                    {(user.role === "ADMIN" || user.role === "FINANCEIRO") && (
                      <Link
                        href="/financeiro"
                        onClick={() => setOpenDropdown(null)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors mt-1 ${
                          pathname?.startsWith("/financeiro")
                            ? "bg-brand-50 text-brand-900"
                            : "text-slate-700 hover:bg-slate-50 hover:text-brand-900"
                        }`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div>Financeiro Geral</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            DRE, pagáveis & recebíveis
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Submenu Operações */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("operacoes")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isOperacoesActive
                      ? "bg-brand-900 text-gold-300 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                  }`}
                >
                  <LifeBuoy className="h-4 w-4 text-indigo-500" />
                  <span>Operações</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      openDropdown === "operacoes" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === "operacoes" && (
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-200/90 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link
                      href="/chamados"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        pathname?.startsWith("/chamados")
                          ? "bg-brand-50 text-brand-900"
                          : "text-slate-700 hover:bg-slate-50 hover:text-brand-900"
                      }`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                        <LifeBuoy className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div>Chamados & SLA</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Central de atendimento
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/fornecedores"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors mt-1 ${
                        pathname?.startsWith("/fornecedores")
                          ? "bg-brand-50 text-brand-900"
                          : "text-slate-700 hover:bg-slate-50 hover:text-brand-900"
                      }`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-50 text-gold-600 border border-gold-200/60">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div>Fornecedores</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Parceiros e comissões
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* 4. Administração (Apenas Admin) */}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin/usuarios"
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isAdminActive
                      ? "bg-brand-900 text-gold-300 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                  }`}
                >
                  <Users className="h-4 w-4 text-gold-500" />
                  Administração
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Cotação de Câmbio Desktop & Usuário */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Widget Câmbio Desktop - Design Executivo Slim */}
          <div className="hidden lg:inline-flex items-center gap-3 rounded-full bg-slate-50/90 hover:bg-slate-100/70 px-3.5 py-1.5 border border-slate-200/90 text-xs shadow-2xs transition-colors whitespace-nowrap">
            <div className="flex items-center gap-1.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5 text-gold-500" />
              <span>Câmbio</span>
            </div>

            <span className="h-3 w-px bg-slate-200" />

            {exchange.usd && exchange.eur ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-baseline gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">USD</span>
                  <span className="font-bold text-emerald-700">
                    R$ {exchange.usd.toFixed(2)}
                  </span>
                </span>

                <span className="h-3 w-px bg-slate-200" />

                <span className="inline-flex items-baseline gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">EUR</span>
                  <span className="font-bold text-brand-900">
                    R$ {exchange.eur.toFixed(2)}
                  </span>
                </span>
              </div>
            ) : exchange.error ? (
              <span
                className="text-amber-600 flex items-center gap-1 text-[11px]"
                title={exchange.error}
              >
                <AlertCircle className="h-3.5 w-3.5" /> Modo Manual
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">Carregando...</span>
            )}

            <button
              onClick={fetchExchange}
              disabled={loadingExchange}
              title="Atualizar Cotação"
              className="text-slate-400 hover:text-brand-900 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loadingExchange ? "animate-spin text-brand-800" : ""
                }`}
              />
            </button>
          </div>

          {/* Dados do Usuário & Logout */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-brand-900 leading-none">
                  {user.nome}
                </span>
                <span className="text-[10px] font-semibold text-gold-600 leading-tight flex items-center justify-end gap-1 mt-0.5">
                  {user.role === "ADMIN" && <Shield className="h-2.5 w-2.5 text-gold-500 inline" />}
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-brand-900 text-gold-300 font-bold text-xs border border-gold-400/40 shadow-xs">
                {user.nome.slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                title="Sair do sistema"
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : !loading ? (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800 transition-colors"
            >
              Entrar
            </Link>
          ) : null}
        </div>
      </div>

      {/* Menu Mobile Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-4 shadow-lg">
          {/* Câmbio Mobile */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold-500" />
              <span className="font-semibold text-slate-700">Câmbio Comercial:</span>
            </div>
            {exchange.usd && exchange.eur ? (
              <div className="flex items-center gap-2 font-medium">
                <span className="text-emerald-700 font-bold">USD {exchange.usd.toFixed(2)}</span>
                <span className="text-slate-300">|</span>
                <span className="text-brand-700 font-bold">EUR {exchange.eur.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-slate-400 text-[11px]">Atualizando...</span>
            )}
            <button
              onClick={fetchExchange}
              disabled={loadingExchange}
              className="p-1 text-slate-400 hover:text-brand-900 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingExchange ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Links de Navegação Mobile Agrupados */}
          <div className="space-y-3">
            {/* Cotações */}
            <div>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                  pathname === "/"
                    ? "bg-brand-900 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <ListFilter className="h-4 w-4 text-slate-500" />
                Cotações & Histórico
              </Link>
            </div>

            {/* Grupo Financeiro */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3.5">
                Financeiro
              </div>
              <Link
                href="/meu-financeiro"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                  pathname?.startsWith("/meu-financeiro")
                    ? "bg-brand-900 text-gold-300 shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <TrendingUp className="h-4 w-4 text-gold-500" />
                Meu Financeiro (Comissões)
              </Link>

              {(user.role === "ADMIN" || user.role === "FINANCEIRO") && (
                <Link
                  href="/financeiro"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                    pathname?.startsWith("/financeiro")
                      ? "bg-brand-900 text-gold-300 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Financeiro Geral & DRE
                </Link>
              )}
            </div>

            {/* Grupo Operações */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3.5">
                Operações
              </div>
              <Link
                href="/chamados"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                  pathname?.startsWith("/chamados")
                    ? "bg-brand-900 text-gold-300 shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <LifeBuoy className="h-4 w-4 text-indigo-500" />
                Operações & Chamados SLA
              </Link>

              <Link
                href="/fornecedores"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                  pathname?.startsWith("/fornecedores")
                    ? "bg-brand-900 text-gold-300 shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Building2 className="h-4 w-4 text-gold-500" />
                Fornecedores & Parceiros
              </Link>
            </div>

            {/* Grupo Administração */}
            {user.role === "ADMIN" && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3.5">
                  Gestão
                </div>
                <Link
                  href="/admin/usuarios"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                    pathname?.startsWith("/admin")
                      ? "bg-brand-900 text-gold-300 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Users className="h-4 w-4 text-gold-500" />
                  Administração de Usuários
                </Link>
              </div>
            )}
          </div>

          {/* Perfil & Sair no Mobile */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-gold-300 font-bold text-xs border border-gold-400/40">
                {user.nome.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 leading-tight">{user.nome}</div>
                <div className="text-[10px] text-slate-500">{getRoleLabel(user.role)}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
