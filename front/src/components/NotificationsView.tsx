import { useState, useEffect, useCallback } from "react";
import type { NotificationResponse } from "../services/api";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/api";
import { getNotificationEmoji, formatRelativeTime } from "./NotificationBell";

interface NotificationsViewProps {
  onBack: () => void;
  addToast: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
}

export default function NotificationsView({ onBack, addToast }: NotificationsViewProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotifications(filter === "unread", 100);
      setNotifications(data || []);
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar as notificações.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      addToast({
        type: "success",
        title: "Notificações",
        message: "Notificação marcada como lida.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Erro",
        message: err?.message || "Não foi possível marcar a notificação.",
      });
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      addToast({
        type: "success",
        title: "Notificações",
        message: "Todas as notificações foram marcadas como lidas.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Erro",
        message: err?.message || "Não foi possível marcar todas as notificações.",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      addToast({
        type: "info",
        title: "Notificações",
        message: "Notificação excluída.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Erro",
        message: err?.message || "Não foi possível excluir a notificação.",
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer group mb-1.5"
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
          <h1 className="heading-fluid-title font-semibold text-slate-100">Notificações</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe avisos e lembretes da sua conta
          </p>
        </div>

        {/* Botão Marcar todas como lidas */}
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || unreadCount === 0}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/70 hover:bg-slate-700/90 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 self-start sm:self-auto"
          >
            {isMarkingAll ? (
              <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            <span>Marcar todas como lidas</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            filter === "all"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === "unread"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <span>Não lidas</span>
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === "unread" ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-300"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 sm:p-6 shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Carregando notificações...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/40 text-red-300 text-xs flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadNotifications}
              className="px-3 py-1 rounded-lg bg-red-900/50 hover:bg-red-900/80 text-white text-xs cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-500 text-2xl mb-3 shadow-sm">
              🔔
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Nenhuma notificação por aqui</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {filter === "unread"
                ? "Você já visualizou todas as suas notificações pendentes."
                : "Quando houver avisos, prazos ou conquistas, eles aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  notif.read
                    ? "border-slate-800/60 bg-slate-950/40 text-slate-400"
                    : "border-indigo-500/30 bg-indigo-950/15 text-slate-200 shadow-sm shadow-indigo-950/20"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg flex-shrink-0 mt-0.5 sm:mt-0">
                    {getNotificationEmoji(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          notif.read ? "text-slate-300" : "text-slate-100"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" title="Não lida" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1.5 block">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Ações da notificação */}
                <div className="flex items-center gap-1.5 sm:self-center self-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1"
                      title="Marcar como lida"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Lida</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(notif.id)}
                    className="min-h-[32px] w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
                    title="Excluir notificação"
                    aria-label="Excluir notificação"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
