import { useState, useEffect, useCallback } from "react";
import {
  getLeaderboard,
  type LeaderboardUserResponse,
} from "../services/api";

interface LeaderboardProps {
  currentUserId?: number;
}

const getLevelTitle = (level: number): string => {
  if (level <= 1) return "Novice";
  if (level <= 3) return "Apprentice";
  if (level <= 5) return "Scholar";
  if (level <= 8) return "Master";
  if (level <= 12) return "Grandmaster";
  return "Legend";
};

const getInitials = (name: string): string => {
  if (!name) return "ST";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard();
      if (Array.isArray(data)) {
        // Ordena por XP decrescente (caso a API não venha 100% ordenada)
        const sorted = [...data].sort((a, b) => (b.currentXp || 0) - (a.currentXp || 0));
        setUsers(sorted);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.warn("[StudyOS Leaderboard] Falha ao buscar ranking:", err);
      setError(
        err?.message ||
          "Não foi possível carregar a tabela de classificação. Verifique se o backend Spring Boot está ativo."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Encontra a posição do usuário logado
  const currentUserIndex = users.findIndex((u) => u.id === currentUserId);
  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;
  const currentUserData = currentUserIndex !== -1 ? users[currentUserIndex] : null;

  // Separação Top 3 e Resto da Tabela
  const top1 = users[0] || null;
  const top2 = users[1] || null;
  const top3 = users[2] || null;
  const restOfUsers = users.slice(3);

  // ── Skeleton Loader ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-800/60 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-slate-800/40 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-slate-800/60 rounded-xl animate-pulse" />
        </div>

        {/* Podium Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          <div className="h-64 rounded-3xl bg-slate-900/40 border border-slate-800/50 animate-pulse" />
          <div className="h-76 rounded-3xl bg-slate-900/40 border border-slate-800/50 animate-pulse" />
          <div className="h-56 rounded-3xl bg-slate-900/40 border border-slate-800/50 animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-10 text-center rounded-3xl border border-red-500/20 bg-red-950/10 flex flex-col items-center justify-center max-w-xl mx-auto my-8">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl mb-4 text-red-400">
          ⚠️
        </div>
        <h3 className="text-base font-semibold text-slate-100 mb-1">Erro ao Carregar o Leaderboard</h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed text-center">{error}</p>
        <button
          onClick={fetchLeaderboardData}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
            boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          Recarregar Ranking
        </button>
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────
  if (users.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-slate-800/60 bg-slate-900/30 flex flex-col items-center justify-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4 text-indigo-400">
          🏆
        </div>
        <h3 className="text-base font-semibold text-slate-100">Nenhum Estudante no Ranking Ainda</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed mb-6">
          Cadastre tarefas e registre sessões de estudo para começar a ganhar pontos de XP e inaugurar a tabela global de classificação!
        </p>
        <button
          onClick={fetchLeaderboardData}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white transition-all cursor-pointer"
        >
          Atualizar Tabela
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header do Leaderboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏆</span>
            <h1 className="heading-fluid-title font-bold text-slate-100 tracking-tight">Leaderboard Global</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-mono font-medium border border-indigo-500/20">
              Temporada 2026
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Competição diária de XP e consistência entre todos os estudantes da plataforma StudyOS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Card Resumo do Usuário Logado */}
          {currentUserRank && currentUserData && (
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 shadow-md shadow-indigo-950/40">
              <div className="text-center pr-2 border-r border-indigo-500/20">
                <span className="text-[10px] uppercase font-semibold text-indigo-400 block tracking-wider">Sua Posição</span>
                <span className="text-sm font-extrabold text-white font-mono">#{currentUserRank}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{currentUserData.name}</p>
                <p className="text-[11px] text-indigo-300 font-mono">
                  {currentUserData.currentXp?.toLocaleString() || 0} XP
                </p>
              </div>
            </div>
          )}

          <button
            onClick={fetchLeaderboardData}
            title="Atualizar dados do Leaderboard"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── PÓDIO DE DESTAQUE (TOP 3) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
        {/* 🥈 2º LUGAR (Prata) */}
        {top2 ? (
          <div
            className={`order-2 md:order-1 rounded-3xl border p-5 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
              top2.id === currentUserId
                ? "border-slate-300/60 bg-gradient-to-b from-slate-700/25 to-slate-900/60 shadow-xl shadow-slate-900/40 ring-1 ring-slate-400/40"
                : "border-slate-700/40 bg-gradient-to-b from-slate-800/20 to-slate-950/40"
            }`}
          >
            {/* Glow decorativo de prata */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-slate-400/10 blur-2xl pointer-events-none" />

            {/* Badge de Posição */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-700/40 border border-slate-500/40 text-slate-300 text-xs font-bold mb-3 shadow-inner">
              <span>🥈</span> 2º Lugar
            </div>

            {/* Avatar */}
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-600 flex items-center justify-center text-slate-950 font-bold text-lg shadow-lg shadow-slate-900/50 border-2 border-slate-300">
                {getInitials(top2.name)}
              </div>
              {top2.id === currentUserId && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider border border-indigo-400">
                  Você
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-100 truncate max-w-[180px]">{top2.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Level {top2.level || 1} · <span className="text-slate-300 font-medium">{getLevelTitle(top2.level || 1)}</span>
            </p>

            {/* Streak & XP */}
            <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-amber-400">
                <span>🔥</span>
                <span className="font-semibold">{top2.streakDays || 0}d</span>
              </div>
              <div className="font-mono font-bold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                {top2.currentXp?.toLocaleString() || 0} XP
              </div>
            </div>
          </div>
        ) : (
          <div className="order-2 md:order-1 h-56 rounded-3xl border border-dashed border-slate-800/60 bg-slate-900/10 flex items-center justify-center text-slate-600 text-xs">
            Aguardando 2º colocado
          </div>
        )}

        {/* 👑 🥇 1º LUGAR (Ouro com Coroa & Altura Destacada) */}
        {top1 ? (
          <div
            className={`order-1 md:order-2 rounded-3xl border p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.03] shadow-2xl ${
              top1.id === currentUserId
                ? "border-amber-400/80 bg-gradient-to-b from-amber-500/25 via-amber-950/20 to-slate-950/80 shadow-amber-500/20 ring-2 ring-amber-400/50"
                : "border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-yellow-950/10 to-slate-950/60 shadow-amber-950/30"
            }`}
          >
            {/* Glow de Ouro Intenso */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

            {/* Coroa Flutuante */}
            <div className="text-3xl mb-1 filter drop-shadow animate-bounce">
              👑
            </div>

            {/* Badge de 1º Lugar */}
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-extrabold mb-3 shadow-md shadow-amber-950/50">
              <span>🥇</span> Campeão Atual
            </div>

            {/* Avatar Dourado */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-xl shadow-amber-900/60 border-2 border-amber-300">
                {getInitials(top1.name)}
              </div>
              {top1.id === currentUserId && (
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider border border-indigo-400 shadow-md">
                  Você
                </span>
              )}
            </div>

            <h3 className="text-base font-extrabold text-amber-100 truncate max-w-[200px]">{top1.name}</h3>
            <p className="text-xs text-amber-400/90 font-medium mt-0.5">
              Level {top1.level || 1} · {getLevelTitle(top1.level || 1)}
            </p>

            {/* Streak & XP */}
            <div className="w-full mt-5 pt-3.5 border-t border-amber-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                <span>🔥</span>
                <span className="font-bold">{top1.streakDays || 0} Dias Streak</span>
              </div>
              <div className="font-mono font-extrabold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-400/40 shadow-inner">
                {top1.currentXp?.toLocaleString() || 0} XP
              </div>
            </div>
          </div>
        ) : null}

        {/* 🥉 3º LUGAR (Bronze) */}
        {top3 ? (
          <div
            className={`order-3 rounded-3xl border p-5 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
              top3.id === currentUserId
                ? "border-amber-700/60 bg-gradient-to-b from-amber-800/25 to-slate-900/60 shadow-xl shadow-orange-950/40 ring-1 ring-amber-600/40"
                : "border-amber-800/40 bg-gradient-to-b from-amber-900/15 to-slate-950/40"
            }`}
          >
            {/* Glow de Bronze */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-amber-700/10 blur-2xl pointer-events-none" />

            {/* Badge de 3º Lugar */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-400 text-xs font-bold mb-3 shadow-inner">
              <span>🥉</span> 3º Lugar
            </div>

            {/* Avatar */}
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-amber-100 font-bold text-lg shadow-lg shadow-amber-950/50 border-2 border-amber-600">
                {getInitials(top3.name)}
              </div>
              {top3.id === currentUserId && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider border border-indigo-400">
                  Você
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-100 truncate max-w-[180px]">{top3.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Level {top3.level || 1} · <span className="text-slate-300 font-medium">{getLevelTitle(top3.level || 1)}</span>
            </p>

            {/* Streak & XP */}
            <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-amber-400">
                <span>🔥</span>
                <span className="font-semibold">{top3.streakDays || 0}d</span>
              </div>
              <div className="font-mono font-bold text-amber-200 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/40">
                {top3.currentXp?.toLocaleString() || 0} XP
              </div>
            </div>
          </div>
        ) : (
          <div className="order-3 h-52 rounded-3xl border border-dashed border-slate-800/60 bg-slate-900/10 flex items-center justify-center text-slate-600 text-xs">
            Aguardando 3º colocado
          </div>
        )}
      </div>

      {/* ── TABELA GERAL (DO 4º LUGAR EM DIANTE) ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-200 tracking-tight">Classificação Geral</h2>
            <span className="text-xs text-slate-500 font-mono">({users.length} estudantes cadastrados)</span>
          </div>
        </div>

        {restOfUsers.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-950/40">
                  <th className="py-3 px-3 sm:px-6 w-14 sm:w-16 text-center">Posição</th>
                  <th className="py-3 px-3 sm:px-6">Estudante</th>
                  <th className="py-3 px-3 sm:px-6">Nível</th>
                  <th className="py-3 px-3 sm:px-6 text-center">Sequência</th>
                  <th className="py-3 px-3 sm:px-6 text-right">XP Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {restOfUsers.map((u, idx) => {
                  const rank = idx + 4;
                  const isCurrent = u.id === currentUserId;

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-indigo-950/40 text-indigo-200 border-l-4 border-l-indigo-500 font-medium"
                          : "hover:bg-slate-800/30 text-slate-300"
                      }`}
                    >
                      {/* Posição */}
                      <td className="py-3.5 px-3 sm:px-6 text-center font-mono font-bold text-slate-400">
                        #{rank}
                      </td>

                      {/* Nome + Avatar */}
                      <td className="py-3.5 px-3 sm:px-6">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                              isCurrent
                                ? "bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-400"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className={`font-semibold truncate max-w-[120px] sm:max-w-[180px] ${isCurrent ? "text-white" : "text-slate-100"}`}>
                                {u.name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 flex-shrink-0">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">{getLevelTitle(u.level || 1)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Nível */}
                      <td className="py-3.5 px-3 sm:px-6">
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60 whitespace-nowrap">
                          Lvl {u.level || 1}
                        </span>
                      </td>

                      {/* Streak */}
                      <td className="py-3.5 px-3 sm:px-6 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/30 text-amber-400 text-xs font-semibold border border-amber-900/30">
                          🔥 {u.streakDays || 0}d
                        </span>
                      </td>

                      {/* XP Total */}
                      <td className="py-3.5 px-3 sm:px-6 text-right font-mono font-bold text-indigo-400 text-sm whitespace-nowrap">
                        {u.currentXp?.toLocaleString() || 0} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            Todos os estudantes ativos já estão exibidos no Pódio de Destaque acima.
          </div>
        )}
      </div>
    </div>
  );
}
