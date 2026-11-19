import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminAnnouncements,
  createAdminAnnouncement,
  type AnnouncementResponse,
  type AnnouncementAudience,
} from "../../services/api";

interface AdminAnnouncementsProps {
  addToast: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
}

export default function AdminAnnouncements({ addToast }: AdminAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar histórico de comunicados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (cleanTitle.length < 3 || cleanTitle.length > 80) {
      setFormError("O título deve ter entre 3 e 80 caracteres.");
      return;
    }
    if (cleanMessage.length < 5 || cleanMessage.length > 300) {
      setFormError("A mensagem deve ter entre 5 e 300 caracteres.");
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmSend = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const created = await createAdminAnnouncement({
        title: title.trim(),
        message: message.trim(),
        audience,
      });

      addToast({
        type: "success",
        title: "Aviso Publicado",
        message: `Comunicado transmitido com sucesso para ${created.recipientsCount} usuário(s) ativo(s).`,
      });

      setTitle("");
      setMessage("");
      setAudience("ALL");
      setConfirmModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setFormError(err.message || "Falha ao enviar o comunicado.");
      setConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
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

  const getAudienceConfig = (aud: AnnouncementAudience) => {
    switch (aud) {
      case "STUDENTS":
        return {
          label: "Estudantes",
          badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
          icon: "🎓",
        };
      case "MENTORS":
        return {
          label: "Mentores / Professores",
          badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
          icon: "👨‍🏫",
        };
      default:
        return {
          label: "Todos os Usuários",
          badge: "bg-violet-500/15 text-violet-400 border-violet-500/30",
          icon: "🌐",
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="heading-fluid-title font-semibold text-slate-100">Comunicados e Avisos</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Publique avisos institucionais direcionados diretamente para as notificações dos usuários
          </p>
        </div>
      </div>

      {/* Formulário de Criação de Aviso */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/50">
          <span className="text-lg">📢</span>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Novo Comunicado Institucional</h2>
            <p className="text-xs text-slate-500">
              O aviso gerará uma notificação no sino dos usuários ativos selecionados
            </p>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-4 text-xs">
          {/* Título com Contador */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-300">Título do comunicado</label>
              <span className={`text-[11px] font-mono ${title.length > 80 ? "text-red-400" : "text-slate-500"}`}>
                {title.length}/80
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Manutenção agendada para sábado às 22h"
              maxLength={80}
              required
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs text-slate-200 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Mensagem com Contador */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-300">Mensagem completa</label>
              <span className={`text-[11px] font-mono ${message.length > 300 ? "text-red-400" : "text-slate-500"}`}>
                {message.length}/300
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva as orientações, datas e informações relevantes para os usuários..."
              rows={3}
              maxLength={300}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-200 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Público-alvo (Botões de Alternância) */}
          <div>
            <label className="block font-medium text-slate-300 mb-2">Público-alvo do aviso</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(["ALL", "STUDENTS", "MENTORS"] as AnnouncementAudience[]).map((aud) => {
                const conf = getAudienceConfig(aud);
                const isSelected = audience === aud;
                return (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => setAudience(aud)}
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-500/20"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <span>{conf.icon}</span>
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || title.trim().length < 3 || message.trim().length < 5}
              className="min-h-[40px] px-5 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
            >
              Publicar comunicado
            </button>
          </div>
        </form>
      </div>

      {/* Histórico de Comunicados */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Histórico de Comunicados</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro dos comunicados emitidos pela administração
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {announcements.length} {announcements.length === 1 ? "publicação" : "publicações"}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400">Carregando avisos...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-xs text-red-400 text-center">
            {error}
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-slate-800/50 bg-slate-950/30 p-10 text-center flex flex-col items-center">
            <span className="text-3xl mb-2">📫</span>
            <p className="text-sm font-medium text-slate-300">Nenhum comunicado enviado ainda</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Use o formulário acima para publicar seu primeiro aviso geral ou direcionado para a turma.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => {
              const audConfig = getAudienceConfig(item.audience);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${audConfig.badge}`}>
                        {audConfig.icon} {audConfig.label}
                      </span>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-100">{item.title}</h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono self-start sm:self-center">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-850">
                    <span>
                      Enviado por: <strong className="text-slate-300 font-medium">{item.authorName}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-medium text-indigo-400">
                      <span>✓</span>
                      <span>{item.recipientsCount} destinatário(s) notificado(s)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Envio */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>📢</span> Confirmar Envio de Comunicado
            </h2>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Título: </span>
                <strong className="text-slate-200">{title}</strong>
              </div>
              <div>
                <span className="text-slate-400">Público: </span>
                <strong className="text-indigo-300">{getAudienceConfig(audience).label}</strong>
              </div>
              <div className="text-slate-300 pt-1 border-t border-slate-800 leading-relaxed italic">
                "{message}"
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              O aviso será transmitido diretamente para o sino de notificações dos usuários ativos deste público. Deseja confirmar a publicação?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Enviando..." : "Confirmar e enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
