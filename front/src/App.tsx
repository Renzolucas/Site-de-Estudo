import { useState, useEffect, useCallback, useMemo } from "react";
import api, {
  getTasks,
  getTasksBySeason,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  logTime,
  getUserProfile,
  getUserStats,
  getTimeLogsByUser,
  checkApiHealth,
  logout,
  getMe,
  getStoredUser,
  setStoredUser,
  isAuthenticated,
  onUnauthorized,
  DEFAULT_USER_ID,
  type TaskResponse,
  type UserProfileResponse,
  type StudyStatsResponse,
  type TimeLogResponse,
  type Season,
} from "./services/api";
import AuthPage from "./components/AuthPage";

// ── Types ──────────────────────────────────────────────────────────────────

type TaskStatus = "completed" | "partial" | "in-progress" | "pending";
type NavTab = "Dashboard" | "Performance" | "Badges" | "Roadmap";

interface MacroTask {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
  expanded: boolean;
  notes: string;
  category?: string;
  plannedMinutes?: number;
  actualMinutes?: number;
  xpReward?: number;
}

interface RoadmapQuarter {
  id: number;
  season: string;
  seasonKey: Season;
  quarter: string;
  icon: string;
  subtitle: string;
  goal: string;
  accentColor: string;
  glowColor: string;
  tasks: MacroTask[];
}

interface Task {
  id: number;
  category: string;
  categoryColor: string;
  title: string;
  subtitle: string;
  plannedTime: string;
  actualTime: string | null;
  status: TaskStatus;
  timeStart: string;
  timeEnd: string;
  xpReward: number;
  targetDate?: string;
}

interface Badge {
  id: number;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface NotificationToast {
  id: number;
  type: "success" | "info" | "xp" | "error";
  title: string;
  message: string;
  xp?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const formatMinutesToHm = (minutes: number | null | undefined): string => {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (h > 0) return `${h}h 00m`;
  return `${m}m`;
};

const parseTimeToMinutes = (s: string): number => {
  if (!s) return 0;
  const hm = s.match(/(\d+)h\s*(\d+)m/);
  const hOnly = s.match(/(\d+)h/);
  const mOnly = s.match(/(\d+)m/);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  if (hOnly) return parseInt(hOnly[1], 10) * 60;
  if (mOnly) return parseInt(mOnly[1], 10);
  return 0;
};

const mapCategoryColor = (cat: string = ""): string => {
  const c = cat.toUpperCase();
  if (c.includes("JAVA") || c.includes("BACKEND")) return "#6366F1";
  if (c.includes("FRONTEND") || c.includes("REACT")) return "#06B6D4";
  if (c.includes("EXERCISE") || c.includes("WORKOUT")) return "#10B981";
  if (c.includes("ENGLISH")) return "#F97316";
  if (c.includes("DATABASE") || c.includes("SYSTEM")) return "#8B5CF6";
  if (c.includes("LEETCODE") || c.includes("ALGO")) return "#EC4899";
  if (c.includes("DEVOPS") || c.includes("CLOUD")) return "#3B82F6";
  return "#A855F7";
};

const mapBackendTaskToDashboard = (t: TaskResponse, index: number): Task => {
  const startHours = [8, 10, 11, 14, 16, 17];
  const startH = startHours[index % startHours.length];
  const durH = Math.max(1, Math.round((t.plannedDurationMinutes || 60) / 60));
  const endH = Math.min(23, startH + durH);

  const startStr = `${String(startH).padStart(2, "0")}:00`;
  const endStr = `${String(endH).padStart(2, "0")}:00`;

  let status: TaskStatus = "pending";
  if (t.status === "COMPLETED") status = "completed";
  else if (t.status === "PARTIAL") status = "partial";
  else if (t.status === "IN_PROGRESS") status = "in-progress";

  return {
    id: t.id,
    category: (t.category || "OTHER").replace(/_/g, " "),
    categoryColor: mapCategoryColor(t.category),
    title: t.title,
    subtitle: t.description || `Roadmap · ${t.season || "Geral"}`,
    plannedTime: formatMinutesToHm(t.plannedDurationMinutes),
    actualTime: t.actualDurationMinutes ? formatMinutesToHm(t.actualDurationMinutes) : null,
    status,
    timeStart: startStr,
    timeEnd: endStr,
    xpReward: t.xpReward || 80,
    targetDate: t.targetDate,
  };
};

const getLevelTitle = (level: number): string => {
  if (level <= 1) return "Novice";
  if (level <= 3) return "Apprentice";
  if (level <= 5) return "Scholar";
  if (level <= 8) return "Master";
  if (level <= 12) return "Grandmaster";
  return "Legend";
};

// ── Seasonal Default Setup (Estrutura 100% dinâmica sem dados falsos) ───────

const DEFAULT_SEASON_QUARTERS: RoadmapQuarter[] = [
  {
    id: 1,
    season: "Summer",
    seasonKey: "SUMMER",
    quarter: "Q1",
    icon: "☀️",
    subtitle: "Estação de Verão",
    goal: "Defina seus objetivos principais para a estação de Verão.",
    accentColor: "#F97316",
    glowColor: "rgba(249,115,22,0.15)",
    tasks: [],
  },
  {
    id: 2,
    season: "Autumn",
    seasonKey: "AUTUMN",
    quarter: "Q2",
    icon: "🍂",
    subtitle: "Estação de Outono",
    goal: "Defina seus objetivos principais para a estação de Outono.",
    accentColor: "#10B981",
    glowColor: "rgba(16,185,129,0.12)",
    tasks: [],
  },
  {
    id: 3,
    season: "Winter",
    seasonKey: "WINTER",
    quarter: "Q3",
    icon: "❄️",
    subtitle: "Estação de Inverno",
    goal: "Defina seus objetivos principais para a estação de Inverno.",
    accentColor: "#6366F1",
    glowColor: "rgba(99,102,241,0.12)",
    tasks: [],
  },
  {
    id: 4,
    season: "Spring",
    seasonKey: "SPRING",
    quarter: "Q4",
    icon: "🌸",
    subtitle: "Estação de Primavera",
    goal: "Defina seus objetivos principais para a estação de Primavera.",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139,92,246,0.12)",
    tasks: [],
  },
];

// ── Conquistas / Badges Calculados Dinamicamente dos Dados Reais da API ────

const calculateDynamicBadges = (
  user: UserProfileResponse | null,
  tasks: Task[],
  totalStudyMinutes: number
): Badge[] => {
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const streak = user?.streakDays || 0;
  const currentXp = user?.currentXp || 0;
  const level = user?.level || 1;
  const totalTasks = tasks.length;
  const studyHours = Math.floor(totalStudyMinutes / 60);

  return [
    {
      id: 1,
      icon: "🎯",
      name: "Primeiro Passo",
      description: "Conclua sua primeira tarefa no StudyOS",
      unlocked: completedTasks >= 1,
      progress: Math.min(completedTasks, 1),
      total: 1,
    },
    {
      id: 2,
      icon: "🔥",
      name: "Guerreiro do Streak",
      description: "Mantenha uma sequência de 7 dias de estudo",
      unlocked: streak >= 7,
      progress: Math.min(streak, 7),
      total: 7,
    },
    {
      id: 3,
      icon: "💯",
      name: "Dia Perfeito",
      description: "Complete todas as tarefas planejadas para o dia",
      unlocked: totalTasks > 0 && completedTasks === totalTasks,
      progress: totalTasks > 0 && completedTasks === totalTasks ? 1 : 0,
      total: 1,
    },
    {
      id: 4,
      icon: "⚡",
      name: "Produtividade 5+",
      description: "Conclua pelo menos 5 tarefas no sistema",
      unlocked: completedTasks >= 5,
      progress: Math.min(completedTasks, 5),
      total: 5,
    },
    {
      id: 5,
      icon: "🏆",
      name: "Clube das 100 Horas",
      description: "Registre 100 horas de estudo no sistema",
      unlocked: studyHours >= 100,
      progress: Math.min(studyHours, 100),
      total: 100,
    },
    {
      id: 6,
      icon: "🎓",
      name: "Mestre dos Níveis",
      description: "Alcance o Nível 5 na sua jornada de estudos",
      unlocked: level >= 5,
      progress: Math.min(level, 5),
      total: 5,
    },
    {
      id: 7,
      icon: "⭐",
      name: "Acumulador de XP",
      description: "Acumule mais de 1.000 pontos de XP",
      unlocked: currentXp >= 1000,
      progress: Math.min(currentXp, 1000),
      total: 1000,
    },
    {
      id: 8,
      icon: "🗺️",
      name: "Estrategista de Roadmap",
      description: "Cadastre 10 ou mais tarefas no Roadmap Anual",
      unlocked: totalTasks >= 10,
      progress: Math.min(totalTasks, 10),
      total: 10,
    },
  ];
};

// ── Components ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const config = {
    completed: { label: "Completed", bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
    partial: { label: "Partial", bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
    "in-progress": { label: "In Progress", bg: "bg-indigo-500/15", text: "text-indigo-400", dot: "bg-indigo-400" },
    pending: { label: "Pending", bg: "bg-slate-700/40", text: "text-slate-400", dot: "bg-slate-500" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const XPBar = ({ current, max }: { current: number; max: number }) => {
  const pct = Math.min(Math.max(Math.round((current / max) * 100), 0), 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{current}/{max} XP</span>
      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ── Time Log Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  task: Task;
  userXp: number;
  userLevel: number;
  userId: number;
  onClose: () => void;
  onTimeLogged: (taskId: number, minutes: number, status: string, notes: string, updatedUser: UserProfileResponse | null) => void;
}

const TimeLogModal = ({ task, userXp, userLevel, userId, onClose, onTimeLogged }: ModalProps) => {
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [completionStatus, setCompletionStatus] = useState<"complete" | "partial" | "interrupted">("complete");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const plannedMins = parseTimeToMinutes(task.plannedTime);
  const actualMins = hours * 60 + minutes;
  const hasActual = actualMins > 0;

  const efficiencyPct = plannedMins > 0 && hasActual
    ? Math.min(Math.round((actualMins / plannedMins) * 100), 140)
    : 0;
  const overran = hasActual && actualMins > plannedMins;
  const underPct = plannedMins > 0 && hasActual ? Math.min(actualMins / plannedMins, 1) * 100 : 0;

  const xpMultiplier = completionStatus === "complete" ? 1 : completionStatus === "partial" ? 0.6 : 0.25;
  const xpEarned = Math.round(task.xpReward * xpMultiplier);

  const levelProgress = userXp % 500;
  const nextLevelProgress = (levelProgress + xpEarned);

  const handleSave = async () => {
    if (actualMins <= 0) {
      setErrorMessage("Por favor, selecione pelo menos 5 minutos.");
      return;
    }

    setPhase("saving");
    setErrorMessage("");

    try {
      // Chamada oficial à API REST do Spring Boot com o userId autenticado
      const response = await logTime(task.id, {
        actualMinutes: actualMins,
        completionStatus: completionStatus === "complete" ? "COMPLETED" : completionStatus === "partial" ? "PARTIAL" : "INTERRUPTED",
        notes,
      }, userId);

      setPhase("done");
      setTimeout(() => {
        onTimeLogged(task.id, actualMins, completionStatus, notes, response?.user || null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.warn("Backend request failed, falling back to local optimistic state:", err);
      setPhase("done");
      setTimeout(() => {
        onTimeLogged(task.id, actualMins, completionStatus, notes, null);
        onClose();
      }, 1200);
    }
  };

  const statusOptions = [
    {
      key: "complete" as const,
      label: "Complete",
      sub: "All objectives done",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ),
      active: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-900/30",
      inactive: "border-slate-700/50 text-slate-500",
    },
    {
      key: "partial" as const,
      label: "Partial",
      sub: "Some progress made",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" opacity=".4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      active: "border-amber-500/60 bg-amber-500/10 text-amber-400 shadow-sm shadow-amber-900/30",
      inactive: "border-slate-700/50 text-slate-500",
    },
    {
      key: "interrupted" as const,
      label: "Interrupted",
      sub: "Session cut short",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      ),
      active: "border-red-500/60 bg-red-500/10 text-red-400 shadow-sm shadow-red-900/30",
      inactive: "border-slate-700/50 text-slate-500",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,8,16,0.88)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && phase === "idle" && onClose()}
    >
      <div
        className="w-full max-w-[460px] rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #161923 0%, #111520 100%)",
          borderColor: "rgba(99,102,241,0.18)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)",
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5">
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${task.categoryColor}60, transparent)` }}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: task.categoryColor + "20", color: task.categoryColor }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: task.categoryColor }}
                  />
                  {task.category}
                </span>
                <span className="text-xs text-slate-600 font-mono">{task.timeStart}–{task.timeEnd}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 leading-snug">{task.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{task.subtitle}</p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="mx-6 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
        />

        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)]">
          {/* Duration Comparison */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Duration</label>
              {hasActual && (
                <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full ${
                  overran ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {overran
                    ? `+${actualMins - plannedMins}m over`
                    : plannedMins - actualMins === 0 ? "On target" : `${plannedMins - actualMins}m under`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
                <p className="text-xs text-slate-600 mb-2 flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  Planned
                </p>
                <p className="font-mono text-xl font-semibold text-slate-300">{task.plannedTime}</p>
                <p className="text-xs text-slate-700 mt-1">target</p>
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3">
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  Actual
                </p>
                <div className="flex items-end gap-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <button onClick={() => setHours(Math.min(23, hours + 1))}
                      className="text-slate-600 hover:text-indigo-400 text-xs transition-colors px-1">▲</button>
                    <span className="font-mono text-xl font-semibold text-slate-100 w-7 text-center">
                      {String(hours).padStart(2, "0")}
                    </span>
                    <button onClick={() => setHours(Math.max(0, hours - 1))}
                      className="text-slate-600 hover:text-indigo-400 text-xs transition-colors px-1">▼</button>
                  </div>
                  <span className="font-mono text-lg text-slate-500 mb-0.5">h</span>
                  <div className="w-2" />
                  <div className="flex flex-col items-center gap-0.5">
                    <button onClick={() => setMinutes(Math.min(55, minutes + 5))}
                      className="text-slate-600 hover:text-indigo-400 text-xs transition-colors px-1">▲</button>
                    <span className="font-mono text-xl font-semibold text-slate-100 w-7 text-center">
                      {String(minutes).padStart(2, "0")}
                    </span>
                    <button onClick={() => setMinutes(Math.max(0, minutes - 5))}
                      className="text-slate-600 hover:text-indigo-400 text-xs transition-colors px-1">▼</button>
                  </div>
                  <span className="font-mono text-lg text-slate-500 mb-0.5">m</span>
                </div>
              </div>
            </div>

            {hasActual && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                  <span>0m</span>
                  <span className="text-slate-500">
                    {efficiencyPct}% of planned time used
                  </span>
                  <span>{task.plannedTime}</span>
                </div>
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(underPct, 100)}%`,
                      background: overran
                        ? "linear-gradient(90deg, #6366F1, #ef4444)"
                        : "linear-gradient(90deg, #6366F1, #10B981)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Completion Status */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-3">
              Completion Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((opt) => {
                const isActive = completionStatus === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setCompletionStatus(opt.key)}
                    className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border text-xs font-medium transition-all ${
                      isActive ? opt.active : `${opt.inactive} hover:border-slate-600 hover:text-slate-400`
                    }`}
                  >
                    <span className={isActive ? "" : "text-slate-600"}>{opt.icon}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className={`text-center leading-tight ${isActive ? "opacity-70" : "text-slate-700"}`} style={{ fontSize: "10px" }}>
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Notes &amp; Interruptions
              </label>
              <span className="text-xs text-slate-700 font-mono">{notes.length}/400</span>
            </div>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 400))}
                placeholder="What happened during this session? Any blockers, interruptions, or observations worth noting…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed resize-none transition-all"
                style={{
                  background: "rgba(15,18,28,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#cbd5e1",
                  outline: "none",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Meeting ran over", "Lost focus", "Technical issues", "Sprint completed"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setNotes((n) => (n ? `${n} ${chip}.` : `${chip}.`))}
                    className="text-xs px-2 py-1 rounded-md text-slate-600 border border-slate-800 hover:border-slate-600 hover:text-slate-400 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* XP Preview */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)",
              border: "1px solid rgba(99,102,241,0.18)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-sm">⚡</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-300">XP Reward</p>
                  <p className="text-xs text-slate-600">
                    {completionStatus === "complete" ? "Full reward (100%)" : completionStatus === "partial" ? "Partial (60%)" : "Interrupted (25%)"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-mono text-indigo-400">+{xpEarned} XP</p>
                <p className="text-xs text-slate-600">{userXp} → {userXp + xpEarned} XP</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Level {userLevel}</span>
                <span>{nextLevelProgress}/500 XP</span>
                <span>Level {userLevel + Math.floor(nextLevelProgress / 500)}</span>
              </div>
              <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${Math.min((nextLevelProgress / 500) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 p-2 rounded-lg text-center">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Footer / Save */}
        <div className="px-6 pb-6 pt-2">
          <div
            className="h-px mb-4"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }}
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={phase !== "idle"}
              type="button"
              className={`flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all overflow-hidden ${
                phase === "done"
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : phase === "saving"
                  ? "bg-indigo-600/50 text-indigo-300 cursor-not-allowed"
                  : "text-white"
              }`}
              style={phase === "idle" ? {
                background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              } : {}}
            >
              {phase === "idle" && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Save &amp; Claim XP
                </>
              )}
              {phase === "saving" && (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Enviando para API…
                </span>
              )}
              {phase === "done" && (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  +{xpEarned} XP Claimed!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Task Card ──────────────────────────────────────────────────────────────

const TaskCard = ({ task, onLog }: { task: Task; onLog: (t: Task) => void }) => {
  return (
    <div
      className={`group relative rounded-2xl border p-4 transition-all hover:border-slate-600/60 hover:shadow-lg hover:shadow-black/20 ${
        task.status === "completed"
          ? "border-emerald-900/40 bg-emerald-950/20"
          : task.status === "in-progress"
          ? "border-indigo-800/40 bg-indigo-950/20"
          : "border-slate-800/60 bg-slate-900/40"
      }`}
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: task.categoryColor }}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-slate-500">{task.timeStart}–{task.timeEnd}</span>
              <span className="text-slate-700">·</span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ background: task.categoryColor + "20", color: task.categoryColor }}
              >
                {task.category}
              </span>
            </div>

            <h3 className={`font-semibold text-sm leading-snug mb-0.5 ${task.status === "completed" ? "text-slate-400 line-through decoration-slate-600" : "text-slate-100"}`}>
              {task.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">{task.subtitle}</p>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <StatusBadge status={task.status} />
            <span className="text-xs text-indigo-400 font-mono">+{task.xpReward} XP</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span className="text-slate-500">Planned</span>
              <span className="font-mono text-slate-300">{task.plannedTime}</span>
            </div>
            {task.actualTime && (
              <>
                <span className="text-slate-700">vs</span>
                <div className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  <span className="text-slate-500">Actual</span>
                  <span className="font-mono text-emerald-400">{task.actualTime}</span>
                </div>
              </>
            )}
          </div>

          {task.status !== "completed" && (
            <button
              onClick={() => onLog(task)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-700/60 hover:border-indigo-500 transition-all cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              Log Time
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Badge Card ─────────────────────────────────────────────────────────────

const BadgeCard = ({ badge }: { badge: Badge }) => (
  <div
    className={`rounded-2xl border p-4 flex flex-col items-center text-center gap-2 transition-all ${
      badge.unlocked
        ? "border-indigo-800/50 bg-indigo-950/30 hover:border-indigo-600/50 hover:shadow-lg hover:shadow-indigo-950/40"
        : "border-slate-800/40 bg-slate-900/20 opacity-60"
    }`}
  >
    <div
      className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl ${
        badge.unlocked ? "bg-indigo-500/15" : "bg-slate-800/60 grayscale"
      }`}
    >
      {badge.unlocked ? badge.icon : "🔒"}
    </div>
    <div>
      <p className={`text-sm font-semibold ${badge.unlocked ? "text-slate-100" : "text-slate-500"}`}>{badge.name}</p>
      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{badge.description}</p>
    </div>
    {!badge.unlocked && badge.progress !== undefined && badge.total !== undefined && badge.total > 0 && (
      <div className="w-full mt-1">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{badge.progress}/{badge.total}</span>
          <span>{Math.round((badge.progress / badge.total) * 100)}%</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600/50 rounded-full"
            style={{ width: `${(badge.progress / badge.total) * 100}%` }}
          />
        </div>
      </div>
    )}
    {badge.unlocked && (
      <span className="text-xs text-indigo-400 font-medium">✓ Desbloqueado</span>
    )}
  </div>
);

// ── Performance View (Totalmente Dinâmico a partir dos Dados Reais da API) ──

interface PerformanceViewProps {
  user: UserProfileResponse;
  tasks: Task[];
  timeLogs: TimeLogResponse[];
  userStats: StudyStatsResponse | null;
}

const PerformanceView = ({ user, tasks, timeLogs, userStats }: PerformanceViewProps) => {
  // Cálculo dinâmico dos dados semanais
  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  
  // Calcular horas planejadas e reais por dia com base nos dados do usuário
  const weekData = useMemo(() => {
    // Inicializa os 7 dias com 0
    const dayStats = weekDays.map((day) => ({ day, planned: 0, actual: 0 }));

    // Computa tarefas planejadas da semana se possuírem targetDate
    tasks.forEach((t) => {
      const plannedH = parseTimeToMinutes(t.plannedTime) / 60;
      const actualH = t.actualTime ? parseTimeToMinutes(t.actualTime) / 60 : 0;
      
      if (t.targetDate) {
        try {
          const date = new Date(t.targetDate + "T00:00:00");
          const dayIndex = (date.getDay() + 6) % 7; // Ajusta para 0 = Segunda
          if (dayIndex >= 0 && dayIndex < 7) {
            dayStats[dayIndex].planned += plannedH;
            dayStats[dayIndex].actual += actualH;
          }
        } catch {
          // fallback
        }
      }
    });

    // Adiciona minutos registrados via timeLogs
    timeLogs.forEach((log) => {
      if (log.createdAt) {
        try {
          const date = new Date(log.createdAt);
          const dayIndex = (date.getDay() + 6) % 7;
          if (dayIndex >= 0 && dayIndex < 7) {
            dayStats[dayIndex].actual += (log.loggedDurationMinutes || 0) / 60;
          }
        } catch {
          // fallback
        }
      }
    });

    // Formata os números com 1 casa decimal
    return dayStats.map(d => ({
      day: d.day,
      planned: Math.round(d.planned * 10) / 10,
      actual: Math.round(d.actual * 10) / 10,
    }));
  }, [tasks, timeLogs]);

  const maxH = Math.max(4, ...weekData.map(d => Math.max(d.planned, d.actual)));
  const totalStudyMinutes = userStats?.totalStudyMinutes ?? timeLogs.reduce((acc, l) => acc + (l.loggedDurationMinutes || 0), 0);
  const totalHoursWeekly = weekData.reduce((acc, d) => acc + d.actual, 0);

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const focusScore = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  const stats = [
    {
      label: "Horas Estudadas (Semana)",
      value: `${totalHoursWeekly.toFixed(1)}h`,
      sub: totalStudyMinutes > 0 ? `${(totalStudyMinutes / 60).toFixed(1)}h acumuladas` : "Sem registros no período",
      color: "text-indigo-400",
    },
    {
      label: "Taxa de Conclusão",
      value: `${completionRate}%`,
      sub: `${completedCount} de ${totalCount} tarefas feitas`,
      color: "text-emerald-400",
    },
    {
      label: "Índice de Foco",
      value: `${focusScore}`,
      sub: "Consistência de estudo",
      color: "text-amber-400",
    },
    {
      label: "XP Total Acumulado",
      value: `+${user.currentXp || 0}`,
      sub: `Nível ${user.level || 1} · ${getLevelTitle(user.level || 1)}`,
      color: "text-violet-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-500 leading-relaxed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Horas Semanais de Estudo</h3>
            <p className="text-xs text-slate-500">Comparativo: Horas Planejadas vs Horas Executadas por dia</p>
          </div>
          {totalHoursWeekly === 0 && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-500 border border-slate-700/40">
              Sem sessões registradas nesta semana
            </span>
          )}
        </div>

        <div className="flex items-end gap-3 h-40">
          {weekData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center gap-1" style={{ height: "120px" }}>
                <div
                  className="flex-1 rounded-t-md bg-slate-700/50 transition-all"
                  style={{ height: `${Math.max(2, (d.planned / maxH) * 120)}px` }}
                  title={`Planejado: ${d.planned}h`}
                />
                <div
                  className="flex-1 rounded-t-md bg-indigo-500/70 transition-all"
                  style={{ height: `${Math.max(2, (d.actual / maxH) * 120)}px` }}
                  title={`Realizado: ${d.actual}h`}
                />
              </div>
              <span className="text-xs text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-700/50" /><span className="text-xs text-slate-500">Planejado</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-500/70" /><span className="text-xs text-slate-500">Realizado</span></div>
        </div>
      </div>
    </div>
  );
};

// ── Roadmap Icons ──────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// ── Add-Task Modal ─────────────────────────────────────────────────────────

interface AddTaskModalProps {
  quarters: RoadmapQuarter[];
  defaultQuarterId?: number;
  onAdd: (quarterId: number, title: string, dueDate: string, category?: string, plannedMinutes?: number) => Promise<void>;
  onClose: () => void;
}

const AddTaskModal = ({ quarters, defaultQuarterId, onAdd, onClose }: AddTaskModalProps) => {
  const [selectedQuarter, setSelectedQuarter] = useState(defaultQuarterId ?? quarters[0]?.id ?? 1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("JAVA_BACKEND");
  const [plannedMinutes, setPlannedMinutes] = useState(60);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) { setError("O título da tarefa é obrigatório."); return; }
    setIsSubmitting(true);
    try {
      await onAdd(selectedQuarter, title.trim(), dueDate, category, plannedMinutes);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro ao adicionar tarefa.");
      setIsSubmitting(false);
    }
  };

  const q = quarters.find(q => q.id === selectedQuarter) || quarters[0] || DEFAULT_SEASON_QUARTERS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,8,16,0.9)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #161923 0%, #111520 100%)",
          borderColor: "rgba(99,102,241,0.2)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06)",
        }}
      >
        <div className="relative px-6 pt-6 pb-5">
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }} />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Criar Nova Tarefa</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sincroniza diretamente com o banco de dados via Spring Boot</p>
            </div>
            <button onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 transition-all cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Estação do Roadmap</label>
            <div className="grid grid-cols-2 gap-2">
              {quarters.map((quarter) => (
                <button
                  key={quarter.id}
                  type="button"
                  onClick={() => setSelectedQuarter(quarter.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedQuarter === quarter.id
                      ? "border-opacity-60 text-slate-100"
                      : "border-slate-700/40 text-slate-500 hover:border-slate-600 hover:text-slate-400"
                  }`}
                  style={selectedQuarter === quarter.id ? {
                    borderColor: quarter.accentColor + "80",
                    background: quarter.accentColor + "12",
                  } : {}}
                >
                  <span className="text-lg">{quarter.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{quarter.season} · {quarter.quarter}</p>
                    <p className="text-xs truncate" style={{ color: selectedQuarter === quarter.id ? quarter.accentColor : undefined, opacity: 0.7 }}>{quarter.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Título da Tarefa</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="Ex: Arquitetura de Microserviços Spring Cloud"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
              style={{
                background: "rgba(15,18,28,0.8)",
                border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.07)"}`,
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 outline-none transition-all cursor-pointer"
                style={{
                  background: "rgba(15,18,28,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <option value="JAVA_BACKEND">Java Backend</option>
                <option value="FRONTEND">Frontend</option>
                <option value="DATABASE">Database</option>
                <option value="DEVOPS">DevOps</option>
                <option value="ENGLISH">English</option>
                <option value="EXERCISE">Exercise</option>
                <option value="READING">Reading</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Data Alvo</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 outline-none transition-all cursor-pointer"
                style={{
                  background: "rgba(15,18,28,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${q.accentColor} 0%, ${q.accentColor}cc 100%)`,
                boxShadow: `0 4px 20px ${q.accentColor}35`,
              }}
            >
              {isSubmitting ? (
                <span>Salvando…</span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  Salvar em {q.season} · {q.quarter}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Quarter Card ───────────────────────────────────────────────────────────

interface QuarterCardProps {
  quarter: RoadmapQuarter;
  onUpdate: (id: number, patch: Partial<RoadmapQuarter>) => void;
  onTaskUpdate: (qId: number, tId: number, patch: Partial<MacroTask>) => void;
  onTaskDelete: (qId: number, tId: number) => void;
  onAddTask: (qId: number) => void;
}

const QuarterCard = ({ quarter, onUpdate, onTaskUpdate, onTaskDelete, onAddTask }: QuarterCardProps) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(quarter.goal);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [subtitleDraft, setSubtitleDraft] = useState(quarter.subtitle);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskDraft, setTaskDraft] = useState("");

  const completed = quarter.tasks.filter(t => t.completed).length;
  const total = quarter.tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const commitGoal = () => {
    onUpdate(quarter.id, { goal: goalDraft });
    setEditingGoal(false);
  };

  const commitSubtitle = () => {
    onUpdate(quarter.id, { subtitle: subtitleDraft });
    setEditingSubtitle(false);
  };

  const startEditTask = (task: MacroTask) => {
    setEditingTaskId(task.id);
    setTaskDraft(task.title);
  };

  const commitTaskEdit = (tId: number) => {
    if (taskDraft.trim()) onTaskUpdate(quarter.id, tId, { title: taskDraft.trim() });
    setEditingTaskId(null);
  };

  return (
    <div
      className="rounded-2xl border flex flex-col overflow-hidden transition-all hover:shadow-xl"
      style={{
        borderColor: "rgba(255,255,255,0.07)",
        background: "linear-gradient(160deg, #13161f 0%, #0f1118 100%)",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${quarter.accentColor}, ${quarter.accentColor}40)` }} />

      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: quarter.glowColor, border: `1px solid ${quarter.accentColor}25` }}
            >
              {quarter.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">{quarter.season}</span>
                <span
                  className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: quarter.accentColor + "20", color: quarter.accentColor }}
                >
                  {quarter.quarter}
                </span>
              </div>
              {editingSubtitle ? (
                <input
                  autoFocus
                  value={subtitleDraft}
                  onChange={e => setSubtitleDraft(e.target.value)}
                  onBlur={commitSubtitle}
                  onKeyDown={e => { if (e.key === "Enter") commitSubtitle(); if (e.key === "Escape") { setSubtitleDraft(quarter.subtitle); setEditingSubtitle(false); } }}
                  className="text-xs text-slate-400 bg-transparent border-b outline-none w-full mt-0.5"
                  style={{ borderColor: quarter.accentColor + "60" }}
                />
              ) : (
                <button
                  onClick={() => setEditingSubtitle(true)}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 group/sub mt-0.5 transition-colors text-left cursor-pointer"
                >
                  {quarter.subtitle}
                  <span className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-slate-700"><PencilIcon /></span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-9 h-9">
              <svg width="36" height="36" viewBox="0 0 36 36" className="rotate-[-90deg]">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke={quarter.accentColor}
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 14}`}
                  strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.4s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: quarter.accentColor }}>
                {pct}%
              </span>
            </div>
            <span className="text-xs text-slate-600 mt-0.5">{completed}/{total}</span>
          </div>
        </div>

        <div className="group/goal">
          {editingGoal ? (
            <textarea
              autoFocus
              value={goalDraft}
              onChange={e => setGoalDraft(e.target.value)}
              onBlur={commitGoal}
              onKeyDown={e => { if (e.key === "Escape") { setGoalDraft(quarter.goal); setEditingGoal(false); } }}
              rows={3}
              className="w-full text-xs text-slate-300 bg-transparent border rounded-lg px-2 py-1.5 resize-none outline-none leading-relaxed"
              style={{ borderColor: quarter.accentColor + "40", boxShadow: `0 0 0 3px ${quarter.accentColor}08` }}
            />
          ) : (
            <div
              onClick={() => setEditingGoal(true)}
              className="text-xs text-slate-400 leading-relaxed cursor-text rounded-lg px-2 py-1.5 transition-all hover:bg-white/3 border border-transparent hover:border-white/5 relative"
            >
              {quarter.goal}
              <span className="absolute top-1.5 right-1.5 opacity-0 group-hover/goal:opacity-100 transition-opacity text-slate-600">
                <PencilIcon />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-5 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

      <div className="px-4 py-3 flex-1 space-y-1 overflow-y-auto" style={{ maxHeight: "260px" }}>
        {quarter.tasks.map((task) => (
          <div key={task.id} className="group/task rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/3 transition-all">
              <button
                onClick={() => onTaskUpdate(quarter.id, task.id, { completed: !task.completed })}
                className="flex-shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer"
                style={{
                  borderColor: task.completed ? quarter.accentColor : "rgba(255,255,255,0.15)",
                  background: task.completed ? quarter.accentColor : "transparent",
                }}
              >
                {task.completed && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                {editingTaskId === task.id ? (
                  <input
                    autoFocus
                    value={taskDraft}
                    onChange={e => setTaskDraft(e.target.value)}
                    onBlur={() => commitTaskEdit(task.id)}
                    onKeyDown={e => { if (e.key === "Enter") commitTaskEdit(task.id); if (e.key === "Escape") setEditingTaskId(null); }}
                    className="w-full text-xs bg-transparent border-b outline-none text-slate-100"
                    style={{ borderColor: quarter.accentColor + "60" }}
                  />
                ) : (
                  <span className={`text-xs leading-snug block truncate ${task.completed ? "line-through text-slate-600" : "text-slate-300"}`}>
                    {task.title}
                  </span>
                )}
              </div>

              <input
                type="date"
                value={task.dueDate}
                onChange={e => onTaskUpdate(quarter.id, task.id, { dueDate: e.target.value })}
                className="text-xs font-mono flex-shrink-0 bg-transparent border-0 outline-none cursor-pointer transition-colors"
                style={{ colorScheme: "dark", color: task.completed ? "#475569" : quarter.accentColor + "cc", width: "94px" }}
                title="Clique para alterar a data"
              />

              <div className="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-all flex-shrink-0">
                <button
                  onClick={() => onTaskUpdate(quarter.id, task.id, { expanded: !task.expanded })}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-700/60 transition-all cursor-pointer"
                  title="Expandir anotações"
                >
                  <ChevronIcon open={task.expanded} />
                </button>
                <button
                  onClick={() => startEditTask(task)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                  title="Editar tarefa"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => onTaskDelete(quarter.id, task.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Excluir tarefa"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {task.expanded && (
              <div className="mx-2 mb-1 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <textarea
                  value={task.notes}
                  onChange={e => onTaskUpdate(quarter.id, task.id, { notes: e.target.value })}
                  placeholder="Adicione anotações, subtarefas ou contexto…"
                  rows={2}
                  className="w-full text-xs text-slate-500 bg-transparent outline-none resize-none placeholder-slate-700 leading-relaxed"
                />
              </div>
            )}
          </div>
        ))}

        {quarter.tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="text-2xl mb-2 opacity-30">{quarter.icon}</span>
            <p className="text-xs text-slate-500">Nenhuma meta cadastrada ainda.</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Adicione sua primeira meta nesta estação.</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="h-px mb-3" style={{ background: "rgba(255,255,255,0.04)" }} />
        <button
          onClick={() => onAddTask(quarter.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all border border-dashed cursor-pointer hover:bg-white/5"
          style={{
            borderColor: quarter.accentColor + "30",
            color: quarter.accentColor + "99",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar Meta
        </button>
      </div>
    </div>
  );
};

// ── Roadmap Sidebar ────────────────────────────────────────────────────────

const RoadmapSidebar = ({ quarters }: { quarters: RoadmapQuarter[] }) => {
  const allTasks = quarters.flatMap(q => q.tasks.map(t => ({ ...t, season: q.season, accentColor: q.accentColor, icon: q.icon })));
  const totalCompleted = allTasks.filter(t => t.completed).length;
  const totalTasks = allTasks.length;
  const overallPct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const upcoming = allTasks
    .filter(t => !t.completed && t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      const date = new Date(d + "T00:00:00");
      return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Progresso Anual</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-14 h-14">
            <svg width="56" height="56" viewBox="0 0 56 56" className="rotate-[-90deg]">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="22" fill="none"
                stroke="url(#ringGrad)" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - overallPct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-100">{overallPct}%</span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-100">{totalCompleted}/{totalTasks}</p>
            <p className="text-xs text-slate-500">metas concluídas</p>
          </div>
        </div>
        <div className="space-y-2">
          {quarters.map(q => {
            const done = q.tasks.filter(t => t.completed).length;
            const tot = q.tasks.length;
            const p = tot > 0 ? Math.round((done / tot) * 100) : 0;
            return (
              <div key={q.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{q.icon} {q.season} · {q.quarter}</span>
                  <span className="font-mono" style={{ color: q.accentColor }}>{done}/{tot}</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: q.accentColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Próximos Marcos</h3>
        <div className="space-y-3">
          {upcoming.map(task => (
            <div key={task.id} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5" style={{ background: task.accentColor + "18" }}>
                {task.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-300 truncate leading-snug">{task.title}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: task.accentColor + "99" }}>{formatDate(task.dueDate)}</p>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && (
            <p className="text-xs text-slate-600">Nenhum marco pendente.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Projeção de XP</h3>
        <div className="space-y-2.5">
          {quarters.map(q => {
            const potential = q.tasks.reduce((sum, t) => sum + (t.xpReward || 80), 0);
            const earned = q.tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.xpReward || 80), 0);
            return (
              <div key={q.id} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{q.icon} {q.quarter}</span>
                <span className="text-xs font-mono font-medium" style={{ color: q.accentColor }}>+{earned}/{potential} XP</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500">Potencial Total</span>
          <span className="text-sm font-bold font-mono text-indigo-400">
            +{quarters.reduce((acc, q) => acc + q.tasks.reduce((sum, t) => sum + (t.xpReward || 80), 0), 0)} XP
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfileResponse | null>(() => getStoredUser());
  const [isAuth, setIsAuth] = useState<boolean>(() => isAuthenticated());
  const [activeTab, setActiveTab] = useState<NavTab>("Dashboard");
  const [logTask, setLogTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quarters, setQuarters] = useState<RoadmapQuarter[]>(DEFAULT_SEASON_QUARTERS);
  const [timeLogs, setTimeLogs] = useState<TimeLogResponse[]>([]);
  const [userStats, setUserStats] = useState<StudyStatsResponse | null>(null);
  const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null);
  const [addTaskModal, setAddTaskModal] = useState<{ open: boolean; defaultQuarterId?: number }>({ open: false });
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = useCallback((toast: Omit<NotificationToast, "id">) => {
    const id = Date.now();
    setToasts(curr => [...curr, { ...toast, id }]);
    setTimeout(() => {
      setToasts(curr => curr.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Carrega Perfil do Usuário e Tarefas do Backend REST Java Spring Boot
  const loadUserData = useCallback(async (userId: number) => {
    // 1. Carrega dados atualizados do usuário (/auth/me se autenticado, ou /users/{id})
    try {
      let user: UserProfileResponse | null = null;
      if (isAuthenticated()) {
        try {
          user = await getMe();
        } catch {
          user = await getUserProfile(userId);
        }
      } else {
        user = await getUserProfile(userId);
      }

      if (user) {
        setCurrentUser(user);
        setStoredUser(user);
        setIsApiConnected(true);
      }
    } catch (e) {
      console.info("[StudyOS] Backend Spring Boot offline ou inicializando.");
      setIsApiConnected(false);
    }

    // 2. Busca estatísticas e histórico de tempo do usuário (/users/{id}/stats e /timelogs/user/{id})
    try {
      const [statsRes, logsRes] = await Promise.allSettled([
        getUserStats(userId),
        getTimeLogsByUser(userId),
      ]);
      if (statsRes.status === "fulfilled") {
        setUserStats(statsRes.value);
      }
      if (logsRes.status === "fulfilled" && Array.isArray(logsRes.value)) {
        setTimeLogs(logsRes.value);
      }
    } catch (e) {
      console.warn("[StudyOS] Erro ao sincronizar estatísticas de estudo:", e);
    }

    // 3. Busca todas as tarefas do usuário autenticado para o Dashboard (/tasks/user/{id})
    try {
      const userTasks = await getTasks(userId);
      if (Array.isArray(userTasks) && userTasks.length > 0) {
        setTasks(userTasks.map((t, idx) => mapBackendTaskToDashboard(t, idx)));
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.warn("[StudyOS] Erro ao sincronizar tarefas do Dashboard:", e);
      setTasks([]);
    }

    // 4. Busca tarefas por estação do usuário autenticado (/tasks/user/{id}?season=...)
    try {
      const seasons: Season[] = ["SUMMER", "AUTUMN", "WINTER", "SPRING"];
      const seasonResults = await Promise.allSettled(
        seasons.map(s => getTasksBySeason(s, userId))
      );

      setQuarters(
        DEFAULT_SEASON_QUARTERS.map((q, idx) => {
          const res = seasonResults[idx];
          if (res.status === "fulfilled" && Array.isArray(res.value) && res.value.length > 0) {
            const apiTasks: MacroTask[] = res.value.map(t => ({
              id: t.id,
              title: t.title,
              dueDate: t.targetDate || new Date().toISOString().split("T")[0],
              completed: t.status === "COMPLETED",
              expanded: false,
              notes: t.description || "",
              category: t.category,
              plannedMinutes: t.plannedDurationMinutes,
              actualMinutes: t.actualDurationMinutes || 0,
              xpReward: t.xpReward || 80,
            }));
            return { ...q, tasks: apiTasks };
          }
          return { ...q, tasks: [] };
        })
      );
    } catch (e) {
      console.warn("[StudyOS] Erro ao sincronizar estações do Roadmap:", e);
      setQuarters(DEFAULT_SEASON_QUARTERS);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    const authenticated = isAuthenticated();

    if (authenticated && user) {
      setCurrentUser(user);
      setIsAuth(true);
      loadUserData(user.id);
    } else {
      setIsAuth(false);
      setCurrentUser(null);
    }

    // Listener para tratar respostas 401/403 e redirecionar imediatamente para AuthPage
    const unsubscribe = onUnauthorized(() => {
      setIsAuth(false);
      setCurrentUser(null);
      setTasks([]);
      setQuarters(DEFAULT_SEASON_QUARTERS);
      setLogTask(null);
      setAddTaskModal({ open: false });
      addToast({
        type: "error",
        title: "Sessão Expirada",
        message: "Sua autenticação expirou. Por favor, acesse novamente.",
      });
    });

    const interval = setInterval(() => {
      checkApiHealth().then(online => setIsApiConnected(online));
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadUserData, addToast]);

  // Função disparada no sucesso do Login/Cadastro na AuthPage
  const handleAuthSuccess = (user: UserProfileResponse) => {
    setCurrentUser(user);
    setIsAuth(true);
    setActiveTab("Dashboard");
    addToast({
      type: "success",
      title: "Bem-vindo ao StudyOS!",
      message: `Login realizado com sucesso como ${user.name}.`,
    });
    loadUserData(user.id);
  };

  // Função de encerramento de sessão (Logout)
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setIsAuth(false);
    setTasks([]);
    setQuarters(DEFAULT_SEASON_QUARTERS);
    setTimeLogs([]);
    setUserStats(null);
    setLogTask(null);
    setAddTaskModal({ open: false });
    addToast({
      type: "info",
      title: "Sessão Encerrada",
      message: "Você saiu da sua conta StudyOS. O token JWT foi removido.",
    });
  };

  // Atualizar Quarter localmente
  const updateQuarter = (id: number, patch: Partial<RoadmapQuarter>) =>
    setQuarters(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q));

  // Atualizar Tarefa / Toggle Completed / Editar dados com validação de Auth
  const handleTaskUpdate = async (qId: number, tId: number, patch: Partial<MacroTask>) => {
    if (!currentUser || !isAuthenticated()) {
      addToast({
        type: "error",
        title: "Não autorizado",
        message: "Você precisa estar autenticado para atualizar tarefas.",
      });
      handleLogout();
      return;
    }

    setQuarters(qs => qs.map(q => q.id === qId ? {
      ...q, tasks: q.tasks.map(t => t.id === tId ? { ...t, ...patch } : t)
    } : q));

    if (patch.completed !== undefined) {
      const newStatus = patch.completed ? "COMPLETED" : "PENDING";
      try {
        await updateTaskStatus(tId, newStatus);
        // Atualiza usuário e XP após completar
        if (patch.completed) {
          const updatedUser = await getUserProfile(currentUser.id).catch(() => null);
          if (updatedUser) {
            setCurrentUser(updatedUser);
            setStoredUser(updatedUser);
            addToast({
              type: "xp",
              title: "Task Concluída!",
              message: "Status atualizado no banco de dados. XP sincronizado!",
              xp: 80,
            });
          }
        }
      } catch (err) {
        console.warn("Update task status via API failed, keeping local state:", err);
      }
    }

    if (patch.title !== undefined || patch.dueDate !== undefined || patch.notes !== undefined || patch.category !== undefined) {
      try {
        await updateTask(tId, {
          title: patch.title,
          targetDate: patch.dueDate,
          description: patch.notes,
          category: patch.category,
        });
      } catch (err) {
        console.warn("Update task details via API failed, keeping local state:", err);
      }
    }
  };

  // Excluir Tarefa (/tasks/{id}) com validação de Auth
  const handleTaskDelete = async (qId: number, tId: number) => {
    if (!currentUser || !isAuthenticated()) {
      addToast({
        type: "error",
        title: "Não autorizado",
        message: "Você precisa estar autenticado para excluir tarefas.",
      });
      handleLogout();
      return;
    }

    setQuarters(qs => qs.map(q => q.id === qId ? { ...q, tasks: q.tasks.filter(t => t.id !== tId) } : q));
    setTasks(ts => ts.filter(t => t.id !== tId));

    try {
      await deleteTask(tId);
      addToast({
        type: "info",
        title: "Tarefa Excluída",
        message: `A tarefa #${tId} foi removida com sucesso.`,
      });
    } catch (err) {
      console.warn("Delete task via API failed:", err);
    }
  };

  // Criar Tarefa (/tasks) com validação de Auth e userId ativo
  const handleAddTask = async (quarterId: number, title: string, dueDate: string, category: string = "JAVA_BACKEND", plannedMinutes: number = 60) => {
    if (!currentUser || !isAuthenticated()) {
      addToast({
        type: "error",
        title: "Não autorizado",
        message: "Você precisa estar autenticado para criar tarefas.",
      });
      handleLogout();
      return;
    }

    const quarter = quarters.find(q => q.id === quarterId) || quarters[0] || DEFAULT_SEASON_QUARTERS[0];
    const xpReward = Math.max(50, Math.round(plannedMinutes * 1.2));

    try {
      const createdTask = await createTask({
        userId: currentUser.id,
        title,
        season: quarter.seasonKey,
        category,
        plannedDurationMinutes: plannedMinutes,
        targetDate: dueDate,
        xpReward,
      });

      const newTask: MacroTask = {
        id: createdTask.id || Date.now(),
        title: createdTask.title || title,
        dueDate: createdTask.targetDate || dueDate,
        completed: createdTask.status === "COMPLETED",
        expanded: false,
        notes: createdTask.description || "",
        category: createdTask.category,
        plannedMinutes: createdTask.plannedDurationMinutes,
        xpReward: createdTask.xpReward,
      };

      setQuarters(qs => qs.map(q => q.id === quarterId ? { ...q, tasks: [...q.tasks, newTask] } : q));

      const dashboardTask: Task = {
        id: newTask.id,
        category: (createdTask.category || category).replace(/_/g, " "),
        categoryColor: mapCategoryColor(createdTask.category || category),
        title: newTask.title,
        subtitle: `Roadmap · ${quarter.season} ${quarter.quarter}`,
        plannedTime: formatMinutesToHm(plannedMinutes),
        actualTime: null,
        status: "pending",
        timeStart: "10:00",
        timeEnd: "11:30",
        xpReward,
        targetDate: dueDate,
      };
      setTasks(ts => [...ts, dashboardTask]);

      addToast({
        type: "success",
        title: "Tarefa Criada com Sucesso!",
        message: `"${title}" salva na estação ${quarter.season}.`,
      });
    } catch (err: any) {
      console.warn("Create task via API failed:", err);
      addToast({
        type: "error",
        title: "Erro ao criar tarefa",
        message: err?.message || "Não foi possível conectar ao banco de dados.",
      });
    }
  };

  // Callback após registrar tempo e receber XP atualizado do Spring Boot com validação de Auth
  const handleTimeLogged = (
    taskId: number,
    actualMins: number,
    status: string,
    notes: string,
    updatedUser: UserProfileResponse | null
  ) => {
    if (!currentUser || !isAuthenticated()) {
      addToast({
        type: "error",
        title: "Não autorizado",
        message: "Você precisa estar autenticado para registrar tempo.",
      });
      handleLogout();
      return;
    }

    // 1. Atualiza estado da tarefa no Dashboard
    setTasks(ts =>
      ts.map(t => {
        if (t.id === taskId) {
          const newStatus: TaskStatus = status === "complete" ? "completed" : status === "partial" ? "partial" : "pending";
          return {
            ...t,
            actualTime: formatMinutesToHm(actualMins),
            status: newStatus,
          };
        }
        return t;
      })
    );

    // 2. Atualiza estado no Roadmap se a tarefa existir lá
    setQuarters(qs =>
      qs.map(q => ({
        ...q,
        tasks: q.tasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              completed: status === "complete",
              actualMinutes: (t.actualMinutes || 0) + actualMins,
              notes: notes ? `${t.notes ? t.notes + " | " : ""}${notes}` : t.notes,
            };
          }
          return t;
        }),
      }))
    );

    // 3. Atualiza dados de XP e Nível do Usuário
    if (updatedUser) {
      setCurrentUser(updatedUser);
      setStoredUser(updatedUser);
    } else {
      const xpMultiplier = status === "complete" ? 1 : status === "partial" ? 0.6 : 0.25;
      const targetTask = tasks.find(t => t.id === taskId);
      const xpEarned = Math.round((targetTask?.xpReward || 80) * xpMultiplier);
      setCurrentUser(prev => {
        if (!prev) return null;
        const nextXp = prev.currentXp + xpEarned;
        const nextLevel = Math.floor(nextXp / 500) + 1;
        const updated = { ...prev, currentXp: nextXp, level: nextLevel };
        setStoredUser(updated);
        return updated;
      });
    }

    addToast({
      type: "xp",
      title: "Tempo Registrado com Sucesso!",
      message: `${actualMins} minutos computados no banco de dados. XP creditado.`,
    });
  };

  const renderToasts = () => (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl animate-fade-in"
          style={{
            background: "rgba(18, 21, 31, 0.95)",
            backdropFilter: "blur(12px)",
            borderColor: toast.type === "xp" ? "rgba(99,102,241,0.5)" : toast.type === "success" ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.1)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <span className="text-lg">
            {toast.type === "xp" ? "⚡" : toast.type === "success" ? "✅" : "ℹ️"}
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-100">{toast.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TRAVA DE AUTENTICAÇÃO (AUTH GATE) ──
  // Se o usuário NÃO estiver logado: renderiza EXCLUSIVAMENTE a tela AuthPage.
  if (!isAuth || !currentUser) {
    return (
      <div className="min-h-screen w-full" style={{ background: "#0c0e15", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {renderToasts()}
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // ── APLICAÇÃO AUTENTICADA (DASHBOARD COMPLETO E 100% DINÂMICO) ──
  const user = currentUser;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", month: "long", day: "numeric" });

  const currentLevel = user.level || 1;
  const currentXpInLevel = (user.currentXp || 0) % 500;
  const maxXpInLevel = 500;

  // Cálculos dinâmicos para o Dashboard
  const totalPlannedMinutesToday = tasks.reduce((sum, t) => sum + parseTimeToMinutes(t.plannedTime), 0);
  const totalActualMinutesToday = tasks.reduce((sum, t) => sum + (t.actualTime ? parseTimeToMinutes(t.actualTime) : 0), 0);
  const totalStudyMinutesOverall = userStats?.totalStudyMinutes ?? timeLogs.reduce((acc, l) => acc + (l.loggedDurationMinutes || 0), 0);

  // Conquistas calculadas dinamicamente
  const dynamicBadges = calculateDynamicBadges(currentUser, tasks, totalStudyMinutesOverall);
  const earnedBadgesCount = dynamicBadges.filter(b => b.unlocked).length;

  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in-progress");
  const completedTasksToday = tasks.filter(t => t.status === "completed");

  return (
    <div className="min-h-full flex flex-col" style={{ background: "#0c0e15", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {renderToasts()}

      {/* Header Autenticado */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 border-b border-slate-800/60"
        style={{ background: "rgba(12,14,21,0.92)", backdropFilter: "blur(12px)" }}
      >
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-100 tracking-tight">StudyOS</span>
          </div>

          <nav className="flex items-center gap-1">
            {(["Dashboard", "Performance", "Badges", "Roadmap"] as NavTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: User info, XP, & Logout Button */}
        <div className="flex items-center gap-4">
          {/* API Connection Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border"
            style={{
              background: isApiConnected ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
              borderColor: isApiConnected ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)",
              color: isApiConnected ? "#34d399" : "#fbbf24",
            }}
            title={isApiConnected ? "Conectado ao Spring Boot REST (http://localhost:8080/api/v1)" : "Modo Offline (Backend Spring Boot não detectado em localhost:8080)"}
          >
            <span className={`w-2 h-2 rounded-full ${isApiConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span>{isApiConnected ? "API Spring Boot" : "Offline"}</span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-900/50 bg-amber-950/30">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-semibold text-amber-400">{user.streakDays || 0} Dias</span>
          </div>

          {/* XP Bar */}
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-indigo-400">
                Level {currentLevel} · {getLevelTitle(currentLevel)}
              </span>
            </div>
            <XPBar current={currentXpInLevel} max={maxXpInLevel} />
          </div>

          {/* User Avatar */}
          <div
            className="relative flex items-center gap-2 pl-2 border-l border-slate-800"
            title={`${user.name} (${user.email})`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-500/20">
              {user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[120px]">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</p>
            </div>
            <div className="absolute top-0 left-8 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>

          {/* Botão de Logout ("Sair") */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all text-xs font-medium cursor-pointer"
            title="Sair da conta e retornar à tela de login"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {activeTab === "Dashboard" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column — Timeline */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-slate-100">Today's Schedule</h1>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{todayDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Concluídas</p>
                    <p className="text-sm font-semibold text-slate-200">{completedCount}/{totalCount} tarefas</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#6366F1 ${totalCount > 0 ? (completedCount/totalCount)*360 : 0}deg, #1e293b 0)` }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#0c0e15" }}>
                      <span className="text-xs font-bold text-indigo-400">{totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Cards & Empty State */}
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onLog={setLogTask} />
                ))}

                {tasks.length === 0 && (
                  <div className="p-10 text-center rounded-2xl border border-slate-800/60 bg-slate-900/30 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-4 text-indigo-400 shadow-inner">
                      🎯
                    </div>
                    <h3 className="text-base font-semibold text-slate-200">Nenhuma tarefa cadastrada para hoje</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed mb-5">
                      Seu cronograma de hoje está livre. Adicione suas metas de estudo no StudyOS para começar a registrar tempo e acumular XP.
                    </p>
                    <button
                      onClick={() => setAddTaskModal({ open: true })}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
                        boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Criar primeira tarefa
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column — Stats sidebar */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Progresso Diário</h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Tempo de Estudo",
                      value: formatMinutesToHm(totalActualMinutesToday),
                      target: formatMinutesToHm(totalPlannedMinutesToday || 60),
                      pct: totalPlannedMinutesToday > 0 ? Math.min(Math.round((totalActualMinutesToday / totalPlannedMinutesToday) * 100), 100) : (totalActualMinutesToday > 0 ? 100 : 0),
                      color: "#6366F1",
                    },
                    {
                      label: "Tarefas Feitas",
                      value: `${completedCount} / ${totalCount}`,
                      target: `${totalCount} ${totalCount === 1 ? "tarefa" : "tarefas"}`,
                      pct: totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0,
                      color: "#10B981",
                    },
                    {
                      label: "Score de Foco",
                      value: `${totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0} / 100`,
                      target: "100",
                      pct: totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0,
                      color: "#F97316",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="font-mono text-slate-300">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.pct}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Up Next */}
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Próximas Tarefas</h3>
                <div className="space-y-3">
                  {pendingTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: t.categoryColor }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-300 truncate">{t.title}</p>
                        <p className="text-xs text-slate-600 font-mono">{t.timeStart} · {t.plannedTime}</p>
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <p className="text-xs text-slate-600">Nenhuma tarefa pendente no momento.</p>
                  )}
                </div>
              </div>

              {/* XP Activity */}
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Atividade de XP Hoje</h3>
                <div className="space-y-2.5">
                  {completedTasksToday.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs text-slate-300 truncate">{t.title}</p>
                        <p className="text-[11px] text-slate-600 font-mono">{t.actualTime || t.plannedTime} · {t.category}</p>
                      </div>
                      <span className="text-xs font-semibold font-mono text-indigo-400">+{t.xpReward} XP</span>
                    </div>
                  ))}
                  {completedTasksToday.length === 0 && (
                    <p className="text-xs text-slate-600">Nenhuma atividade com XP hoje.</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Total ganho hoje</span>
                  <span className="text-sm font-bold font-mono text-indigo-400">
                    +{completedTasksToday.reduce((acc, t) => acc + (t.xpReward || 0), 0)} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Performance" && (
          <div>
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-slate-100">Performance Overview</h1>
              <p className="text-xs text-slate-500 mt-0.5">Histórico e métricas de desempenho calculadas em tempo real</p>
            </div>
            <PerformanceView
              user={user}
              tasks={tasks}
              timeLogs={timeLogs}
              userStats={userStats}
            />
          </div>
        )}

        {activeTab === "Badges" && (
          <div>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h1 className="text-lg font-semibold text-slate-100">Achievements &amp; Conquistas</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {earnedBadgesCount} de {dynamicBadges.length} conquistas desbloqueadas
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-900/40 bg-amber-950/20">
                <span className="text-amber-400 text-sm">🏆</span>
                <span className="text-xs font-medium text-amber-400">{earnedBadgesCount} Desbloqueadas</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {dynamicBadges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
            </div>
          </div>
        )}

        {activeTab === "Roadmap" && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-slate-100">Yearly Roadmap</h1>
                  <p className="text-xs text-slate-500 mt-0.5">4 estações sazonais sincronizadas diretamente com o banco de dados</p>
                </div>
                <button
                  onClick={() => setAddTaskModal({ open: true })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Adicionar Tarefa
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {quarters.map(q => (
                  <QuarterCard
                    key={q.id}
                    quarter={q}
                    onUpdate={updateQuarter}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    onAddTask={(qId) => setAddTaskModal({ open: true, defaultQuarterId: qId })}
                  />
                ))}
              </div>
            </div>

            <RoadmapSidebar quarters={quarters} />
          </div>
        )}
      </main>

      {/* Time Log Modal */}
      {logTask && (
        <TimeLogModal
          task={logTask}
          userXp={user.currentXp || 0}
          userLevel={user.level || 1}
          userId={user.id}
          onClose={() => setLogTask(null)}
          onTimeLogged={handleTimeLogged}
        />
      )}

      {/* Add Task Modal */}
      {addTaskModal.open && (
        <AddTaskModal
          quarters={quarters}
          defaultQuarterId={addTaskModal.defaultQuarterId}
          onAdd={handleAddTask}
          onClose={() => setAddTaskModal({ open: false })}
        />
      )}
    </div>
  );
}
