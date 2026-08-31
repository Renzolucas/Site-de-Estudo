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
      className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden"
      style={{
        background: "radial-gradient(circle at 50% 15%, #161a29 0%, #0c0e15 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Glows Decorativos de Fundo */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] pointer-events-none opacity-40"
        style={{ background: "rgba(99, 102, 241, 0.35)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[130px] pointer-events-none opacity-30"
        style={{ background: "rgba(139, 92, 246, 0.3)" }}
      />

      {/* Hero / Apresentação do StudyOS */}
      <div className="text-center max-w-xl mb-7 relative z-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-semibold mb-4 shadow-sm shadow-indigo-950/50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          StudyOS · Sistema Operacional de Estudos
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Acelere sua evolução diária com foco e gamificação
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed max-w-md mx-auto">
          Gerencie seu roadmap por estações, registre sessões de estudo, acumule XP e desbloqueie conquistas exclusivas.
        </p>

        {/* Badges de Destaque */}
        <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
            ⚡ Gamificação &amp; XP
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
            📅 Roadmap 4 Estações
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
            ⏱️ Cronômetro de Foco
          </span>
        </div>
      </div>

      {/* Card Centralizado Único com Toggle Switch */}
      <div className="w-full max-w-md relative z-10">
        <div
          className="relative rounded-3xl border p-7 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl transition-all"
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

          {/* Toggle Simples para Alternar no Mesmo Card */}
          <div className="flex items-center p-1 mb-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
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
      <footer className="mt-7 text-center text-xs text-slate-600 relative z-10">
        <p>StudyOS &copy; {new Date().getFullYear()} — Plataforma de Estudos Gamificada</p>
      </footer>
    </div>
  );
}
