import React, { useState, useEffect, useCallback } from "react";
import {
  getMentorOverview,
  type MentorOverviewResponse,
} from "../../services/api";

interface MentorOverviewProps {
  onNavigateToStudents: () => void;
  onNavigateToAnnouncements: () => void;
  addToast?: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
}

export default function MentorOverview({
  onNavigateToStudents,
  onNavigateToAnnouncements,
}: MentorOverviewProps) {
  const [data, setData] = useState<MentorOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMentorOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar o resumo pedagógico do mentor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-64 bg-slate-800/60 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-6 text-center space-y-3">
        <div className="text-2xl">⚠️</div>
        <h3 className="text-sm font-semibold text-rose-300">
          Não foi possível carregar o painel do mentor
        </h3>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const completionRate =
    data.totalTasks > 0
      ? Math.round((data.completedTasks / data.totalTasks) * 100)
      : 0;

  const statCards = [
    {
      label: "Alunos Vinculados",
      value: String(data.totalStudents),
      icon: "👥",
      sub: data.totalStudents === 1 ? "1 orientando ativo" : `${data.totalStudents} orientandos ativos`,
      color: "text-indigo-400",
      border: "hover:border-indigo-500/40",
    },
    {
      label: "Horas de Estudo",
      value: `${data.totalStudyHours.toFixed(1)}h`,
      icon: "⏱️",
      sub: "Dedicação acumulada",
      color: "text-cyan-400",
      border: "hover:border-cyan-500/40",
    },
    {
      label: "Tarefas Concluídas",
      value: `${data.completedTasks}/${data.totalTasks}`,
      icon: "✅",
      sub: `${completionRate}% de taxa de entrega`,
      color: "text-emerald-400",
      border: "hover:border-emerald-500/40",
    },
    {
      label: "Média de XP",
      value: `+${Math.round(data.averageXp)}`,
      icon: "✨",
      sub: "Pontuação por aluno",
      color: "text-amber-400",
      border: "hover:border-amber-500/40",
    },
    {
      label: "Sem Atividade",
      value: String(data.inactiveStudents),
      icon: "⚠️",
      sub: data.inactiveStudents === 0 ? "Todos ativos nos últimos 7 dias" : "Sem registros nos últimos 7 dias",
      color: data.inactiveStudents > 0 ? "text-rose-400" : "text-slate-400",
      border: data.inactiveStudents > 0 ? "hover:border-rose-500/40" : "hover:border-slate-700",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="heading-fluid-title font-semibold text-slate-100">Painel do Mentor</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão consolidada do progresso, horas dedicadas e ritmo de estudo dos seus estudantes orientados
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onNavigateToStudents}
            className="px-3 py-1.5 rounded-xl border border-slate-700/70 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-200 transition-all font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <span>👥</span>
            <span>Ver Alunos</span>
          </button>
          <button
            onClick={onNavigateToAnnouncements}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
              boxShadow: "0 2px 10px rgba(99,102,241,0.25)",
            }}
          >
            <span>📢</span>
            <span>Novo Aviso</span>
          </button>
        </div>
      </div>

      {/* Se não houver alunos orientados */}
      {data.totalStudents === 0 ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-10 sm:p-14 text-center shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl shadow-inner shadow-cyan-500/5 mb-4">
            👥
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-200">
            Nenhum aluno vinculado ainda
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1.5 leading-relaxed">
            Peça ao administrador para vincular alunos ao seu perfil para começar a acompanhar o desempenho da sua turma.
          </p>
        </div>
      ) : (
        <>
          {/* Cartões de Indicadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {statCards.map((s) => (
              <div
                key={s.label}
                className={`rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 transition-all ${s.border} shadow-sm`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="leading-relaxed">{s.label}</span>
                  <span className="text-base">{s.icon}</span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold mt-2 ${s.color}`}>
                  {s.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Destaques da Semana (Top 3 Alunos) */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Destaques da Semana
                  </h2>
                  <p className="text-xs text-slate-400">
                    Estudantes com maior dedicação e tempo registrado nos últimos 7 dias
                  </p>
                </div>
              </div>
              <button
                onClick={onNavigateToStudents}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium self-start sm:self-auto transition-colors cursor-pointer"
              >
                Ver todos os alunos →
              </button>
            </div>

            {data.topStudents.length === 0 || data.topStudents.every((s) => s.minutesLast7Days === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhum aluno registrou sessões de estudo nos últimos 7 dias.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.topStudents.map((student, idx) => {
                  const rankMedals = ["🥇 1º", "🥈 2º", "🥉 3º"];
                  const rankBorders = [
                    "border-amber-500/30 bg-amber-500/5",
                    "border-slate-500/30 bg-slate-500/5",
                    "border-amber-700/30 bg-amber-700/5",
                  ];
                  const rankColors = [
                    "text-amber-400",
                    "text-slate-300",
                    "text-amber-600",
                  ];

                  const hours = (student.minutesLast7Days / 60).toFixed(1);

                  const initials = student.name
                    ? student.name
                        .split(" ")
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "AL";

                  return (
                    <div
                      key={student.id}
                      className={`rounded-xl border p-4 transition-all hover:border-slate-700 ${rankBorders[idx] || "border-slate-800 bg-slate-950/40"}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/60 ${rankColors[idx] || "text-slate-400"}`}
                        >
                          {rankMedals[idx] || `${idx + 1}º`}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Nível {student.level}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-100 truncate">
                            {student.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            +{student.currentXp} XP acumulado
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Tempo dedicado:</span>
                        <span className="font-semibold text-indigo-300 font-mono">
                          {hours}h ({student.minutesLast7Days} min)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
