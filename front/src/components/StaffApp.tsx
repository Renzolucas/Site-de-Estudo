import React, { useState, useEffect } from "react";
import type { UserProfileResponse } from "../services/api";
import { checkApiHealth } from "../services/api";
import ProfileView from "./ProfileView";
import NotificationBell from "./NotificationBell";
import NotificationsView from "./NotificationsView";
import RoleBadge, { getRoleConfig } from "./roles";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminAnnouncements from "./admin/AdminAnnouncements";
import AdminPermissions from "./admin/AdminPermissions";
import MentorOverview from "./mentor/MentorOverview";
import MentorStudents from "./mentor/MentorStudents";
import MentorAnnouncements from "./mentor/MentorAnnouncements";

/**
 * POLÍTICA DE PERMISSÕES DO STUDYOS
 * (Regras de governança que orientam as Etapas 1, 2, 3 e 4):
 *
 * 1. ESTUDANTE (STUDENT):
 *    - Acesso estrito aos próprios dados, tarefas, roadmap, gamificação e ranking.
 *    - Não visualiza dados nem métricas de outros usuários.
 *
 * 2. MENTOR / PROFESSOR (MENTOR):
 *    - Resumo do progresso dos alunos vinculados (horas estudadas, XP acumulado e tarefas).
 *    - Envio de comunicados e avisos específicos para seus alunos orientados.
 *    - Privacidade assegurada: NÃO vê e-mail pessoal nem anotações privadas dos estudantes.
 *    - Somente leitura pedagógica: NÃO altera tarefas, notas ou dados de alunos.
 *
 * 3. ADMINISTRADOR (ADMIN):
 *    - Gerencia usuários, atribuição de papéis (Student, Mentor, Admin) e vínculos.
 *    - Publica avisos e comunicados gerais para toda a plataforma.
 *    - Governança: Somente DESATIVA contas de usuários (não há exclusão definitiva de dados).
 *    - Regras de segurança institucional:
 *      * Não pode alterar o próprio papel.
 *      * Não pode desativar a si mesmo.
 *      * O último administrador ativo do sistema não pode ser rebaixado nem desativado.
 */

interface StaffAppProps {
  user: UserProfileResponse;
  onLogout: () => void;
  onUserUpdated: (user: UserProfileResponse) => void;
  addToast: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
}

type StaffViewState = "tabs" | "profile" | "notifications";

const ADMIN_TABS = ["Visão geral", "Usuários", "Avisos", "Permissões"] as const;
const MENTOR_TABS = ["Painel", "Meus alunos", "Avisos"] as const;

export default function StaffApp({
  user,
  onLogout,
  onUserUpdated,
  addToast,
}: StaffAppProps) {
  const isAdmin = user.role === "ADMIN";
  const tabs = isAdmin ? ADMIN_TABS : MENTOR_TABS;

  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [viewState, setViewState] = useState<StaffViewState>("tabs");
  const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null);
  const [noMentorUsersFilter, setNoMentorUsersFilter] = useState(false);
  const [mentorAnnouncementStudentId, setMentorAnnouncementStudentId] = useState<number | null>(null);

  // Monitora conectividade com a API Spring Boot
  useEffect(() => {
    checkApiHealth().then((online) => setIsApiConnected(online));
    const interval = setInterval(() => {
      checkApiHealth().then((online) => setIsApiConnected(online));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const roleConfig = getRoleConfig(user.role);

  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  const getTabDescription = (tab: string): string => {
    switch (tab) {
      case "Painel":
        return "Resumo consolidado do desempenho e dedicação semanal dos estudantes orientados.";
      case "Meus alunos":
        return "Lista detalhada de alunos vinculados, horas de estudo, tarefas concluídas e ritmo acadêmico.";
      case "Avisos":
        return "Envio de orientações, lembretes de prazos e comunicados direcionados aos seus alunos vinculados.";
      default:
        return "Esta área será liberada na próxima etapa.";
    }
  };

  const getCapabilitiesList = (): string[] => {
    return [
      "Acompanhar o progresso dos alunos vinculados (horas estudadas, XP e tarefas)",
      "Enviar avisos e orientações diretas para seus estudantes acompanhados",
      "Visualizar métricas consolidadas de desempenho e ritmo de estudo da sua turma",
      "Garantia de privacidade: sem acesso aos e-mails nem anotações privadas dos alunos",
    ];
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col flex-1 w-full"
      style={{
        background: "#0c0e15",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header Autenticado Responsivo para Staff (Mentor / Administrador) */}
      <header
        className="sticky top-0 z-40 border-b border-slate-800/60 transition-all"
        style={{
          background: "rgba(12,14,21,0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
            {/* Esquerda: Logo StudyOS & Abas Desktop */}
            <div className="flex items-center gap-4 lg:gap-6 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">
                  StudyOS
                </span>
                <span className="hidden sm:inline-block">
                  <RoleBadge role={user.role} size="sm" />
                </span>
              </div>

              {/* Abas de Navegação Desktop (>= 768px) */}
              <nav className="hidden md:flex items-center gap-1">
                {tabs.map((tab) => {
                  const isActive = viewState === "tabs" && activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setViewState("tabs");
                      }}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-800 text-slate-100 shadow-sm"
                          : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Direita: Status da API, Notificações, Perfil e Sair */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Indicador de Conexão com o Spring Boot */}
              <div
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-all ${
                  isApiConnected
                    ? "border-emerald-500/30 bg-emerald-950/30"
                    : "border-orange-500/30 bg-orange-950/30"
                }`}
                title={
                  isApiConnected
                    ? "Conectado ao Spring Boot REST (http://localhost:8080/api/v1)"
                    : "Falha na conexão com o Backend Spring Boot (http://localhost:8080)"
                }
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isApiConnected
                      ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"
                      : "bg-orange-500 shadow-sm shadow-orange-500/50"
                  }`}
                />
              </div>

              {/* Sino de Notificações */}
              <NotificationBell
                onOpenAll={() => setViewState("notifications")}
                addToast={addToast}
              />

              {/* Botão de Perfil (Avatar) */}
              <button
                type="button"
                onClick={() => setViewState("profile")}
                className={`relative flex items-center gap-2 pl-1.5 sm:pl-2 py-1 px-1.5 rounded-xl border border-transparent transition-all cursor-pointer hover:bg-slate-800/60 ${
                  viewState === "profile"
                    ? "ring-2 ring-indigo-500 bg-slate-800/70"
                    : ""
                }`}
                title="Meu perfil"
                aria-label="Abrir meu perfil"
              >
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-500/20 ${
                    viewState === "profile" ? "ring-2 ring-indigo-400" : ""
                  }`}
                >
                  {initials}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {roleConfig.shortLabel}
                  </p>
                </div>
                <div className="absolute top-1 left-7 sm:left-8 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </button>

              {/* Botão Sair (Logout) */}
              <button
                onClick={onLogout}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all text-xs font-medium cursor-pointer"
                title="Sair da conta e retornar à tela de login"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Submenu Mobile: Pílulas com rolagem horizontal (< 768px) */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/50">
            {tabs.map((tab) => {
              const isActive = viewState === "tabs" && activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setViewState("tabs");
                  }}
                  className={`min-h-[34px] px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/80"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {viewState === "profile" && (
          <ProfileView
            user={user}
            onBack={() => setViewState("tabs")}
            onUserUpdated={onUserUpdated}
            addToast={addToast}
          />
        )}

        {viewState === "notifications" && (
          <NotificationsView
            onBack={() => setViewState("tabs")}
            addToast={addToast}
          />
        )}

        {viewState === "tabs" && (
          <>
            {/* ── SE FOR ADMINISTRADOR: RENDERIZA AS TELAS REAIS ── */}
            {isAdmin ? (
              <>
                {activeTab === "Visão geral" && (
                  <AdminOverview
                    onNavigateToUsers={(filter) => {
                      setNoMentorUsersFilter(!!filter?.noMentor);
                      setActiveTab("Usuários");
                    }}
                  />
                )}

                {activeTab === "Usuários" && (
                  <AdminUsers
                    currentUser={user}
                    addToast={addToast}
                    initialNoMentorFilter={noMentorUsersFilter}
                  />
                )}

                {activeTab === "Avisos" && (
                  <AdminAnnouncements addToast={addToast} />
                )}

                {activeTab === "Permissões" && (
                  <AdminPermissions />
                )}
              </>
            ) : (
              /* ── SE FOR MENTOR: RENDERIZA AS TELAS REAIS DO MENTOR ── */
              <>
                {activeTab === "Painel" && (
                  <MentorOverview
                    onNavigateToStudents={() => setActiveTab("Meus alunos")}
                    onNavigateToAnnouncements={() => {
                      setMentorAnnouncementStudentId(null);
                      setActiveTab("Avisos");
                    }}
                    addToast={addToast}
                  />
                )}

                {activeTab === "Meus alunos" && (
                  <MentorStudents
                    onNavigateToAnnouncements={(studentId) => {
                      setMentorAnnouncementStudentId(studentId || null);
                      setActiveTab("Avisos");
                    }}
                    addToast={addToast}
                  />
                )}

                {activeTab === "Avisos" && (
                  <MentorAnnouncements
                    addToast={addToast}
                    initialSelectedStudentId={mentorAnnouncementStudentId}
                    onClearInitialStudent={() => setMentorAnnouncementStudentId(null)}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
