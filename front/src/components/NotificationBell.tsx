import { useState, useEffect, useRef, useCallback } from "react";
import type { NotificationResponse, NotificationType } from "../services/api";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/api";

interface NotificationBellProps {
  onOpenAll: () => void;
  addToast: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
}

export const getNotificationEmoji = (type: NotificationType): string => {
  switch (type) {
    case "WELCOME":
      return "👋";
    case "LEVEL_UP":
      return "🎉";
    case "FROZEN_EARNED":
      return "🧊";
    case "PASSWORD_CHANGED":
      return "🔒";
    case "TASK_DUE_SOON":
      return "⏰";
    case "TASK_OVERDUE":
      return "⚠️";
    case "ANNOUNCEMENT":
      return "📢";
    default:
      return "🔔";
  }
};

export const formatRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return "agora";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `há ${diffHour}h`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return "ontem";
    if (diffDays < 7) return `há ${diffDays} dias`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return dateStr;
  }
};

export default function NotificationBell({ onOpenAll, addToast }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastUnreadCountRef = useRef<number | null>(null);

  // Consulta contagem de não lidas com disparo de toast caso aumente
  const fetchUnreadCount = useCallback(
    async (isInitial = false) => {
      try {
        const res = await getUnreadNotificationsCount();
        const newCount = res?.unreadCount ?? 0;
        setUnreadCount(newCount);

        if (!isInitial && lastUnreadCountRef.current !== null && newCount > lastUnreadCountRef.current) {
          addToast({
            type: "info",
            title: "Notificação",
            message: "Você tem uma nova notificação",
          });
        }
        lastUnreadCountRef.current = newCount;
      } catch {
        // Ignora silenciosamente se a API estiver indisponível
      }
    },
    [addToast]
  );

  // Polling a cada 30 segundos
  useEffect(() => {
    fetchUnreadCount(true);
    const interval = setInterval(() => {
      fetchUnreadCount(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Busca as 5 notificações mais recentes ao abrir o dropdown
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getNotifications(false, 5)
        .then((data) => {
          setNotifications(data || []);
        })
        .catch((err) => {
          console.warn("Erro ao buscar notificações recentes:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  // Fechamento ao clicar fora ou pressionar a tecla Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Marca uma notificação individual como lida
  const handleItemClick = async (notif: NotificationResponse) => {
    if (!notif.read) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, read: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        if (lastUnreadCountRef.current !== null) {
          lastUnreadCountRef.current = Math.max(0, lastUnreadCountRef.current - 1);
        }
      } catch (e) {
        console.warn("Erro ao marcar notificação como lida:", e);
      }
    }
  };

  // Marca todas como lidas
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      lastUnreadCountRef.current = 0;
    } catch (e) {
      console.warn("Erro ao marcar todas como lidas:", e);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Botão Redondo com Sino */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notificações"
        title="Notificações"
        className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all cursor-pointer ${
          unreadCount > 0
            ? "border-indigo-500/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-950/50 hover:border-indigo-500/60"
            : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
        } ${isOpen ? "ring-2 ring-indigo-500/40" : ""}`}
      >
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
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {/* Contador de não lidas (máximo 9+) */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-[#0c0e15] shadow-sm shadow-indigo-600/50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Painel Flutuante (Dropdown) */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[340px] sm:w-[360px] max-w-[92vw] rounded-2xl border border-slate-800/80 bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-fade-in flex flex-col"
          style={{ background: "rgba(12, 14, 21, 0.96)" }}
        >
          {/* Header do Painel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">Notificações</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors cursor-pointer"
              title="Fechar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Lista das 5 Recentes */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-800/50">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Carregando notificações...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 text-base mb-2">
                  🔔
                </div>
                <p className="text-xs font-semibold text-slate-300">Nenhuma notificação por aqui</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Você está em dia com tudo!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    notif.read
                      ? "hover:bg-slate-900/40 text-slate-400"
                      : "bg-indigo-950/20 hover:bg-indigo-950/30 text-slate-200"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center text-sm flex-shrink-0">
                    {getNotificationEmoji(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${notif.read ? "text-slate-300" : "text-slate-100"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" title="Não lida" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-slate-950/80 border-t border-slate-800/60 text-xs">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-slate-400 hover:text-indigo-400 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors cursor-pointer text-[11px] font-medium"
            >
              Marcar todas como lidas
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAll();
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer text-[11px]"
            >
              Ver todas →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
