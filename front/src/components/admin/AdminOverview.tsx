import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminOverview,
  type AdminOverviewResponse,
  type AdminActionLogItem,
} from "../../services/api";

interface AdminOverviewProps {
  onNavigateToUsers: (filter?: { noMentor?: boolean }) => void;
}

export default function AdminOverview({ onNavigateToUsers }: AdminOverviewProps) {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados da visão geral administrativa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const formatMinutes = (minutes?: number) => {
    if (!minutes || minutes <= 0) return "0h 00m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE_USER":
        return { label: "Novo Usuário", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
      case "UPDATE_ROLE":
        return { label: "Alteração de Papel", bg: "bg-violet-500/15 text-violet-400 border-violet-500/30" };
      case "UPDATE_STATUS":
        return { label: "Status de Conta", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      case "ASSIGN_MENTOR":
        return { label: "Vínculo de Mentor", bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
      case "SEND_ANNOUNCEMENT":
        return { label: "Aviso Publicado", bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" };
      default:
        return { label: action, bg: "bg-slate-700/30 text-slate-400 border-slate-700/50" };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400">Carregando métricas da instituição...</p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
        <p className="text-sm text-red-400">{error || "Não foi possível carregar os dados."}</p>
        <button
          onClick={fetchOverview}
          className="mt-3 px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-red-600 hover:bg-red-500 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const totalUsers = overview.studentsCount + overview.mentorsCount + overview.adminsCount;
  const taskPct = overview.totalTasks > 0 ? Math.round((overview.completedTasks / overview.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="heading-fluid-title font-semibold text-slate-100">Visão Geral</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de engajamento, distribuição de perfis e auditoria institucional
          </p>
        </div>
        <button
          onClick={fetchOverview}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-700/70 bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          title="Recarregar métricas"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Atualizar</span>
        </button>
      </div>

      {/* Grid de Cartões de Estatística */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Distribuição de Usuários */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800/50">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total de Usuários</span>
            <span className="text-xl font-bold text-slate-100">{totalUsers}</span>
          </div>
          <div className="mt-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Estudantes
              </span>
              <span className="font-semibold text-indigo-300">{overview.studentsCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Mentores / Professores
              </span>
              <span className="font-semibold text-cyan-300">{overview.mentorsCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                Administradores
              </span>
              <span className="font-semibold text-violet-300">{overview.adminsCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Status das Contas */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800/50">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Status das Contas</span>
            <span className="text-xl font-bold text-slate-100">{overview.activeUsersCount} <span className="text-xs font-normal text-slate-400">ativas</span></span>
          </div>
          <div className="mt-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Contas Ativas
              </span>
              <span className="font-semibold text-emerald-400">{overview.activeUsersCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Contas Desativadas
              </span>
              <span className="font-semibold text-slate-400">{overview.inactiveUsersCount}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${totalUsers > 0 ? (overview.activeUsersCount / totalUsers) * 100 : 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Estudantes Sem Mentor (Ação Rápida) */}
        <div
          onClick={() => onNavigateToUsers({ noMentor: true })}
          className={`rounded-2xl border p-5 shadow-sm transition-all cursor-pointer group ${
            overview.studentsWithoutMentorCount > 0
              ? "border-amber-500/40 bg-amber-950/15 hover:border-amber-500/70 hover:bg-amber-950/25"
              : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700"
          }`}
          title="Clique para filtrar estudantes sem mentor na aba Usuários"
        >
          <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800/50">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-400/90">Atenção Pedagógica</span>
            <span className="text-xs font-medium text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Ver lista →
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{overview.studentsWithoutMentorCount}</span>
              <span className="text-xs text-slate-400">estudantes sem mentor</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {overview.studentsWithoutMentorCount > 0
                ? "Existem estudantes aguardando atribuição de professor/mentor responsável."
                : "Todos os estudantes ativos já estão acompanhados por um mentor."}
            </p>
          </div>
        </div>

        {/* Card 4: Tarefas Concluídas */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800/50">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Metas & Tarefas</span>
            <span className="text-xs font-bold text-indigo-400">{taskPct}% concluídas</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{overview.completedTasks}</span>
              <span className="text-xs text-slate-400">de {overview.totalTasks} tarefas cadastradas</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                style={{ width: `${taskPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Horas de Estudo */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800/50">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Tempo de Estudo</span>
            <span className="text-base">⏱️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100">{formatMinutes(overview.totalStudyMinutes)}</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Soma total de horas registradas pelos alunos nas tarefas dos cronogramas.
            </p>
          </div>
        </div>

        {/* Card 6: Avisos Enviados */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800/50">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Comunicação</span>
            <span className="text-base">📢</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{overview.totalAnnouncements}</span>
              <span className="text-xs text-slate-400">avisos emitidos</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Comunicados gerais e direcionados enviados para as turmas na plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Cartão de Auditoria: Atividade Recente */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Atividade Recente</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro das últimas 8 ações administrativas de governança e segurança
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Auditoria</span>
        </div>

        <div className="mt-4">
          {overview.recentActions && overview.recentActions.length > 0 ? (
            <div className="divide-y divide-slate-800/50">
              {overview.recentActions.map((item) => {
                const badge = getActionBadge(item.action);
                return (
                  <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          por <strong className="text-slate-200 font-medium">{item.actorName}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.details}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap self-start sm:self-center">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma ação administrativa registrada até o momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
