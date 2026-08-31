import { useState } from "react";
import type { UserProfileResponse } from "../services/api";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthPageProps {
  onAuthSuccess: (user: UserProfileResponse) => void;
  defaultMode?: "login" | "register";
}

export default function AuthPage({ onAuthSuccess, defaultMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6 py-6 sm:py-10 relative overflow-hidden"
      style={{
        background: "radial-gradient(circle at 50% 15%, #161a29 0%, #0c0e15 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Glows Decorativos de Fundo (contidos para evitar overflow-x) */}
      <div
        className="absolute -top-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none opacity-35"
        style={{ background: "rgba(99, 102, 241, 0.35)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none opacity-25"
        style={{ background: "rgba(139, 92, 246, 0.3)" }}
      />

      {/* Hero / Apresentação do StudyOS com Tipografia Fluida */}
      <div className="text-center max-w-xl mb-6 sm:mb-7 relative z-10 animate-fade-in w-full">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-semibold mb-3 sm:mb-4 shadow-sm shadow-indigo-950/50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          StudyOS · Sistema Operacional de Estudos
        </div>
        <h1 className="heading-fluid-hero font-extrabold text-slate-100 tracking-tight">
          Acelere sua evolução diária com foco e gamificação
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 sm:mt-2.5 leading-relaxed max-w-md mx-auto px-2">
          Gerencie seu roadmap por estações, registre sessões de estudo, acumule XP e desbloqueie conquistas exclusivas.
        </p>

        {/* Badges de Destaque Responsivos */}
        <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
          <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
            ⚡ Gamificação &amp; XP
          </span>
          <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
            📅 Roadmap 4 Estações
          </span>
          <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
            ⏱️ Cronômetro de Foco
          </span>
        </div>
      </div>

      {/* Card Centralizado Único com Toggle Switch Responsivo */}
      <div className="w-full max-w-md relative z-10 px-0">
        <div
          className="relative rounded-2xl sm:rounded-3xl border p-5 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl transition-all"
          style={{
            background: "linear-gradient(165deg, rgba(22, 26, 38, 0.95) 0%, rgba(14, 17, 26, 0.98) 100%)",
            borderColor: "rgba(99, 102, 241, 0.2)",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.08)",
          }}
        >
          {/* Glow de topo decorativo */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)" }}
          />

          {/* Toggle com Touch Target Adequado (44px) */}
          <div className="flex items-center p-1 mb-5 sm:mb-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Entrar</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Cabeçalho do formulário ativo */}
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="heading-fluid-title font-bold text-slate-100 tracking-tight">
              {mode === "login" ? "Acessar sua Conta" : "Criar sua Conta no StudyOS"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === "login"
                ? "Entre para ver suas tarefas, estações e pontuação de XP"
                : "Cadastre-se para iniciar seu plano de estudos de alta performance"}
            </p>
          </div>

          {/* Formulários integrados no mesmo card */}
          {mode === "login" ? (
            <LoginForm
              onSuccess={onAuthSuccess}
              onSwitchToRegister={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              onSuccess={onAuthSuccess}
              onSwitchToLogin={() => setMode("login")}
            />
          )}
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="mt-6 sm:mt-7 text-center text-xs text-slate-600 relative z-10 px-4">
        <p>StudyOS &copy; {new Date().getFullYear()} — Plataforma de Estudos Gamificada</p>
      </footer>
    </div>
  );
}
