import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  getMentorStudents,
  getMentorStudentDetail,
  formatTaskCategory,
  formatTaskStatus,
  formatSeason,
  type MentorStudentSummary,
  type MentorStudentDetail,
  type MentorActivityStatus,
  type TaskStatus,
  type CompletionStatus,
} from "../../services/api";

interface MentorStudentsProps {
  onNavigateToAnnouncements: (studentId?: number) => void;
  addToast?: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
}

export default function MentorStudents({
  onNavigateToAnnouncements,
  addToast,
}: MentorStudentsProps) {
  const [students, setStudents] = useState<MentorStudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Detalhe do aluno selecionado
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentDetail, setStudentDetail] = useState<MentorStudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Busca lista de alunos
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMentorStudents(search);
      setStudents(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar estudantes orientados.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Carrega detalhe do aluno
  const handleOpenDetail = async (id: number) => {
    setSelectedStudentId(id);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const detail = await getMentorStudentDetail(id);
      setStudentDetail(detail);
    } catch (err: any) {
      setDetailError(err.message || "Erro ao carregar detalhes do aluno.");
      if (addToast) {
        addToast({
          type: "error",
          title: "Erro ao abrir aluno",
          message: err.message || "Não foi possível carregar os dados pedagógicos deste aluno.",
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedStudentId(null);
    setStudentDetail(null);
    setDetailError(null);
  };

  const getActivityBadge = (status: MentorActivityStatus) => {
    switch (status) {
      case "UP_TO_DATE":
        return {
          label: "Em dia",
          badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-400",
        };
      case "ATTENTION":
        return {
          label: "Atenção",
          badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          dot: "bg-amber-400",
        };
      case "INACTIVE":
      default:
        return {
          label: "Sem atividade",
          badge: "bg-slate-700/40 text-slate-400 border-slate-600/30",
          dot: "bg-slate-500",
        };
    }
  };

  const getStatusBadgeConfig = (status: TaskStatus) => {
    const s = String(status).toUpperCase();
    if (s === "COMPLETED") {
      return { label: "Concluída", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" };
    }
    if (s === "IN_PROGRESS") {
      return { label: "Em Andamento", bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", dot: "bg-indigo-400" };
    }
    if (s === "PARTIAL") {
      return { label: "Parcial", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" };
    }
    return { label: "Pendente", bg: "bg-slate-700/40 text-slate-400 border-slate-600/30", dot: "bg-slate-500" };
  };

  const getCompletionStatusBadge = (status: CompletionStatus) => {
    const s = String(status).toUpperCase();
    if (s === "COMPLETED") {
      return { label: "Concluída", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    }
    if (s === "PARTIAL") {
      return { label: "Parcial", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    }
    return { label: "Interrompida", bg: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Sem registros";
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

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "AL";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TELA DE DETALHE DO ALUNO
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedStudentId !== null) {
    if (loadingDetail) {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="h-10 w-48 bg-slate-800/60 rounded-xl animate-pulse" />
          <div className="h-32 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 animate-pulse" />
          <div className="h-64 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 animate-pulse" />
        </div>
      );
    }

    if (detailError || !studentDetail) {
      return (
        <div className="space-y-4 animate-fade-in">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 transition-all cursor-pointer font-medium"
          >
            ← Voltar à lista de alunos
          </button>
          <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-6 text-center space-y-3">
            <div className="text-2xl">⚠️</div>
            <h3 className="text-sm font-semibold text-rose-300">
              Não foi possível exibir os detalhes do aluno
            </h3>
            <p className="text-xs text-slate-400">{detailError}</p>
            <button
              onClick={() => handleOpenDetail(selectedStudentId)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-md"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    const badge = getActivityBadge(studentDetail.activityStatus);
    const maxDayMinutes = Math.max(60, ...studentDetail.dailyStudyMinutes.map((d) => d.minutes));

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Barra superior de navegação e privacidade */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer font-medium self-start"
          >
            ← Voltar à lista de alunos
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400">
            <span className="text-indigo-400">🔒</span>
            <span>Por privacidade, você vê o progresso, mas não o e-mail nem as anotações do aluno.</span>
          </div>
        </div>

        {/* Cabeçalho do Aluno */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/50">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300 flex-shrink-0 shadow-inner">
                {getInitials(studentDetail.name)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-semibold text-slate-100">
                    {studentDetail.name}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="font-mono">Nível {studentDetail.level}</span>
                  <span>•</span>
                  <span className="font-mono text-indigo-300">+{studentDetail.currentXp} XP</span>
                  <span>•</span>
                  <span>🔥 {studentDetail.streakDays} dias</span>
                  {studentDetail.frozenCount > 0 && (
                    <>
                      <span>•</span>
                      <span>🧊 {studentDetail.frozenCount} Frozen</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToAnnouncements(studentDetail.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer self-start sm:self-auto"
              style={{
                background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
                boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
              }}
            >
              <span>📢</span>
              <span>Enviar aviso a este aluno</span>
            </button>
          </div>

          {/* Cards de Métricas do Aluno */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
              <p className="text-[11px] text-slate-400">Últimos 7 dias</p>
              <p className="text-lg font-bold text-indigo-400 mt-1 font-mono">
                {(studentDetail.minutesLast7Days / 60).toFixed(1)}h
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{studentDetail.minutesLast7Days} minutos</p>
            </div>

            <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
              <p className="text-[11px] text-slate-400">Tarefas Feitas</p>
              <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                {studentDetail.tasksCompleted}/{studentDetail.tasksTotal}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{studentDetail.completionRate}% concluídas</p>
            </div>

            <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
              <p className="text-[11px] text-slate-400">Última Atividade</p>
              <p className="text-xs font-medium text-slate-200 mt-1.5 truncate">
                {formatDate(studentDetail.lastActivityAt)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Registro de tempo</p>
            </div>

            <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
              <p className="text-[11px] text-slate-400">Sessões Gravadas</p>
              <p className="text-lg font-bold text-cyan-400 mt-1 font-mono">
                {studentDetail.recentSessions.length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Últimas 10 listadas</p>
            </div>
          </div>
        </div>

        {/* Gráfico Semanal dos Últimos 7 Dias (com divs) */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>📊</span> Dedicação Diária (Últimos 7 Dias)
              </h2>
              <p className="text-xs text-slate-400">
                Minutos estudados pelo aluno em cada dia da última semana
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono self-start sm:self-auto">
              Total: <strong className="text-indigo-300 font-semibold">{studentDetail.minutesLast7Days} min</strong>
            </div>
          </div>

          <div className="flex items-end gap-2 sm:gap-3 h-36 sm:h-44 overflow-x-auto pb-1 pt-4">
            {studentDetail.dailyStudyMinutes.map((d) => {
              const heightPct = Math.max(4, Math.round((d.minutes / maxDayMinutes) * 100));
              const hours = (d.minutes / 60).toFixed(1);
              return (
                <div key={d.date} className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">
                    {d.minutes > 0 ? `${d.minutes}m` : "—"}
                  </span>
                  <div className="w-full flex items-end justify-center" style={{ height: "110px" }}>
                    <div
                      className="w-full max-w-[28px] rounded-t-lg bg-indigo-500/70 hover:bg-indigo-400 transition-all duration-300 cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                      title={`${d.dayOfWeek} (${d.date}): ${d.minutes} minutos (${hours}h)`}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-300">{d.dayOfWeek}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabela de Tarefas do Aluno (SEM descrição) */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>📝</span> Tarefas do Aluno ({studentDetail.tasks.length})
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhamento de status, categoria e datas de início e entrega
              </p>
            </div>
          </div>

          {studentDetail.tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma tarefa cadastrada pelo aluno ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/40 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Título</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Estação</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duração</th>
                    <th className="py-2.5 px-3">Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {studentDetail.tasks.map((task) => {
                    const statusCfg = getStatusBadgeConfig(task.status);
                    return (
                      <tr key={task.id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          {task.title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {formatTaskCategory(task.category)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {formatSeason(task.season)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusCfg.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <span className="text-indigo-300 font-semibold">{task.completedMinutes}m</span>
                          <span className="text-slate-500"> / {task.plannedMinutes}m</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {formatDateOnly(task.startDate)} → {formatDateOnly(task.endDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Últimas Sessões de Estudo (SEM notes) */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>⏱️</span> Últimas Sessões de Estudo
              </h2>
              <p className="text-xs text-slate-400">
                Histórico recente das últimas 10 sessões registradas no timer
              </p>
            </div>
          </div>

          {studentDetail.recentSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma sessão de estudo registrada até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studentDetail.recentSessions.map((session) => {
                const compBadge = getCompletionStatusBadge(session.completionStatus);
                return (
                  <div
                    key={session.id}
                    className="p-3 rounded-xl border border-slate-800/70 bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-mono text-slate-300 text-xs">
                        {formatDate(session.date)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Duração: <strong className="text-indigo-300 font-semibold">{session.durationMinutes} minutos</strong>
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${compBadge.bg}`}>
                      {compBadge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LISTA PRINCIPAL DE ALUNOS
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="heading-fluid-title font-semibold text-slate-100">Meus Alunos</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe a frequência, progresso e dedicação de cada estudante vinculado à sua mentoria
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono self-start sm:self-auto px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
          {students.length} {students.length === 1 ? "aluno vinculado" : "alunos vinculados"}
        </span>
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar aluno por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Legenda de Status de Atividade */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Em dia (&le; 3d)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Atenção (4-7d)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> Sem atividade (&gt; 7d)
          </span>
        </div>
      </div>

      {/* Conteúdo da Listagem */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-6 text-center space-y-3">
          <div className="text-2xl">⚠️</div>
          <h3 className="text-sm font-semibold text-rose-300">
            Erro ao carregar estudantes
          </h3>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={fetchStudents}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-md"
          >
            Tentar novamente
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-10 text-center space-y-2">
          <div className="text-2xl">👥</div>
          <h3 className="text-sm font-semibold text-slate-200">
            {search ? "Nenhum aluno encontrado para essa busca" : "Nenhum aluno vinculado ao seu perfil"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? "Tente buscar com outro termo ou limpe o campo de busca."
              : "Solicite ao administrador da plataforma para associar alunos ao seu usuário de mentor."}
          </p>
        </div>
      ) : (
        <>
          {/* Tabela no Desktop */}
          <div className="hidden md:block rounded-2xl border border-slate-800/60 bg-slate-900/40 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Estudante</th>
                  <th className="py-3 px-4">Nível / XP</th>
                  <th className="py-3 px-4">Sequência</th>
                  <th className="py-3 px-4">Tarefas</th>
                  <th className="py-3 px-4">Últimos 7 dias</th>
                  <th className="py-3 px-4">Status de Atividade</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => {
                  const badge = getActivityBadge(student.activityStatus);
                  const hours7 = (student.minutesLast7Days / 60).toFixed(1);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => handleOpenDetail(student.id)}
                      className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 flex-shrink-0 group-hover:border-indigo-400 transition-colors">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                              {student.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Último estudo: {formatDate(student.lastActivityAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="text-slate-200">Nível {student.level}</span>
                        <span className="text-slate-500"> · </span>
                        <span className="text-indigo-400">+{student.currentXp} XP</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="text-amber-400 font-semibold">
                          🔥 {student.streakDays}d
                        </span>
                        {student.frozenCount > 0 && (
                          <span className="text-cyan-400 ml-1.5 text-[11px]">
                            🧊 {student.frozenCount}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1 min-w-[100px]">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{student.tasksCompleted}/{student.tasksTotal}</span>
                            <span className="text-slate-400">{student.completionRate}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, student.completionRate)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="font-semibold text-indigo-300">{hours7}h</span>
                        <span className="text-slate-500 text-[11px]"> ({student.minutesLast7Days}m)</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-400 group-hover:text-indigo-300 font-medium">
                          <span>Ver detalhe</span>
                          <span>→</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cartões no Mobile */}
          <div className="md:hidden space-y-3">
            {students.map((student) => {
              const badge = getActivityBadge(student.activityStatus);
              const hours7 = (student.minutesLast7Days / 60).toFixed(1);

              return (
                <div
                  key={student.id}
                  onClick={() => handleOpenDetail(student.id)}
                  className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 space-y-3 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 flex-shrink-0">
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100 text-sm">{student.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Nível {student.level} · +{student.currentXp} XP
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${badge.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/60">
                    <div>
                      <span className="text-[11px] text-slate-500">Últimos 7 dias: </span>
                      <strong className="text-indigo-300 font-mono">{hours7}h ({student.minutesLast7Days}m)</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Sequência: </span>
                      <strong className="text-amber-400 font-mono">🔥 {student.streakDays}d</strong>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Tarefas: {student.tasksCompleted}/{student.tasksTotal}</span>
                      <span className="text-emerald-400 font-mono">{student.completionRate}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, student.completionRate)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-500 truncate">
                      Último estudo: {formatDate(student.lastActivityAt)}
                    </span>
                    <span className="text-indigo-400 font-medium flex-shrink-0">
                      Ver detalhes →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
