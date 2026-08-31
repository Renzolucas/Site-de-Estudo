import { useState, type FormEvent } from "react";
import { registerUser, type UserProfileResponse } from "../services/api";

interface RegisterFormProps {
  onSuccess: (user: UserProfileResponse) => void;
  onSwitchToLogin?: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: "Vazia", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: "Fraca", color: "bg-red-500" };
    if (score <= 3) return { score: 2, label: "Média", color: "bg-amber-500" };
    return { score: 3, label: "Forte", color: "bg-emerald-500" };
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "O nome completo é obrigatório.";
    } else if (name.trim().length < 2) {
      newErrors.name = "O nome deve ter no mínimo 2 caracteres.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "O e-mail é obrigatório.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Insira um endereço de e-mail válido.";
    }

    if (!password) {
      newErrors.password = "A senha é obrigatória.";
    } else if (password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres.";
    }

    if (confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const authData = await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setIsLoading(false);
      onSuccess(authData.user);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || "Não foi possível criar a conta. Tente novamente.";
      setErrors({ general: msg });
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.general && (
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-950/40 text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="leading-relaxed">{errors.general}</span>
        </div>
      )}

      {/* Nome Completo */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Nome Completo
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Ex: Alexandre Santos"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border transition-all outline-none ${
              errors.name
                ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700"
            }`}
            disabled={isLoading}
            autoComplete="name"
          />
        </div>
        {errors.name && <p className="text-xs text-red-400 mt-1 pl-1">{errors.name}</p>}
      </div>

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
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="seu.email@exemplo.com"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border transition-all outline-none ${
              errors.email
                ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700"
            }`}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        {errors.email && <p className="text-xs text-red-400 mt-1 pl-1">{errors.email}</p>}
      </div>

      {/* Senha */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Senha de Segurança
        </label>
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
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Mínimo 6 caracteres"
            className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border transition-all outline-none ${
              errors.password
                ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700"
            }`}
            disabled={isLoading}
            autoComplete="new-password"
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
        {errors.password && <p className="text-xs text-red-400 mt-1 pl-1">{errors.password}</p>}

        {/* Barra de força da senha */}
        {password.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>Força da senha: <span className="font-semibold text-slate-300">{strength.label}</span></span>
              <span>{password.length}/6 mín.</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden flex gap-1">
              <div className={`h-full rounded-full flex-1 ${strength.score >= 1 ? strength.color : "bg-slate-800"} transition-all`} />
              <div className={`h-full rounded-full flex-1 ${strength.score >= 2 ? strength.color : "bg-slate-800"} transition-all`} />
              <div className={`h-full rounded-full flex-1 ${strength.score >= 3 ? strength.color : "bg-slate-800"} transition-all`} />
            </div>
          </div>
        )}
      </div>

      {/* Confirmar Senha */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Confirmar Senha
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            placeholder="Repita a senha digitada"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border transition-all outline-none ${
              errors.confirmPassword
                ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700"
            }`}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-400 mt-1 pl-1">{errors.confirmPassword}</p>}
      </div>

      {/* Botão de Envio */}
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
              <span>Criando conta no StudyOS...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span>Criar Conta</span>
            </>
          )}
        </button>
      </div>

      {onSwitchToLogin && (
        <div className="pt-4 text-center border-t border-slate-800/60">
          <p className="text-xs text-slate-400">
            Já possui uma conta no StudyOS?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors ml-1 cursor-pointer"
            >
              Fazer Login
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
