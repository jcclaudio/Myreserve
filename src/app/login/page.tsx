"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FixLogo, { FixIcon } from "@/components/FixLogo";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Globe2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister ? { nome, email, senha } : { email, senha };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocorreu um erro. Verifique seus dados.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Falha na conexão com o servidor.");
      setLoading(false);
    }
  }

  function handleFillDemo() {
    setEmail("agente@fixturismo.com.br");
    setSenha("senha123");
    setIsRegister(false);
    setError(null);
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-900">
      {/* LADO ESQUERDO: Imagem de Turismo Premium com a Logo em Destaque */}
      <div className="relative hidden lg:flex lg:w-7/12 flex-col justify-between p-12 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/luxury_travel_bg.jpg"
            alt="Destino de Luxo FIX Turismo"
            fill
            priority
            className="object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Overlay gradiente cinematográfico para contraste e sofisticação */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1b2e] via-[#1b3252]/60 to-[#122137]/40 backdrop-blur-[1px]" />
        </div>

        {/* Topo: Logo FIX Turismo em Destaque */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="p-4 rounded-2xl bg-[#1b3252]/70 backdrop-blur-md border border-gold-400/30 shadow-2xl inline-block">
            <FixLogo size="lg" variant="light" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 border border-white/20 text-xs font-semibold text-gold-200">
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            Portal de Cotações Exclusivo
          </div>
        </div>

        {/* Centro / Rodapé: Mensagem Institucional de Turismo */}
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-gold-300">
              Assessoria & Gestão de Viagens
            </span>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
              A precisão financeira que sua consultoria de turismo precisa.
            </h1>
            <p className="text-sm text-slate-200/90 leading-relaxed font-normal">
              Compare fornecedores em tempo real, aplique margens estratégicas com
              câmbio automático e gere propostas de alto padrão para seus clientes.
            </p>
          </div>
        </div>

        {/* Rodapé esquerdo */}
        <div className="relative z-10 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/10 pt-4">
          <span>© {new Date().getFullYear()} FIX Turismo. Todos os direitos reservados.</span>
          <span className="flex items-center gap-1 text-gold-300/80">
            <Globe2 className="h-3.5 w-3.5" /> Conectado ao mercado global
          </span>
        </div>
      </div>

      {/* LADO DIREITO: Painel de Autenticação / Login com Alto Contraste */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-5/12 bg-white">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Logo no mobile (quando a coluna esquerda está oculta) */}
          <div className="lg:hidden flex flex-col items-center text-center">
            <div className="p-4 rounded-2xl bg-brand-900 shadow-xl mb-3">
              <FixLogo size="md" variant="light" />
            </div>
          </div>

          {/* Cabeçalho do Formulário */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-600 block mb-1">
              Área Restrita
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isRegister ? "Criar conta de consultor" : "Acesse sua conta"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              {isRegister
                ? "Preencha seus dados para acessar o painel de cotações."
                : "Digite suas credenciais corporativas para continuar."}
            </p>
          </div>

          {/* Mensagem de Erro com Alto Contraste */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border-2 border-red-200 shadow-sm animate-shake">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="font-semibold">{error}</div>
            </div>
          )}

          {/* Formulário */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Ana Silva"
                    className="block w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-brand-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-900/10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                E-mail Corporativo *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="consultor@fixturismo.com.br"
                  className="block w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-brand-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-900/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Senha de Acesso *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-brand-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-900/10"
                />
              </div>
            </div>

            {/* Botão de Ação Principal */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b3252] hover:bg-[#24446e] border border-gold-400/40 py-3.5 text-sm font-bold text-gold-300 shadow-xl shadow-[#1b3252]/20 hover:shadow-2xl transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                "Validando credenciais..."
              ) : isRegister ? (
                <>
                  Criar Conta de Consultor <ArrowRight className="h-4 w-4 text-gold-400" />
                </>
              ) : (
                <>
                  Entrar no Sistema <ArrowRight className="h-4 w-4 text-gold-400" />
                </>
              )}
            </button>
          </form>

          {/* Alternar modo Login / Cadastro */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-bold text-brand-900 hover:text-gold-600 hover:underline transition-colors cursor-pointer"
            >
              {isRegister
                ? "Já possui uma conta? Faça login aqui"
                : "Novo consultor na equipe? Cadastre-se aqui"}
            </button>
          </div>

          {/* Atalho Demo */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-900 bg-slate-100 hover:bg-gold-50 hover:border-gold-300 border border-slate-200 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-gold-600" />
              Preencher com Usuário Demonstração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
