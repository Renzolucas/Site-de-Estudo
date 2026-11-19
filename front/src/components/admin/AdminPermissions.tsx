import React from "react";
import RoleBadge from "../roles";

export default function AdminPermissions() {
  const matrixRows = [
    {
      title: "Visualizar dados",
      student: "Apenas seus próprios dados, tarefas, roadmap, gamificação e ranking pessoal.",
      mentor: "Resumo pedagógico dos alunos vinculados (horas, tarefas e XP). Não vê anotações privadas.",
      admin: "Acesso global a todos os usuários, tarefas institucionais, métricas consolidadas e auditoria.",
    },
    {
      title: "Cadastrar registros",
      student: "Tarefas pessoais, anotações de estudo e registros de tempo dedicado.",
      mentor: "Tarefas pessoais; envio de comunicados aos alunos vinculados.",
      admin: "Usuários com qualquer perfil (Estudante, Mentor, Admin) e comunicados gerais do sistema.",
    },
    {
      title: "Alterar registros",
      student: "Apenas seus próprios dados cadastrais (nome, senha) e tarefas de estudo.",
      mentor: "Apenas seus próprios dados cadastrais e senha pessoal.",
      admin: "Papéis de usuários, status de ativação/desativação e vínculos de mentorias.",
    },
    {
      title: "Excluir registros",
      student: "Apenas suas próprias tarefas criadas e registros de tempo pessoais.",
      mentor: "Apenas suas próprias tarefas e anotações pessoais.",
      admin: "Governança: apenas desativa contas de usuários; sem exclusão física definitiva no banco.",
    },
    {
      title: "Administrar acessos",
      student: "Nenhum acesso de gestão de contas.",
      mentor: "Nenhum acesso de gestão de contas ou papéis.",
      admin: "Gestão completa de contas, ativação/desativação e atribuição de papéis de usuários.",
    },
    {
      title: "Acessar informações restritas",
      student: "Nenhum acesso a dados de outros alunos ou de professores.",
      mentor: "Não visualiza e-mails nem anotações privadas dos estudantes orientados.",
      admin: "Visualiza e-mails dos usuários para governança e logs completos de auditoria do sistema.",
    },
  ];

  const securityRules = [
    {
      icon: "🛡️",
      title: "Validação estrita no servidor",
      desc: "O papel e status do usuário são verificados no banco de dados a cada requisição via token JWT. Privilégios enviados pelo cliente são categoricamente ignorados.",
    },
    {
      icon: "🔒",
      title: "Desativação em vez de exclusão física",
      desc: "Nenhuma conta de usuário é destruída fisicamente no banco de dados. Contas são desativadas e podem ser reativadas, preservando o histórico de estudo e auditoria.",
    },
    {
      icon: "👑",
      title: "Proteção de quórum administrativo",
      desc: "O administrador não pode alterar o próprio papel nem desativar sua própria conta. O sistema bloqueia a demotoção ou desativação do último administrador ativo.",
    },
    {
      icon: "👁️‍🗨️",
      title: "Privacidade e isolamento pedagógico",
      desc: "O e-mail só é visível ao administrador. Professores e mentores acompanham o progresso acadêmico sem acesso às anotações íntimas ou e-mails dos alunos.",
    },
    {
      icon: "🔑",
      title: "Senhas nunca expostas",
      desc: "Nenhum endpoint ou DTO da plataforma expõe campos de senha ou hashes em payloads de resposta, mantendo total conformidade com boas práticas de segurança.",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="heading-fluid-title font-semibold text-slate-100">Matriz de Permissões</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Governança, controle de privilégios de acesso e regras de segurança institucional
          </p>
        </div>
      </div>

      {/* Matriz de Permissões (Tabela no Desktop / Cards no Mobile) */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-800/50">
          <h2 className="text-sm font-semibold text-slate-200">Matriz de Privilégios por Perfil</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparativo de direitos de acesso entre Estudante, Mentor e Administrador
          </p>
        </div>

        {/* Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800/60">
              <tr>
                <th className="py-3 px-4 w-1/4">Categoria</th>
                <th className="py-3 px-4 w-1/4">
                  <RoleBadge role="STUDENT" size="sm" />
                </th>
                <th className="py-3 px-4 w-1/4">
                  <RoleBadge role="MENTOR" size="sm" />
                </th>
                <th className="py-3 px-4 w-1/4">
                  <RoleBadge role="ADMIN" size="sm" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {matrixRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{row.title}</td>
                  <td className="py-3.5 px-4 text-slate-300 leading-relaxed">{row.student}</td>
                  <td className="py-3.5 px-4 text-slate-300 leading-relaxed">{row.mentor}</td>
                  <td className="py-3.5 px-4 text-slate-300 leading-relaxed">{row.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (< 768px) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {matrixRows.map((row, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 space-y-2.5">
              <h3 className="text-xs font-semibold text-indigo-300">{row.title}</h3>
              <div className="space-y-2 text-xs divide-y divide-slate-850">
                <div className="pt-1.5 space-y-0.5">
                  <RoleBadge role="STUDENT" size="sm" />
                  <p className="text-slate-300 mt-1">{row.student}</p>
                </div>
                <div className="pt-2 space-y-0.5">
                  <RoleBadge role="MENTOR" size="sm" />
                  <p className="text-slate-300 mt-1">{row.mentor}</p>
                </div>
                <div className="pt-2 space-y-0.5">
                  <RoleBadge role="ADMIN" size="sm" />
                  <p className="text-slate-300 mt-1">{row.admin}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Regras de Segurança Institucional */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-800/50">
          <h2 className="text-sm font-semibold text-slate-200">Regras de Segurança Institucional</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Diretrizes de arquitetura e conformidade obrigatórias em todas as etapas da plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {securityRules.map((rule, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-800/70 bg-slate-950/40 hover:border-slate-700 transition-all space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{rule.icon}</span>
                <h3 className="text-xs font-semibold text-slate-200">{rule.title}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
