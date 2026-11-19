import React, { useState, useEffect, useCallback } from "react";
import {
  getMentorAnnouncements,
  createMentorAnnouncement,
  getMentorStudents,
  type AnnouncementResponse,
  type MentorStudentSummary,
} from "../../services/api";

interface MentorAnnouncementsProps {
  addToast: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
  initialSelectedStudentId?: number | null;
  onClearInitialStudent?: () => void;
}

export default function MentorAnnouncements({
  addToast,
  initialSelectedStudentId,
  onClearInitialStudent,
}: MentorAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [students, setStudents] = useState<MentorStudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudentId ? String(initialSelectedStudentId) : "ALL"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Sincroniza studentId inicial se vier de navegação
  useEffect(() => {
    if (initialSelectedStudentId) {
      setSelectedStudentId(String(initialSelectedStudentId));
    }
  }, [initialSelectedStudentId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [annData, studentsData] = await Promise.all([
        getMentorAnnouncements(),
        getMentorStudents(),
      ]);
      setAnnouncements(annData);
      setStudents(studentsData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar avisos e alunos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

    if (selectedStudentId === "ALL" && students.length === 0) {
      setFormError("Você ainda não tem alunos vinculados para receber o comunicado.");
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmSend = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const studentIdNum =
        selectedStudentId !== "ALL" ? Number(selectedStudentId) : null;

      const created = await createMentorAnnouncement({
        title: title.trim(),
        message: message.trim(),
        studentId: studentIdNum,
      });

      addToast({
        type: "success",
        title: "Aviso Publicado",
        message: `Comunicado transmitido com sucesso para ${created.recipientsCount} estudante(s).`,
      });

      setTitle("");
      setMessage("");
      setSelectedStudentId("ALL");
      if (onClearInitialStudent) onClearInitialStudent();
      setConfirmModalOpen(false);
      loadData();
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

  const targetStudent = students.find((s) => String(s.id) === selectedStudentId);
  const recipientCountEstimate =
    selectedStudentId === "ALL" ? students.length : 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="heading-fluid-title font-semibold text-slate-100">Avisos e Orientações</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Envie comunicados, lembretes de prazos e feedbacks diretamente para o sino de notificações dos seus alunos
          </p>
        </div>
      </div>

      {/* Formulário de Criação de Aviso */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/50">
          <span className="text-lg">📢</span>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Novo Aviso da Mentoria</h2>
            <p className="text-xs text-slate-400">
              O texto será entregue em tempo real como uma notificação para os estudantes selecionados
            </p>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{formError}</span>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-rose-400 hover:text-rose-200 cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Título */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Título do Aviso *
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {title.length}/80
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Ex: Entrega do projeto da Estação Verão"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            {/* Destinatário */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Destinatário *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="ALL">
                  👥 Todos os meus alunos ({students.length})
                </option>
                {students.map((st) => (
                  <option key={st.id} value={String(st.id)}>
                    👤 Aluno: {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Conteúdo da Mensagem *
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {message.length}/300
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Escreva as instruções, orientações ou lembretes pedagógicos..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
              required
            />
          </div>

          {/* Botão de Envio */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-500">
              {selectedStudentId === "ALL"
                ? `Será enviado para ${students.length} aluno(s) orientados ativos.`
                : `Será enviado exclusivamente para ${targetStudent ? targetStudent.name : "o aluno selecionado"}.`}
            </p>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !message.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-end sm:self-auto"
              style={{
                background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
                boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
              }}
            >
              <span>📢</span>
              <span>Enviar Aviso</span>
            </button>
          </div>
        </form>
      </div>

      {/* Histórico de Avisos Enviados */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>📋</span> Histórico de Avisos Enviados ({announcements.length})
            </h2>
            <p className="text-xs text-slate-400">
              Registro dos comunicados emitidos por você para seus orientandos
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 text-rose-300 text-xs text-center">
            {error}
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum aviso transmitido por você até o momento.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => {
              const isOne = item.audience === "ONE_STUDENT";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isOne
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                        }`}
                      >
                        {isOne ? "👤 Aluno Específico" : "👥 Todos os Meus Alunos"}
                      </span>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-100">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono self-start sm:self-center">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-850 gap-1">
                    <span>
                      Enviado por: <strong className="text-slate-300 font-medium">{item.authorName}</strong>
                      {item.targetStudentName && (
                        <span> · Aluno: <strong className="text-emerald-300 font-medium">{item.targetStudentName}</strong></span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-indigo-400">
                      <span>✓</span>
                      <span>{item.recipientsCount} aluno(s) notificado(s)</span>
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
                <span className="text-slate-400">Destinatário: </span>
                <strong className="text-indigo-300">
                  {selectedStudentId === "ALL"
                    ? `Todos os meus alunos (${students.length} alunos)`
                    : `Aluno: ${targetStudent ? targetStudent.name : "Selecionado"}`}
                </strong>
              </div>
              <div className="text-slate-300 pt-1 border-t border-slate-800 leading-relaxed italic">
                "{message}"
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              O comunicado será transmitido diretamente para o sino de notificações dos estudantes selecionados.
              Será enviado para <strong>{recipientCountEstimate}</strong> aluno(s). Deseja confirmar?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 transition-colors font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)",
                }}
              >
                {isSubmitting ? "Transmitindo..." : "Confirmar e Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
