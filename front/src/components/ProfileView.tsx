import React, { useState } from "react";
import type { UserProfileResponse } from "../services/api";
import { updateCurrentUserName, changePassword } from "../services/api";

interface ProfileViewProps {
  user: UserProfileResponse;
  onBack: () => void;
  onUserUpdated: (user: UserProfileResponse) => void;
  addToast: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
}

const getLevelTitle = (level: number): string => {
  if (level <= 1) return "Iniciante";
  if (level <= 3) return "Aprendiz";
  if (level <= 5) return "Estudioso";
  if (level <= 8) return "Mestre";
  if (level <= 12) return "Grão-Mestre";
  return "Lenda";
};

export default function ProfileView({
  user,
  onBack,
  onUserUpdated,
  addToast,
}: ProfileViewProps) {
  // Estado para Edição do Nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name || "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  // Estado para Alteração de Senha
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Cálculos de Gamificação
  const currentLevel = user.level || 1;
  const currentXpInLevel = (user.currentXp || 0) % 500;
  const maxXpInLevel = 500;
  const xpPercent = Math.min(
    Math.max(Math.round((currentXpInLevel / maxXpInLevel) * 100), 0),
    100
  );

  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "US";

  // Handlers para Edição de Nome
  const handleStartEditName = () => {
    setNameInput(user.name || "");
    setNameError(null);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setNameInput(user.name || "");
    setNameError(null);
    setIsEditingName(false);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();

    if (!cleanName) {
      setNameError("O nome não pode estar em branco.");
      return;
    }
    if (cleanName.length < 2) {
      setNameError("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    if (cleanName.length > 100) {
      setNameError("O nome não pode ter mais de 100 caracteres.");
      return;
    }

    setNameError(null);
    setIsSavingName(true);

    try {
      const updatedUser = await updateCurrentUserName(cleanName);
      onUserUpdated(updatedUser);
      setIsEditingName(false);
      addToast({
        type: "success",
        title: "Perfil atualizado",
        message: "Nome atualizado com sucesso!",
      });
    } catch (err: any) {
      setNameError(err.message || "Erro ao atualizar nome. Tente novamente.");
    } finally {
      setIsSavingName(false);
    }
  };

  // Handlers para Alteração de Senha
  const handleStartChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setIsChangingPassword(true);
  };

  const handleCancelChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setIsChangingPassword(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Informe a senha atual.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Informe a nova senha.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("A nova senha deve ser diferente da senha atual.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmação da nova senha não confere.");
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      // Limpa dados de senha imediatamente após o sucesso
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setIsChangingPassword(false);

      addToast({
        type: "success",
        title: "Segurança",
        message: res?.message || "Senha alterada com sucesso.",
      });
    } catch (err: any) {
      setPasswordError(err.message || "Erro ao alterar senha.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header com Botão Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer group"
              title="Voltar para a tela inicial do painel"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:-translate-x-0.5"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Voltar ao painel</span>
            </button>
          </div>
          <h1 className="heading-fluid-title font-semibold text-slate-100 mt-2">
            Meu Perfil
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Veja seus dados e gerencie o acesso à sua conta
          </p>
        </div>
      </div>

      {/* Grid de 3 Colunas no Desktop / 1 Coluna no Celular */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Dados Pessoais & Segurança (2 Colunas Desktop) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Card: Dados Pessoais */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/50">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Dados pessoais
                </h2>
                <p className="text-xs text-slate-500">
                  Suas informações de identificação na plataforma
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {/* Linha Nome */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Nome completo
                </label>
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="space-y-3">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => {
                          setNameInput(e.target.value);
                          if (nameError) setNameError(null);
                        }}
                        placeholder="Seu nome"
                        maxLength={100}
                        disabled={isSavingName}
                        autoFocus
                        className={`w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border transition-all outline-none ${
                          nameError
                            ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700"
                        }`}
                      />
                    </div>
                    {nameError && (
                      <p className="text-xs text-red-400 pl-1">{nameError}</p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isSavingName}
                        className="min-h-[38px] px-4 py-2 rounded-xl font-medium text-xs text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingName ? (
                          <>
                            <svg
                              className="animate-spin h-3.5 w-3.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span>Salvando...</span>
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditName}
                        disabled={isSavingName}
                        className="min-h-[38px] px-3.5 py-2 rounded-xl font-medium text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {user.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleStartEditName}
                      className="min-h-[32px] px-3 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all cursor-pointer flex-shrink-0"
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>

              {/* Linha E-mail (somente leitura) */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    disabled
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-950/40 border border-slate-800/80 cursor-not-allowed select-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 pl-1 flex items-center gap-1.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="flex-shrink-0 text-slate-500"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  O e-mail é usado para entrar e não pode ser alterado por aqui.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Segurança */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/50">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Segurança
                </h2>
                <p className="text-xs text-slate-500">
                  Gerencie sua senha de acesso
                </p>
              </div>
            </div>

            <div className="mt-5">
              {!isChangingPassword ? (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Senha
                  </label>
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <span className="text-sm font-mono tracking-widest text-slate-400">
                      ••••••••
                    </span>
                    <button
                      type="button"
                      onClick={handleStartChangePassword}
                      className="min-h-[32px] px-3 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all cursor-pointer flex-shrink-0"
                    >
                      Alterar senha
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSavePassword} className="space-y-4">
                  {/* Mensagem de Erro Geral */}
                  {passwordError && (
                    <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/40 text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
                      <svg
                        className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {/* Senha Atual */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Senha atual
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            width="18"
                            height="11"
                            x="3"
                            y="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                        disabled={isSavingPassword}
                        autoComplete="current-password"
                        className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        title={
                          showCurrentPassword ? "Ocultar senha" : "Ver senha"
                        }
                      >
                        {showCurrentPassword ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                          </svg>
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Nova Senha */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Nova senha
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            width="18"
                            height="11"
                            x="3"
                            y="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        disabled={isSavingPassword}
                        autoComplete="new-password"
                        className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        title={showNewPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showNewPassword ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                          </svg>
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            width="18"
                            height="11"
                            x="3"
                            y="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        disabled={isSavingPassword}
                        autoComplete="new-password"
                        className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        title={
                          showConfirmPassword ? "Ocultar senha" : "Ver senha"
                        }
                      >
                        {showConfirmPassword ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                          </svg>
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Botões do Formulário de Senha */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className="min-h-[40px] px-4 py-2 rounded-xl font-medium text-xs text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingPassword ? (
                        <>
                          <svg
                            className="animate-spin h-3.5 w-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Salvando nova senha...</span>
                        </>
                      ) : (
                        "Salvar nova senha"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelChangePassword}
                      disabled={isSavingPassword}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl font-medium text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Cartão Resumo (1 Coluna Desktop) */}
        <div className="col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm flex flex-col items-center text-center">
            {/* Avatar Grande */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-500/20">
                {initials}
              </div>
              <div
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-400 border-3 border-slate-900 shadow-sm"
                title="Status: Online"
              />
            </div>

            {/* Nome e E-mail */}
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              {user.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 break-all">
              {user.email}
            </p>

            {/* Badge Nível */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <span>Nível {currentLevel}</span>
              <span>·</span>
              <span>{getLevelTitle(currentLevel)}</span>
            </div>

            {/* Barra de Progresso de XP */}
            <div className="w-full mt-5 pt-4 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Progresso de XP
                </span>
                <span className="font-mono text-indigo-400 font-semibold">
                  {currentXpInLevel} / {maxXpInLevel} XP
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Chips de Sequência (Streak) e Proteção (Frozen) */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
              <div
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-900/50 bg-amber-950/20"
                title={`${user.streakDays || 0} dias consecutivos de estudo`}
              >
                <span className="text-lg">🔥</span>
                <span className="text-xs font-bold text-amber-400 mt-1">
                  {user.streakDays || 0} dias
                </span>
                <span className="text-[10px] text-amber-500/80 uppercase tracking-wider font-medium">
                  Sequência
                </span>
              </div>

              <div
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-cyan-900/50 bg-cyan-950/20"
                title={`Proteção de Streak: ${user.frozenCount || 0} Frozen (+1 a cada 30 dias de streak)`}
              >
                <span className="text-lg">🧊</span>
                <span className="text-xs font-bold text-cyan-300 mt-1">
                  {user.frozenCount || 0} Frozen
                </span>
                <span className="text-[10px] text-cyan-500/80 uppercase tracking-wider font-medium">
                  Proteção
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
