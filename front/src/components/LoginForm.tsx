import { useState, type FormEvent } from "react";
import { loginUser, type UserProfileResponse } from "../services/api";

interface LoginFormProps {
  onSuccess: (user: UserProfileResponse) => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor, informe seu e-mail.");
      return;
    }
    if (!password) {
      setError("Por favor, informe sua senha.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const authData = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      setIsLoading(false);
      onSuccess(authData.user);
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg =
        err?.message || "Credenciais inválidas. Verifique seu e-mail e senha.";
      setError(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-950/40 text-red-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* E-mail */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          E-mail de Acesso
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="seu.email@exemplo.com"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Senha */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Senha
          </label>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Sua senha de acesso"
            className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
            disabled={isLoading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title={showPassword ? "Ocultar senha" : "Ver senha"}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
            boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
          }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Autenticando...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Entrar no StudyOS</span>
            </>
          )}
        </button>
      </div>

      {onSwitchToRegister && (
        <div className="pt-4 text-center border-t border-slate-800/60">
          <p className="text-xs text-slate-400">
            Ainda não tem uma conta?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors ml-1 cursor-pointer"
            >
              Criar conta gratuita
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
