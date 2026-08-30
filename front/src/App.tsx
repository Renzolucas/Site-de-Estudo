import { useState } from "react";

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
}

interface RoadmapQuarter {
  id: number;
  season: string;
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

// ── Data ───────────────────────────────────────────────────────────────────

const TASKS: Task[] = [
  {
    id: 1,
    category: "Java Backend",
    categoryColor: "#6366F1",
    title: "Spring Boot Architecture Study",
    subtitle: "Microservices patterns & REST API design",
    plannedTime: "2h 00m",
    actualTime: "1h 30m",
    status: "partial",
    timeStart: "08:00",
    timeEnd: "10:00",
    xpReward: 120,
  },
  {
    id: 2,
    category: "Exercise",
    categoryColor: "#10B981",
    title: "Morning Workout + Stretching",
    subtitle: "Cardio 30m + core training",
    plannedTime: "1h 00m",
    actualTime: "1h 05m",
    status: "completed",
    timeStart: "06:30",
    timeEnd: "07:30",
    xpReward: 80,
  },
  {
    id: 3,
    category: "English",
    categoryColor: "#F97316",
    title: "Business English Writing",
    subtitle: "Email templates & formal documentation",
    plannedTime: "45m",
    actualTime: null,
    status: "in-progress",
    timeStart: "11:00",
    timeEnd: "11:45",
    xpReward: 60,
  },
  {
    id: 4,
    category: "System Design",
    categoryColor: "#8B5CF6",
    title: "Database Indexing & Query Optimization",
    subtitle: "PostgreSQL performance tuning",
    plannedTime: "1h 30m",
    actualTime: null,
    status: "pending",
    timeStart: "14:00",
    timeEnd: "15:30",
    xpReward: 100,
  },
  {
    id: 5,
    category: "LeetCode",
    categoryColor: "#EC4899",
    title: "Dynamic Programming — Medium Set",
    subtitle: "Knapsack, coin change, LIS problems",
    plannedTime: "1h 00m",
    actualTime: null,
    status: "pending",
    timeStart: "16:00",
    timeEnd: "17:00",
    xpReward: 90,
  },
];

const BADGES: Badge[] = [
  { id: 1, icon: "🌅", name: "Early Bird", description: "Complete a task before 8 AM", unlocked: true },
  { id: 2, icon: "🔥", name: "Week Warrior", description: "7-day study streak", unlocked: true },
  { id: 3, icon: "💯", name: "Perfect Day", description: "Complete all daily tasks", unlocked: true },
  { id: 4, icon: "⚡", name: "Speed Runner", description: "Finish a task 20% under time", unlocked: true },
  { id: 5, icon: "🏆", name: "100 Hours Club", description: "Log 100 total study hours", unlocked: false, progress: 74, total: 100 },
  { id: 6, icon: "🧠", name: "Resilient Learner", description: "Resume after 3 interruptions", unlocked: false, progress: 2, total: 3 },
  { id: 7, icon: "📚", name: "Polymath", description: "Study 5 different subjects", unlocked: false, progress: 3, total: 5 },
  { id: 8, icon: "🌙", name: "Night Owl", description: "Study after 10 PM for 5 days", unlocked: false, progress: 1, total: 5 },
  { id: 9, icon: "🎯", name: "Precision", description: "Match planned vs actual time (±5m) 10 times", unlocked: false, progress: 4, total: 10 },
];

// ── Helper Components ──────────────────────────────────────────────────────

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
  const pct = Math.round((current / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{current}/{max} XP</span>
      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps {
  task: Task;
  onClose: () => void;
}

// Parses "2h 00m" → total minutes
const parseTime = (s: string): number => {
  const hm = s.match(/(\d+)h\s*(\d+)m/);
  const hOnly = s.match(/(\d+)h/);
  const mOnly = s.match(/(\d+)m/);
  if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2]);
  if (hOnly) return parseInt(hOnly[1]) * 60;
  if (mOnly) return parseInt(mOnly[1]);
  return 0;
};

const TimeLogModal = ({ task, onClose }: ModalProps) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [completionStatus, setCompletionStatus] = useState<"complete" | "partial" | "interrupted">("complete");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<"idle" | "saving" | "done">("idle");

  const plannedMins = parseTime(task.plannedTime);
  const actualMins = hours * 60 + minutes;
  const hasActual = actualMins > 0;

  // Efficiency ratio — caps at 100% for the bar
  const efficiencyPct = plannedMins > 0 && hasActual
    ? Math.min(Math.round((actualMins / plannedMins) * 100), 140)
    : 0;
  const overran = hasActual && actualMins > plannedMins;
  const underPct = plannedMins > 0 && hasActual ? Math.min(actualMins / plannedMins, 1) * 100 : 0;

  // XP multiplier based on status
  const xpMultiplier = completionStatus === "complete" ? 1 : completionStatus === "partial" ? 0.6 : 0.25;
  const xpEarned = Math.round(task.xpReward * xpMultiplier);

  const handleSave = () => {
    setPhase("saving");
    setTimeout(() => {
      setPhase("done");
      setTimeout(onClose, 1400);
    }, 700);
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
        {/* ── Header ── */}
        <div className="relative px-6 pt-6 pb-5">
          {/* Subtle top gradient accent */}
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

          {/* ── Duration Comparison ── */}
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

            {/* Two-column: planned (readonly) vs actual (stepper) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Planned */}
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

              {/* Actual — stepper */}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3">
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  Actual
                </p>
                <div className="flex items-end gap-1">
                  {/* Hours */}
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
                  {/* Minutes */}
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

            {/* Comparison bar */}
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
                  {/* Planned marker line */}
                  <div className="absolute top-0 bottom-0 w-px bg-slate-600" style={{ left: "100%" }} />
                  {/* Actual bar */}
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

          {/* ── Completion Status ── */}
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

          {/* ── Notes ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Notes & Interruptions
              </label>
              <span className="text-xs text-slate-700 font-mono">{notes.length}/400</span>
            </div>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 400))}
                placeholder="What happened during this session? Any blockers, interruptions, or observations worth noting…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed resize-none transition-all"
                style={{
                  background: "rgba(15,18,28,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#cbd5e1",
                  outline: "none",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(99,102,241,0.45)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.07)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {/* Quick-insert chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Meeting ran over", "Lost focus", "Technical issues", "Personal errand"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setNotes((n) => n ? `${n} ${chip}.` : `${chip}.`)}
                    className="text-xs px-2 py-1 rounded-md text-slate-600 border border-slate-800 hover:border-slate-600 hover:text-slate-400 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── XP Preview ── */}
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
                    {completionStatus === "complete" ? "Full reward" : completionStatus === "partial" ? "60% reward" : "25% reward"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-mono text-indigo-400">+{xpEarned}</p>
                <p className="text-xs text-slate-600">750 → {750 + xpEarned} XP</p>
              </div>
            </div>

            {/* Mini XP bar showing post-claim state */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Level 5</span>
                <span>{750 + xpEarned}/1000 XP</span>
                <span>Level 6</span>
              </div>
              <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div className="h-full rounded-full relative overflow-hidden" style={{ width: `${Math.min(((750 + xpEarned) / 1000) * 100, 100)}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500" />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-6 opacity-60"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4))" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer / Save ── */}
        <div className="px-6 pb-6 pt-2">
          <div
            className="h-px mb-4"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }}
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={phase !== "idle"}
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
                  Saving…
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
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: task.categoryColor }}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Time range + category */}
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

            {/* Title */}
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

        {/* Time tracking row */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-700/60 hover:border-indigo-500 transition-all"
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
    {!badge.unlocked && badge.progress !== undefined && (
      <div className="w-full mt-1">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{badge.progress}/{badge.total}</span>
          <span>{Math.round((badge.progress! / badge.total!) * 100)}%</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600/50 rounded-full"
            style={{ width: `${(badge.progress! / badge.total!) * 100}%` }}
          />
        </div>
      </div>
    )}
    {badge.unlocked && (
      <span className="text-xs text-indigo-400 font-medium">✓ Earned</span>
    )}
  </div>
);

// ── Performance View ───────────────────────────────────────────────────────

const PerformanceView = () => {
  const weekData = [
    { day: "Mon", planned: 5, actual: 4.5 },
    { day: "Tue", planned: 6, actual: 6.2 },
    { day: "Wed", planned: 4, actual: 3.0 },
    { day: "Thu", planned: 5, actual: 5.5 },
    { day: "Fri", planned: 6, actual: 4.8 },
    { day: "Sat", planned: 3, actual: 3.1 },
    { day: "Sun", planned: 4, actual: 0 },
  ];
  const maxH = 8;

  const stats = [
    { label: "Total Hours This Week", value: "27.1h", sub: "+3.2h vs last week", color: "text-indigo-400" },
    { label: "Task Completion Rate", value: "84%", sub: "↑ 6% improvement", color: "text-emerald-400" },
    { label: "Focus Score", value: "92", sub: "Consistency index", color: "text-amber-400" },
    { label: "XP This Week", value: "+820", sub: "Level up in 180 XP", color: "text-violet-400" },
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
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Weekly Study Hours</h3>
        <p className="text-xs text-slate-500 mb-6">Planned vs Actual hours per day</p>
        <div className="flex items-end gap-3 h-40">
          {weekData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center gap-1" style={{ height: "120px" }}>
                <div
                  className="flex-1 rounded-t-md bg-slate-700/50 transition-all"
                  style={{ height: `${(d.planned / maxH) * 120}px` }}
                  title={`Planned: ${d.planned}h`}
                />
                <div
                  className="flex-1 rounded-t-md bg-indigo-500/70 transition-all"
                  style={{ height: `${(d.actual / maxH) * 120}px` }}
                  title={`Actual: ${d.actual}h`}
                />
              </div>
              <span className="text-xs text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-700/50" /><span className="text-xs text-slate-500">Planned</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-500/70" /><span className="text-xs text-slate-500">Actual</span></div>
        </div>
      </div>
    </div>
  );
};

// ── Roadmap Initial Data ───────────────────────────────────────────────────

const INITIAL_QUARTERS: RoadmapQuarter[] = [
  {
    id: 1,
    season: "Summer",
    quarter: "Q1",
    icon: "☀️",
    subtitle: "Java Backend Foundations",
    goal: "Complete Spring Boot mastery path and ship a production-ready REST API with authentication, testing, and CI/CD pipeline.",
    accentColor: "#F97316",
    glowColor: "rgba(249,115,22,0.15)",
    tasks: [
      { id: 101, title: "Spring Boot core modules", dueDate: "2026-07-15", completed: true, expanded: false, notes: "Controllers, services, repos, DI" },
      { id: 102, title: "REST API + OpenAPI docs", dueDate: "2026-07-28", completed: true, expanded: false, notes: "Swagger, versioning, error handling" },
      { id: 103, title: "Spring Security + JWT", dueDate: "2026-08-10", completed: false, expanded: false, notes: "OAuth2 integration planned" },
      { id: 104, title: "Unit & integration testing", dueDate: "2026-08-25", completed: false, expanded: false, notes: "JUnit 5, Mockito, Testcontainers" },
    ],
  },
  {
    id: 2,
    season: "Autumn",
    quarter: "Q2",
    icon: "🍂",
    subtitle: "Databases & System Design",
    goal: "Deep-dive into relational and NoSQL databases, query optimization, and distributed system design patterns.",
    accentColor: "#10B981",
    glowColor: "rgba(16,185,129,0.12)",
    tasks: [
      { id: 201, title: "PostgreSQL advanced indexing", dueDate: "2026-09-20", completed: false, expanded: false, notes: "B-tree, GIN, partial indexes" },
      { id: 202, title: "Redis caching patterns", dueDate: "2026-10-05", completed: false, expanded: false, notes: "Cache-aside, write-through" },
      { id: 203, title: "System design interviews", dueDate: "2026-10-20", completed: false, expanded: false, notes: "URL shortener, Twitter feed, etc." },
      { id: 204, title: "MongoDB aggregation pipeline", dueDate: "2026-11-01", completed: false, expanded: false, notes: "Complex analytics queries" },
    ],
  },
  {
    id: 3,
    season: "Winter",
    quarter: "Q3",
    icon: "❄️",
    subtitle: "Algorithms & English Fluency",
    goal: "Reach LeetCode 200 solved problems milestone and achieve B2+ business English through structured writing practice.",
    accentColor: "#6366F1",
    glowColor: "rgba(99,102,241,0.12)",
    tasks: [
      { id: 301, title: "Dynamic programming series", dueDate: "2026-11-30", completed: false, expanded: false, notes: "50 DP problems minimum" },
      { id: 302, title: "Graph algorithms mastery", dueDate: "2026-12-15", completed: false, expanded: false, notes: "BFS, DFS, Dijkstra, A*" },
      { id: 303, title: "Business writing course", dueDate: "2026-12-20", completed: false, expanded: false, notes: "Formal emails, reports, proposals" },
      { id: 304, title: "Mock interview × 10", dueDate: "2027-01-10", completed: false, expanded: false, notes: "2 per week with feedback" },
    ],
  },
  {
    id: 4,
    season: "Spring",
    quarter: "Q4",
    icon: "🌸",
    subtitle: "Cloud & Career Launch",
    goal: "Obtain AWS Solutions Architect certification and secure a senior backend engineering role with target €80k+ compensation.",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139,92,246,0.12)",
    tasks: [
      { id: 401, title: "AWS SAA-C03 certification", dueDate: "2027-02-01", completed: false, expanded: false, notes: "EC2, RDS, Lambda, VPC focus" },
      { id: 402, title: "Portfolio project: SaaS MVP", dueDate: "2027-02-28", completed: false, expanded: false, notes: "Full-stack with Spring + React" },
      { id: 403, title: "Technical interviews prep", dueDate: "2027-03-15", completed: false, expanded: false, notes: "System design + coding rounds" },
      { id: 404, title: "Target job applications", dueDate: "2027-04-01", completed: false, expanded: false, notes: "20 applications minimum" },
    ],
  },
];

// ── Roadmap View ───────────────────────────────────────────────────────────

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
  onAdd: (quarterId: number, title: string, dueDate: string) => void;
  onClose: () => void;
}

const AddTaskModal = ({ quarters, defaultQuarterId, onAdd, onClose }: AddTaskModalProps) => {
  const [selectedQuarter, setSelectedQuarter] = useState(defaultQuarterId ?? quarters[0].id);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!title.trim()) { setError("Task title is required."); return; }
    onAdd(selectedQuarter, title.trim(), dueDate);
    onClose();
  };

  const q = quarters.find(q => q.id === selectedQuarter)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,8,16,0.9)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #161923 0%, #111520 100%)",
          borderColor: "rgba(99,102,241,0.2)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06)",
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5">
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }} />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Add Roadmap Task</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assign to a seasonal quarter</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Season selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Assign to Quarter</label>
            <div className="grid grid-cols-2 gap-2">
              {quarters.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuarter(q.id)}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all ${
                    selectedQuarter === q.id
                      ? "border-opacity-60 text-slate-100"
                      : "border-slate-700/40 text-slate-500 hover:border-slate-600 hover:text-slate-400"
                  }`}
                  style={selectedQuarter === q.id ? {
                    borderColor: q.accentColor + "80",
                    background: q.accentColor + "12",
                  } : {}}
                >
                  <span className="text-lg">{q.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{q.season} · {q.quarter}</p>
                    <p className="text-xs truncate" style={{ color: selectedQuarter === q.id ? q.accentColor : undefined, opacity: 0.7 }}>{q.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Task title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder={`e.g., Learn ${q.subtitle.split(" ")[0]} fundamentals`}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
              style={{
                background: "rgba(15,18,28,0.8)",
                border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.07)"}`,
              }}
              onFocus={(e) => { e.target.style.borderColor = q.accentColor + "60"; e.target.style.boxShadow = `0 0 0 3px ${q.accentColor}12`; }}
              onBlur={(e) => { e.target.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.07)"; e.target.style.boxShadow = "none"; }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Target Due Date</label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 outline-none transition-all appearance-none"
                style={{
                  background: "rgba(15,18,28,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  colorScheme: "dark",
                }}
                onFocus={(e) => { e.target.style.borderColor = q.accentColor + "60"; e.target.style.boxShadow = `0 0 0 3px ${q.accentColor}12`; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-all">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${q.accentColor} 0%, ${q.accentColor}cc 100%)`,
                boxShadow: `0 4px 20px ${q.accentColor}35`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              Add to {q.season} · {q.quarter}
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
      {/* Card top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${quarter.accentColor}, ${quarter.accentColor}40)` }} />

      {/* Card Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Season icon with glow */}
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
              {/* Editable subtitle */}
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
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 group/sub mt-0.5 transition-colors text-left"
                >
                  {quarter.subtitle}
                  <span className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-slate-700"><PencilIcon /></span>
                </button>
              )}
            </div>
          </div>

          {/* Progress ring */}
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

        {/* Editable goal summary */}
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

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

      {/* Macro-tasks list */}
      <div className="px-4 py-3 flex-1 space-y-1 overflow-y-auto" style={{ maxHeight: "260px" }}>
        {quarter.tasks.map((task) => (
          <div key={task.id} className="group/task rounded-xl overflow-hidden">
            {/* Task row */}
            <div className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/3 transition-all">
              {/* Checkbox */}
              <button
                onClick={() => onTaskUpdate(quarter.id, task.id, { completed: !task.completed })}
                className="flex-shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all"
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

              {/* Task content — inline edit */}
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

              {/* Inline date picker */}
              <input
                type="date"
                value={task.dueDate}
                onChange={e => onTaskUpdate(quarter.id, task.id, { dueDate: e.target.value })}
                className="text-xs font-mono flex-shrink-0 bg-transparent border-0 outline-none cursor-pointer transition-colors"
                style={{ colorScheme: "dark", color: task.completed ? "#475569" : quarter.accentColor + "cc", width: "94px" }}
                title="Click to change due date"
              />

              {/* Hover actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-all flex-shrink-0">
                <button
                  onClick={() => onTaskUpdate(quarter.id, task.id, { expanded: !task.expanded })}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-700/60 transition-all"
                  title="Expand notes"
                >
                  <ChevronIcon open={task.expanded} />
                </button>
                <button
                  onClick={() => startEditTask(task)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  title="Edit task"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => onTaskDelete(quarter.id, task.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete task"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {/* Expanded notes */}
            {task.expanded && (
              <div className="mx-2 mb-1 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <textarea
                  value={task.notes}
                  onChange={e => onTaskUpdate(quarter.id, task.id, { notes: e.target.value })}
                  placeholder="Add notes, sub-goals, or context…"
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
            <p className="text-xs text-slate-600">No tasks yet. Add your first goal.</p>
          </div>
        )}
      </div>

      {/* Card Footer — Add task */}
      <div className="px-4 pb-4 pt-2">
        <div className="h-px mb-3" style={{ background: "rgba(255,255,255,0.04)" }} />
        <button
          onClick={() => onAddTask(quarter.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all border border-dashed"
          style={{
            borderColor: quarter.accentColor + "30",
            color: quarter.accentColor + "99",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = quarter.accentColor + "70";
            (e.currentTarget as HTMLElement).style.color = quarter.accentColor;
            (e.currentTarget as HTMLElement).style.background = quarter.accentColor + "08";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = quarter.accentColor + "30";
            (e.currentTarget as HTMLElement).style.color = quarter.accentColor + "99";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Task
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
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Yearly Progress</h3>
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
            <p className="text-xs text-slate-500">tasks complete</p>
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

      {/* Upcoming milestones */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Upcoming Milestones</h3>
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
        </div>
      </div>

      {/* XP Projection */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">XP Projection</h3>
        <div className="space-y-2.5">
          {quarters.map(q => {
            const potential = q.tasks.length * 80;
            const earned = q.tasks.filter(t => t.completed).length * 80;
            return (
              <div key={q.id} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{q.icon} {q.quarter}</span>
                <span className="text-xs font-mono font-medium" style={{ color: q.accentColor }}>+{earned}/{potential} XP</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500">Total potential</span>
          <span className="text-sm font-bold font-mono text-indigo-400">+{quarters.reduce((acc, q) => acc + q.tasks.length * 80, 0)} XP</span>
        </div>
      </div>
    </div>
  );
};

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("Dashboard");
  const [logTask, setLogTask] = useState<Task | null>(null);
  const [quarters, setQuarters] = useState<RoadmapQuarter[]>(INITIAL_QUARTERS);
  const [addTaskModal, setAddTaskModal] = useState<{ open: boolean; defaultQuarterId?: number }>({ open: false });

  const updateQuarter = (id: number, patch: Partial<RoadmapQuarter>) =>
    setQuarters(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q));

  const updateTask = (qId: number, tId: number, patch: Partial<MacroTask>) =>
    setQuarters(qs => qs.map(q => q.id === qId ? {
      ...q, tasks: q.tasks.map(t => t.id === tId ? { ...t, ...patch } : t)
    } : q));

  const deleteTask = (qId: number, tId: number) =>
    setQuarters(qs => qs.map(q => q.id === qId ? { ...q, tasks: q.tasks.filter(t => t.id !== tId) } : q));

  const addTask = (quarterId: number, title: string, dueDate: string) => {
    const newTask: MacroTask = { id: Date.now(), title, dueDate, completed: false, expanded: false, notes: "" };
    setQuarters(qs => qs.map(q => q.id === quarterId ? { ...q, tasks: [...q.tasks, newTask] } : q));
  };

  const completedCount = TASKS.filter((t) => t.status === "completed").length;
  const totalCount = TASKS.length;

  const todayDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-full flex flex-col" style={{ background: "#0c0e15", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 border-b border-slate-800/60"
        style={{ background: "rgba(12,14,21,0.92)", backdropFilter: "blur(12px)" }}
      >
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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

        {/* Right: User info */}
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-900/50 bg-amber-950/30">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-semibold text-amber-400">12 Days</span>
          </div>

          {/* XP Bar */}
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-indigo-400">Level 5 · Apprentice</span>
            </div>
            <XPBar current={750} max={1000} />
          </div>

          {/* Avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              AK
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">

        {activeTab === "Dashboard" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column — Timeline */}
            <div className="col-span-2 space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-slate-100">Today's Schedule</h1>
                  <p className="text-xs text-slate-500 mt-0.5">{todayDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Completed</p>
                    <p className="text-sm font-semibold text-slate-200">{completedCount}/{totalCount} tasks</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#6366F1 ${(completedCount/totalCount)*360}deg, #1e293b 0)` }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#0c0e15" }}>
                      <span className="text-xs font-bold text-indigo-400">{Math.round((completedCount/totalCount)*100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Cards */}
              <div className="space-y-3">
                {TASKS.map((task) => (
                  <TaskCard key={task.id} task={task} onLog={setLogTask} />
                ))}
              </div>
            </div>

            {/* Right Column — Stats sidebar */}
            <div className="space-y-4">
              {/* Daily Progress */}
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Daily Progress</h3>
                <div className="space-y-3">
                  {[
                    { label: "Study Time", value: "4h 35m", target: "6h 00m", pct: 76, color: "#6366F1" },
                    { label: "Tasks Done", value: "2 / 5", target: "5 tasks", pct: 40, color: "#10B981" },
                    { label: "Focus Score", value: "87 / 100", target: "100", pct: 87, color: "#F97316" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="font-mono text-slate-300">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${item.pct}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming */}
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Up Next</h3>
                <div className="space-y-3">
                  {TASKS.filter(t => t.status === "pending").slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: t.categoryColor }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate">{t.title}</p>
                        <p className="text-xs text-slate-600 font-mono">{t.timeStart} · {t.plannedTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent XP */}
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">XP Activity</h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Morning Workout", xp: "+80", time: "07:35" },
                    { label: "Spring Boot Study", xp: "+120", time: "09:30" },
                    { label: "Streak Bonus", xp: "+50", time: "08:00" },
                  ].map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">{entry.label}</p>
                        <p className="text-xs text-slate-600 font-mono">{entry.time}</p>
                      </div>
                      <span className="text-xs font-semibold font-mono text-indigo-400">{entry.xp}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Total today</span>
                  <span className="text-sm font-bold font-mono text-indigo-400">+250 XP</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Performance" && (
          <div>
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-slate-100">Performance Overview</h1>
              <p className="text-xs text-slate-500 mt-0.5">Week of Aug 25 – Aug 31, 2026</p>
            </div>
            <PerformanceView />
          </div>
        )}

        {activeTab === "Badges" && (
          <div>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h1 className="text-lg font-semibold text-slate-100">Achievements</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {BADGES.filter(b => b.unlocked).length} of {BADGES.length} badges earned
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-900/40 bg-amber-950/20">
                <span className="text-amber-400 text-sm">🏆</span>
                <span className="text-xs font-medium text-amber-400">4 Earned</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {BADGES.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
            </div>
          </div>
        )}

        {activeTab === "Roadmap" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left: 2×2 seasonal grid */}
            <div className="col-span-2 space-y-4">
              {/* Roadmap header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-slate-100">Yearly Roadmap</h1>
                  <p className="text-xs text-slate-500 mt-0.5">4 seasonal quarters · click any field to edit inline</p>
                </div>
                {/* Global Add Task CTA */}
                <button
                  onClick={() => setAddTaskModal({ open: true })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(99,102,241,0.5)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(99,102,241,0.35)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add New Task
                </button>
              </div>

              {/* 2×2 Quarter grid */}
              <div className="grid grid-cols-2 gap-4">
                {quarters.map(q => (
                  <QuarterCard
                    key={q.id}
                    quarter={q}
                    onUpdate={updateQuarter}
                    onTaskUpdate={updateTask}
                    onTaskDelete={deleteTask}
                    onAddTask={(qId) => setAddTaskModal({ open: true, defaultQuarterId: qId })}
                  />
                ))}
              </div>
            </div>

            {/* Right: Roadmap sidebar */}
            <RoadmapSidebar quarters={quarters} />
          </div>
        )}
      </main>

      {/* Time Log Modal */}
      {logTask && <TimeLogModal task={logTask} onClose={() => setLogTask(null)} />}

      {/* Add Task Modal */}
      {addTaskModal.open && (
        <AddTaskModal
          quarters={quarters}
          defaultQuarterId={addTaskModal.defaultQuarterId}
          onAdd={addTask}
          onClose={() => setAddTaskModal({ open: false })}
        />
      )}
    </div>
  );
}
