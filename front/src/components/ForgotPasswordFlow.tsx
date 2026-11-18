import { useState, type FormEvent } from "react";
import { forgotPassword, verifyResetCode, resetPassword } from "../services/api";

interface ForgotPasswordFlowProps {
  onBackToLogin: () => void;
}

type RecoveryStep = "request" | "verify" | "reset" | "success";

export default function ForgotPasswordFlow({ onBackToLogin }: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<RecoveryStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. Enviar código de recuperação
  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor, informe seu e-mail.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Insira um endereço de e-mail válido.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await forgotPassword(email.trim());
      setIsLoading(false);
      if (response?.demoCode) {
        setDemoCode(response.demoCode);
      }
      setStep("verify");
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Não foi possível enviar o código. Tente novamente.");
    }
  };

  // 2. Reenviar código
  const handleResendCode = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setResendSuccess(false);

    try {
      const response = await forgotPassword(email.trim());
      setIsLoading(false);
      setResendSuccess(true);
      if (response?.demoCode) {
        setDemoCode(response.demoCode);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Erro ao reenviar o código.");
    }
  };

  // 3. Verificar código de 6 dígitos
  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError("Por favor, informe o código de 6 dígitos.");
      return;
    }
    if (!/^\d{6}$/.test(cleanCode)) {
      setError("O código deve conter exatamente 6 dígitos numéricos.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await verifyResetCode({
        email: email.trim(),
        code: cleanCode,
      });
      setIsLoading(false);
      setStep("reset");
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Código inválido ou expirado.");
    }
  };

  // 4. Redefinir senha
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setError("Por favor, informe a nova senha.");
      return;
    }
    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (!confirmPassword) {
      setError("Por favor, confirme a nova senha.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setIsLoading(false);
      setStep("success");
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Erro ao redefinir senha. Tente novamente.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Alerta de Erro */}
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

      {/* Passo 1: Informar e-mail */}
      {step === "request" && (
        <form onSubmit={handleRequestCode} className="space-y-4" noValidate>
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
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Enviaremos um código de 6 dígitos válido por 10 minutos para redefinir sua senha.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
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
                  <span>Enviando código...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 2 11 13" />
                    <path d="m22 2-7 20-4-9-9-4 20-7z" />
                  </svg>
                  <span>Enviar código</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-3 text-center border-t border-slate-800/60">
            <button
              type="button"
              onClick={onBackToLogin}
              className="min-h-[44px] inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              ← Voltar ao login
            </button>
          </div>
        </form>
      )}

      {/* Passo 2: Digite o código */}
      {step === "verify" && (
        <form onSubmit={handleVerifyCode} className="space-y-4" noValidate>
          {/* Aviso discreto de Modo Demonstração */}
          {demoCode && (
            <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="leading-relaxed">
                <p className="font-semibold text-indigo-200">
                  Modo demonstração: nenhum e-mail é enviado de verdade.
                </p>
                <p className="mt-1">
                  Seu código:{" "}
                  <span className="font-mono font-bold tracking-widest text-white text-sm bg-indigo-900/70 px-2 py-0.5 rounded border border-indigo-500/40 select-all">
                    {demoCode}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Feedback de reenvio de código */}
          {resendSuccess && (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Novo código gerado com sucesso!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Código de Verificação (6 dígitos)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCode(val);
                  setError("");
                }}
                placeholder="000000"
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono tracking-widest text-slate-100 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-slate-500">
                Enviado para <strong className="text-slate-400">{email}</strong>
              </span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="min-h-[36px] inline-flex items-center text-xs text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors disabled:opacity-50 cursor-pointer"
              >
                Reenviar código
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
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
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Verificar código</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-3 text-center border-t border-slate-800/60">
            <button
              type="button"
              onClick={onBackToLogin}
              className="min-h-[44px] inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              ← Voltar ao login
            </button>
          </div>
        </form>
      )}

      {/* Passo 3: Criar nova senha */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          {/* Nova Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nova Senha
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                placeholder="Mínimo de 6 caracteres"
                className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showNewPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showNewPassword ? (
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

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Repita sua nova senha"
                className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showConfirmPassword ? (
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
              className="w-full min-h-[44px] relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
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
                  <span>Redefinindo senha...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Redefinir senha</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-3 text-center border-t border-slate-800/60">
            <button
              type="button"
              onClick={onBackToLogin}
              className="min-h-[44px] inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              ← Voltar ao login
            </button>
          </div>
        </form>
      )}

      {/* Passo 4: Sucesso */}
      {step === "success" && (
        <div className="text-center py-3 space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">Senha redefinida com sucesso!</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Sua nova senha já está ativa. Acesse sua conta agora com as novas credenciais.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
              }}
            >
              <span>Voltar ao login</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
