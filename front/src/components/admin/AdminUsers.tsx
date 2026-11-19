import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminUsers,
  getAdminMentors,
  createAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateAdminUserMentor,
  type AdminUserResponse,
  type AdminMentorSummaryResponse,
  type UserProfileResponse,
  type UserRole,
} from "../../services/api";
import RoleBadge from "../roles";

interface AdminUsersProps {
  currentUser: UserProfileResponse;
  addToast: (toast: {
    type: "success" | "info" | "xp" | "error";
    title: string;
    message: string;
  }) => void;
  initialNoMentorFilter?: boolean;
}

export default function AdminUsers({
  currentUser,
  addToast,
  initialNoMentorFilter = false,
}: AdminUsersProps) {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [mentors, setMentors] = useState<AdminMentorSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "inactive">("ALL");
  const [noMentorFilter, setNoMentorFilter] = useState(initialNoMentorFilter);

  // Estados dos Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<AdminUserResponse | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>("STUDENT");

  const [mentorModalUser, setMentorModalUser] = useState<AdminUserResponse | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);

  const [statusModalUser, setStatusModalUser] = useState<AdminUserResponse | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Form de Criação de Usuário
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>("STUDENT");
  const [newMentorId, setNewMentorId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        noMentor: noMentorFilter ? true : undefined,
      });
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar lista de usuários.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, noMentorFilter]);

  const fetchMentors = useCallback(async () => {
    try {
      const data = await getAdminMentors();
      setMentors(data);
    } catch (err) {
      console.warn("Falha ao carregar mentores para seletor:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  // Handlers de Criação
  const handleOpenCreateModal = () => {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setShowPassword(false);
    setNewRole("STUDENT");
    setNewMentorId(null);
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newName.trim()) {
      setCreateError("Informe o nome do usuário.");
      return;
    }
    if (!newEmail.trim()) {
      setCreateError("Informe o e-mail do usuário.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setCreateError("A senha inicial deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const created = await createAdminUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        mentorId: newRole === "STUDENT" ? newMentorId : null,
      });

      addToast({
        type: "success",
        title: "Usuário Criado",
        message: `Conta de ${created.name} (${created.role}) cadastrada com sucesso.`,
      });
      setIsCreateModalOpen(false);
      fetchUsers();
      fetchMentors();
    } catch (err: any) {
      setCreateError(err.message || "Falha ao criar usuário.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handlers de Mudança de Papel
  const handleOpenRoleModal = (user: AdminUserResponse) => {
    setRoleModalUser(user);
    setSelectedNewRole(user.role);
  };

  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return;
    setActionInProgress(true);
    try {
      await updateAdminUserRole(roleModalUser.id, selectedNewRole);
      addToast({
        type: "success",
        title: "Perfil Atualizado",
        message: `Papel de ${roleModalUser.name} alterado para ${selectedNewRole}.`,
      });
      setRoleModalUser(null);
      fetchUsers();
      fetchMentors();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Erro ao Atualizar",
        message: err.message || "Não foi possível alterar o papel do usuário.",
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Handlers de Status (Ativar / Desativar)
  const handleOpenStatusModal = (user: AdminUserResponse) => {
    setStatusModalUser(user);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalUser) return;
    setActionInProgress(true);
    const newStatus = !statusModalUser.active;
    try {
      await updateAdminUserStatus(statusModalUser.id, newStatus);
      addToast({
        type: "success",
        title: newStatus ? "Conta Ativada" : "Conta Desativada",
        message: `A conta de ${statusModalUser.name} foi ${newStatus ? "ativada" : "desativada"}.`,
      });
      setStatusModalUser(null);
      fetchUsers();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Erro ao Atualizar Status",
        message: err.message || "Não foi possível alterar o status da conta.",
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Handlers de Vínculo de Mentor
  const handleOpenMentorModal = (user: AdminUserResponse) => {
    setMentorModalUser(user);
    setSelectedMentorId(user.mentor?.id || null);
  };

  const handleConfirmMentorChange = async () => {
    if (!mentorModalUser) return;
    setActionInProgress(true);
    try {
      await updateAdminUserMentor(mentorModalUser.id, selectedMentorId);
      addToast({
        type: "success",
        title: "Vínculo de Mentor Atualizado",
        message: selectedMentorId
          ? `Mentor vinculado ao estudante ${mentorModalUser.name} com sucesso.`
          : `Vínculo de mentor removido de ${mentorModalUser.name}.`,
      });
      setMentorModalUser(null);
      fetchUsers();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Erro ao Atualizar Mentor",
        message: err.message || "Não foi possível atualizar o mentor do estudante.",
      });
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Botão Novo Usuário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="heading-fluid-title font-semibold text-slate-100">Gestão de Usuários</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Administre contas, perfis de acesso, vínculos de mentoria e ativação
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="self-start sm:self-auto min-h-[38px] px-4 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Novo usuário</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Campo Busca */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full min-h-[40px] pl-10 pr-4 py-1.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all outline-none"
            />
          </div>

          {/* Filtro por Papel */}
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="ALL">Todos os perfis</option>
              <option value="STUDENT">Estudantes</option>
              <option value="MENTOR">Mentores / Professores</option>
              <option value="ADMIN">Administradores</option>
            </select>

            {/* Filtro por Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "active" | "inactive")}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="ALL">Todos os status</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Desativados</option>
            </select>
          </div>
        </div>

        {/* Linha Inferior de Filtro Rápido */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/40 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={noMentorFilter}
              onChange={(e) => setNoMentorFilter(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500/30"
            />
            <span>Filtrar apenas estudantes sem mentor</span>
          </label>

          <span className="text-[11px] text-slate-500">
            {users.length} {users.length === 1 ? "usuário encontrado" : "usuários encontrados"}
          </span>
        </div>
      </div>

      {/* Lista de Usuários */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400">Carregando usuários...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center text-xs text-red-400">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-12 text-center flex flex-col items-center">
          <span className="text-3xl mb-2">🔍</span>
          <p className="text-sm font-semibold text-slate-300">Nenhum usuário localizado</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Tente ajustar os filtros de busca, perfil ou status para ver mais resultados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tabela no Desktop (>= 768px) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800/60">
                <tr>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Perfil</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Mentor Responsável</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  const isStudent = u.role === "STUDENT";

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Nome e E-mail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Perfil */}
                      <td className="py-3 px-4">
                        <RoleBadge role={u.role} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
                            u.active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.active ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                          {u.active ? "Ativo" : "Desativado"}
                        </span>
                      </td>

                      {/* Mentor Responsável */}
                      <td className="py-3 px-4 text-slate-300">
                        {isStudent ? (
                          u.mentor ? (
                            <span className="text-cyan-300 font-medium">👨‍🏫 {u.mentor.name}</span>
                          ) : (
                            <span className="text-amber-400/90 text-[11px] bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded-md">
                              Sem mentor
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Vincular Mentor (apenas estudante) */}
                          {isStudent && (
                            <button
                              onClick={() => handleOpenMentorModal(u)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-800/40 transition-all cursor-pointer"
                              title="Vincular ou alterar professor/mentor responsável"
                            >
                              Mentor
                            </button>
                          )}

                          {/* Botão Alterar Papel */}
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            disabled={isSelf}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/30 hover:bg-indigo-950/60 border border-indigo-800/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              isSelf
                                ? "Você não pode alterar o próprio papel"
                                : "Alterar perfil de acesso do usuário"
                            }
                          >
                            Perfil
                          </button>

                          {/* Botão Desativar / Reativar */}
                          <button
                            onClick={() => handleOpenStatusModal(u)}
                            disabled={isSelf}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.active
                                ? "text-amber-400 hover:text-amber-300 bg-amber-950/20 hover:bg-amber-950/50 border border-amber-900/40"
                                : "text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-900/40"
                            }`}
                            title={
                              isSelf
                                ? "Você não pode desativar sua própria conta"
                                : u.active
                                ? "Desativar conta"
                                : "Reativar conta"
                            }
                          >
                            {u.active ? "Desativar" : "Reativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards Empilhados no Mobile (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((u) => {
              const isSelf = u.id === currentUser.id;
              const isStudent = u.role === "STUDENT";

              return (
                <div key={u.id} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 text-xs truncate flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{u.email}</div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        u.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-emerald-400" : "bg-slate-500"}`} />
                      {u.active ? "Ativo" : "Desativado"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/40">
                    <RoleBadge role={u.role} size="sm" />
                    {isStudent && (
                      <div className="text-[11px]">
                        {u.mentor ? (
                          <span className="text-cyan-300">👨‍🏫 {u.mentor.name}</span>
                        ) : (
                          <span className="text-amber-400/90 bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded-md">
                            Sem mentor
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações no Mobile */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/40">
                    {isStudent && (
                      <button
                        onClick={() => handleOpenMentorModal(u)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-800/40"
                      >
                        Mentor
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenRoleModal(u)}
                      disabled={isSelf}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-400 bg-indigo-950/30 border border-indigo-800/40 disabled:opacity-40"
                    >
                      Perfil
                    </button>
                    <button
                      onClick={() => handleOpenStatusModal(u)}
                      disabled={isSelf}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border disabled:opacity-40 ${
                        u.active
                          ? "text-amber-400 bg-amber-950/20 border-amber-900/40"
                          : "text-emerald-400 bg-emerald-950/20 border-emerald-900/40"
                      }`}
                    >
                      {u.active ? "Desativar" : "Reativar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL 1: NOVO USUÁRIO ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>➕</span> Cadastrar Novo Usuário
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  required
                  className="w-full min-h-[40px] px-3.5 py-2 rounded-xl text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@studyos.com"
                  required
                  className="w-full min-h-[40px] px-3.5 py-2 rounded-xl text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Senha inicial</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full min-h-[40px] pl-3.5 pr-10 py-2 rounded-xl text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Informe a senha ao usuário; ele pode trocá-la depois na tela Meu Perfil.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Perfil de acesso</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none"
                  >
                    <option value="STUDENT">Estudante</option>
                    <option value="MENTOR">Professor / Mentor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                {newRole === "STUDENT" && (
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Mentor responsável</label>
                    <select
                      value={newMentorId || ""}
                      onChange={(e) => setNewMentorId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none"
                    >
                      <option value="">Sem mentor inicial</option>
                      {mentors.map((m) => (
                        <option key={m.id} value={m.id}>
                          👨‍🏫 {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCreate ? "Cadastrando..." : "Cadastrar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ALTERAR PERFIL (ROLE) ── */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>🛡️</span> Alterar Perfil de Acesso
            </h2>
            <p className="text-xs text-slate-300">
              Selecione o novo papel para <strong>{roleModalUser.name}</strong> ({roleModalUser.email}):
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Novo Papel</label>
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
                className="w-full min-h-[40px] px-3.5 py-2 rounded-xl text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none"
              >
                <option value="STUDENT">Estudante</option>
                <option value="MENTOR">Professor / Mentor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {/* Alerta de Impacto */}
            {roleModalUser.role === "MENTOR" && selectedNewRole !== "MENTOR" && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 leading-relaxed">
                ⚠️ <strong>Atenção:</strong> Ao mudar o perfil deste professor, todos os alunos orientados por ele ficarão sem mentor vinculado.
              </div>
            )}
            {roleModalUser.role === "STUDENT" && selectedNewRole !== "STUDENT" && roleModalUser.mentor && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 leading-relaxed">
                ℹ️ O vínculo deste estudante com o mentor <strong>{roleModalUser.mentor.name}</strong> será removido.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={actionInProgress}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                {actionInProgress ? "Atualizando..." : "Confirmar alteração"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: VINCULAR MENTOR ── */}
      {mentorModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>👨‍🏫</span> Atribuir Mentor Responsável
            </h2>
            <p className="text-xs text-slate-300">
              Selecione o professor/mentor para acompanhar o estudante <strong>{mentorModalUser.name}</strong>:
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Professor / Mentor</label>
              <select
                value={selectedMentorId || ""}
                onChange={(e) => setSelectedMentorId(e.target.value ? Number(e.target.value) : null)}
                className="w-full min-h-[40px] px-3.5 py-2 rounded-xl text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none"
              >
                <option value="">Nenhum mentor (Desvincular)</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    👨‍🏫 {m.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              O mentor acompanhará horas estudadas, tarefas concluídas e XP, sem acesso aos e-mails ou anotações privadas.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMentorModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMentorChange}
                disabled={actionInProgress}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 cursor-pointer"
              >
                {actionInProgress ? "Salvando..." : "Salvar vínculo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: CONFIRMAÇÃO STATUS (DESATIVAR / REATIVAR) ── */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{statusModalUser.active ? "⚠️" : "✨"}</span>
              {statusModalUser.active ? "Confirmar Desativação de Conta" : "Confirmar Reativação de Conta"}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {statusModalUser.active ? (
                <>
                  Você está prestes a desativar a conta de <strong>{statusModalUser.name}</strong> ({statusModalUser.email}).
                  O usuário perderá o acesso imediatamente. Todos os registros serão preservados e a conta poderá ser reativada a qualquer momento.
                </>
              ) : (
                <>
                  Deseja reativar a conta de <strong>{statusModalUser.name}</strong> ({statusModalUser.email})?
                  O usuário voltará a ter acesso imediato à plataforma com as credenciais já cadastradas.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={actionInProgress}
                className={`px-4 py-2 rounded-xl text-xs font-medium text-white disabled:opacity-50 cursor-pointer ${
                  statusModalUser.active
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {actionInProgress
                  ? "Processando..."
                  : statusModalUser.active
                  ? "Desativar conta"
                  : "Reativar conta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
