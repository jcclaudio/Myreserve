"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import FixLogo from "@/components/FixLogo";
import {
  PlusCircle,
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
  const [exchange, setExchange] = useState<{
    usd?: number;
    eur?: number;
    error?: string;
  }>({});
  const [loadingExchange, setLoadingExchange] = useState(false);

  useEffect(() => {
    fetchMe();
    fetchExchange();
  }, [pathname]);

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

  // Ocultar Navbar em páginas públicas de proposta ou no login
  if (pathname === "/login" || pathname?.includes("/proposta")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur shadow-sm no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo FIX Turismo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-90 py-1"
          >
            <FixLogo size="sm" variant="dark" />
          </Link>

          {/* Links de Navegação */}
          {user && (
            <nav className="hidden md:flex items-center gap-1.5 ml-2">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  pathname === "/"
                    ? "bg-brand-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                Histórico
              </Link>

              <Link
                href="/cotacoes/nova"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  pathname === "/cotacoes/nova"
                    ? "bg-brand-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5 text-gold-400" />
                Nova Cotação
              </Link>

              {/* Meu Financeiro (Comissões do Consultor) */}
              <Link
                href="/meu-financeiro"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  pathname?.startsWith("/meu-financeiro")
                    ? "bg-brand-900 text-gold-300 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5 text-gold-400" />
                Meu Financeiro
              </Link>

              {/* Módulo Financeiro Geral (Admin/Gestor) */}
              {(user.role === "ADMIN" || user.role === "FINANCEIRO") && (
                <Link
                  href="/financeiro"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    pathname?.startsWith("/financeiro")
                      ? "bg-brand-900 text-gold-300 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  Financeiro Geral
                </Link>
              )}

              {/* Operações & Chamados (ITSM / SLA) */}
              <Link
                href="/chamados"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  pathname?.startsWith("/chamados")
                    ? "bg-brand-900 text-gold-300 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                }`}
              >
                <LifeBuoy className="h-3.5 w-3.5 text-indigo-400" />
                Operações & SLA
              </Link>

              {/* Fornecedores & Parceiros */}
              <Link
                href="/fornecedores"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  pathname?.startsWith("/fornecedores")
                    ? "bg-brand-900 text-gold-300 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                }`}
              >
                <Building2 className="h-3.5 w-3.5 text-gold-400" />
                Fornecedores
              </Link>

              {/* Módulo Administração */}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin/usuarios"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    pathname?.startsWith("/admin")
                      ? "bg-brand-900 text-gold-300 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand-900"
                  }`}
                >
                  <Users className="h-3.5 w-3.5 text-gold-500" />
                  Administração
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Cotação de Câmbio & Usuário */}
        <div className="flex items-center gap-4">
          {/* Widget Câmbio */}
          <div className="hidden lg:flex items-center gap-3 rounded-full bg-slate-50 px-3.5 py-1.5 border border-slate-200 text-xs text-slate-600 shadow-2xs">
            <div className="flex items-center gap-1.5 font-semibold text-brand-900">
              <TrendingUp className="h-3.5 w-3.5 text-gold-500" />
              <span>Câmbio:</span>
            </div>

            {exchange.usd && exchange.eur ? (
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-slate-800">
                  USD:{" "}
                  <span className="text-emerald-700 font-bold">
                    R$ {exchange.usd.toFixed(2)}
                  </span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-slate-800">
                  EUR:{" "}
                  <span className="text-brand-700 font-bold">
                    R$ {exchange.eur.toFixed(2)}
                  </span>
                </span>
              </div>
            ) : exchange.error ? (
              <span
                className="text-amber-600 flex items-center gap-1"
                title={exchange.error}
              >
                <AlertCircle className="h-3.5 w-3.5" /> Manual
              </span>
            ) : (
              <span className="text-slate-400">Carregando câmbio...</span>
            )}

            <button
              onClick={fetchExchange}
              disabled={loadingExchange}
              title="Atualizar Cotação"
              className="ml-1 text-slate-400 hover:text-brand-900 transition-colors cursor-pointer"
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
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-brand-900 leading-none">
                  {user.nome}
                </span>
                <span className="text-[10px] font-semibold text-gold-600 leading-tight flex items-center justify-end gap-1 mt-0.5">
                  {user.role === "ADMIN" && <Shield className="h-2.5 w-2.5 text-gold-500 inline" />}
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-gold-300 font-bold text-xs border border-gold-400/40 shadow-xs">
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
    </header>
  );
}
