import React from "react";
import type { UserRole } from "../services/api";

export interface RoleConfig {
  label: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  description: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  STUDENT: {
    label: "Estudante",
    shortLabel: "Aluno",
    icon: "🎓",
    badgeBg: "bg-indigo-950/40",
    badgeText: "text-indigo-300",
    badgeBorder: "border-indigo-500/30",
    accentColor: "#6366F1",
    description: "Acesso à trilha de estudos, tarefas, gamificação e ranking pessoal.",
  },
  MENTOR: {
    label: "Professor / Mentor",
    shortLabel: "Mentor",
    icon: "👨‍🏫",
    badgeBg: "bg-cyan-950/40",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/30",
    accentColor: "#06B6D4",
    description: "Acompanhamento do progresso de horas, tarefas e XP dos alunos vinculados.",
  },
  ADMIN: {
    label: "Administrador",
    shortLabel: "Admin",
    icon: "🛡️",
    badgeBg: "bg-violet-950/40",
    badgeText: "text-violet-300",
    badgeBorder: "border-violet-500/30",
    accentColor: "#8B5CF6",
    description: "Gestão global de usuários, perfis de acesso, vínculos e comunicados do sistema.",
  },
};

export function getRoleConfig(role?: UserRole): RoleConfig {
  const effectiveRole = role || "STUDENT";
  return ROLE_CONFIGS[effectiveRole] || ROLE_CONFIGS.STUDENT;
}

export function RoleBadge({
  role,
  size = "md",
  className = "",
}: {
  role?: UserRole;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const config = getRoleConfig(role);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-sm ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses[size]} ${className}`}
      title={`Perfil de acesso: ${config.label}`}
    >
      <span className="leading-none">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export default RoleBadge;
