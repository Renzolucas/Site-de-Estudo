/**
 * StudyOS Frontend - API Integration Service
 * Conexão com o backend REST Java Spring Boot (http://localhost:8080/api)
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:8080/api/v1';

const DEFAULT_USER_ID = 1;

/**
 * Função utilitária para requisições HTTP padronizadas com tratamento de erros
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Se a resposta for 204 No Content (ex: DELETE)
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Erro HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TAREFAS (/tasks)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca tarefas por estação do ano (SUMMER, AUTUMN, WINTER, SPRING).
 * @param {string} season - Estação do ano ('SUMMER' | 'AUTUMN' | 'WINTER' | 'SPRING')
 * @param {number} [userId=1] - ID do usuário
 * @returns {Promise<Array>} Lista de tarefas da estação
 */
export async function getTasksBySeason(season, userId = DEFAULT_USER_ID) {
  if (!season) {
    throw new Error('O parâmetro "season" é obrigatório.');
  }
  const formattedSeason = season.toUpperCase();
  const endpoint = `/tasks/user/${userId}?season=${encodeURIComponent(formattedSeason)}`;
  return await fetchApi(endpoint, { method: 'GET' });
}

/**
 * Busca todas as tarefas de um usuário.
 * @param {number} [userId=1] - ID do usuário
 * @param {string} [status] - Filtro opcional por status ('PENDING', 'IN_PROGRESS', 'PARTIAL', 'COMPLETED')
 * @returns {Promise<Array>} Lista de tarefas
 */
export async function getTasks(userId = DEFAULT_USER_ID, status = null) {
  let endpoint = `/tasks/user/${userId}`;
  if (status) {
    endpoint += `?status=${encodeURIComponent(status.toUpperCase())}`;
  }
  return await fetchApi(endpoint, { method: 'GET' });
}

/**
 * Busca uma tarefa específica pelo ID.
 * @param {number} taskId - ID da tarefa
 * @returns {Promise<Object>} Dados da tarefa
 */
export async function getTaskById(taskId) {
  if (!taskId) throw new Error('O ID da tarefa é obrigatório.');
  return await fetchApi(`/tasks/${taskId}`, { method: 'GET' });
}

/**
 * Cria uma nova tarefa ou macro-tarefa.
 * @param {Object} taskData - Dados da tarefa a ser criada
 * @param {number} [taskData.userId=1] - ID do usuário proprietário
 * @param {string} taskData.title - Título da tarefa
 * @param {string} [taskData.description] - Descrição/notas da tarefa
 * @param {string} [taskData.category='JAVA_BACKEND'] - Categoria (JAVA_BACKEND, FRONTEND, DATABASE, DEVOPS, ENGLISH, EXERCISE, READING, OTHER)
 * @param {string} [taskData.season='SUMMER'] - Estação (SUMMER, AUTUMN, WINTER, SPRING)
 * @param {number} [taskData.plannedDurationMinutes=60] - Duração estimada em minutos
 * @param {string} [taskData.targetDate] - Data limite prevista (YYYY-MM-DD)
 * @param {number} [taskData.xpReward=80] - XP concedido ao completar
 * @returns {Promise<Object>} Tarefa criada retornada pelo backend
 */
export async function createTask(taskData) {
  if (!taskData || !taskData.title) {
    throw new Error('O título da tarefa é obrigatório.');
  }

  // Normalização e valores padrão
  const payload = {
    userId: taskData.userId || DEFAULT_USER_ID,
    title: taskData.title.trim(),
    description: taskData.description || taskData.notes || '',
    category: (taskData.category || 'JAVA_BACKEND').toUpperCase().replace(/\s+/g, '_'),
    season: (taskData.season || 'SUMMER').toUpperCase(),
    plannedDurationMinutes: Number(taskData.plannedDurationMinutes || taskData.plannedMinutes || 60),
    targetDate: taskData.targetDate || taskData.dueDate || new Date().toISOString().split('T')[0],
    xpReward: Number(taskData.xpReward !== undefined ? taskData.xpReward : 80),
  };

  return await fetchApi('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Atualiza os dados de uma tarefa existente.
 * @param {number} taskId - ID da tarefa
 * @param {Object} taskData - Novos dados da tarefa
 * @returns {Promise<Object>} Tarefa atualizada
 */
export async function updateTask(taskId, taskData) {
  if (!taskId) throw new Error('O ID da tarefa é obrigatório.');
  
  const payload = {
    title: taskData.title,
    description: taskData.description,
    category: taskData.category ? taskData.category.toUpperCase().replace(/\s+/g, '_') : undefined,
    season: taskData.season ? taskData.season.toUpperCase() : undefined,
    plannedDurationMinutes: taskData.plannedDurationMinutes,
    targetDate: taskData.targetDate || taskData.dueDate,
    xpReward: taskData.xpReward,
  };

  return await fetchApi(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Atualiza apenas o status de uma tarefa.
 * @param {number} taskId - ID da tarefa
 * @param {string} status - 'PENDING' | 'IN_PROGRESS' | 'PARTIAL' | 'COMPLETED'
 * @returns {Promise<Object>} Tarefa atualizada
 */
export async function updateTaskStatus(taskId, status) {
  if (!taskId) throw new Error('O ID da tarefa é obrigatório.');
  const formattedStatus = status.toUpperCase().replace(/-/g, '_');
  
  return await fetchApi(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: formattedStatus }),
  });
}

/**
 * Exclui uma tarefa pelo ID.
 * @param {number} taskId - ID da tarefa a ser excluída
 * @returns {Promise<{success: boolean, id: number}>} Confirmação de exclusão
 */
export async function deleteTask(taskId) {
  if (!taskId) {
    throw new Error('O ID da tarefa é obrigatório.');
  }
  await fetchApi(`/tasks/${taskId}`, { method: 'DELETE' });
  return { success: true, id: taskId };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. REGISTRO DE TEMPO & XP (/timelogs ou /tasks/{id}/log)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registra o tempo real executado de uma tarefa, envia notas e atualiza o XP do usuário.
 * @param {number} taskId - ID da tarefa estudada/executada
 * @param {Object} logData - Informações da sessão
 * @param {number} logData.actualMinutes - Minutos reais executados
 * @param {string} [logData.completionStatus='COMPLETED'] - Status ('COMPLETED', 'PARTIAL', 'INTERRUPTED' ou 'complete', 'partial', 'interrupted')
 * @param {string} [logData.notes=''] - Notas, justificativas ou observações da sessão
 * @param {number} [userId=1] - ID do usuário para sincronização de XP
 * @returns {Promise<{ timeLog: Object, user: Object }>} Registro de tempo criado e perfil de usuário com XP atualizado
 */
export async function logTime(taskId, { actualMinutes, completionStatus = 'COMPLETED', notes = '' }, userId = DEFAULT_USER_ID) {
  if (!taskId) {
    throw new Error('O ID da tarefa é obrigatório.');
  }
  
  const minutes = Number(actualMinutes || 0);
  if (minutes <= 0) {
    throw new Error('A duração registrada deve ser maior que 0 minutos.');
  }

  // Normalização do completionStatus para o formato do enum do Spring Boot
  let normalizedStatus = 'COMPLETED';
  const statusStr = String(completionStatus).toUpperCase();
  if (statusStr.includes('PARTIAL')) {
    normalizedStatus = 'PARTIAL';
  } else if (statusStr.includes('INTERRUPT')) {
    normalizedStatus = 'INTERRUPTED';
  } else if (statusStr.includes('COMPLETE')) {
    normalizedStatus = 'COMPLETED';
  }

  const payload = {
    taskId: Number(taskId),
    loggedDurationMinutes: minutes,
    completionStatus: normalizedStatus,
    notes: notes || '',
  };

  // Envia registro de tempo ao endpoint do Spring Boot (/api/v1/timelogs)
  const timeLogResponse = await fetchApi('/timelogs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  // Busca imediatamente o perfil do usuário atualizado com o novo XP e nível recalculados pelo backend
  let updatedUserProfile = null;
  try {
    updatedUserProfile = await getUserProfile(userId);
  } catch (err) {
    console.warn('[API logTime] Perfil não pôde ser atualizado após o registro de tempo:', err);
  }

  return {
    timeLog: timeLogResponse,
    user: updatedUserProfile,
  };
}

/**
 * Busca o histórico de registros de tempo de uma tarefa.
 * @param {number} taskId - ID da tarefa
 * @returns {Promise<Array>} Lista de registros de tempo
 */
export async function getTimeLogsByTask(taskId) {
  if (!taskId) throw new Error('O ID da tarefa é obrigatório.');
  return await fetchApi(`/timelogs/task/${taskId}`, { method: 'GET' });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATUS DO USUÁRIO & GAMIFICAÇÃO (/users/{id})
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca as informações de perfil do usuário (XP atual, nível, streak de dias, nome, e-mail)
 * para atualizar o Header e a barra de progresso.
 * @param {number} [userId=1] - ID do usuário
 * @returns {Promise<{ id: number, name: string, email: string, level: number, currentXp: number, streakDays: number }>}
 */
export async function getUserProfile(userId = DEFAULT_USER_ID) {
  return await fetchApi(`/users/${userId}`, { method: 'GET' });
}

/**
 * Busca estatísticas completas de estudo e gamificação do usuário.
 * @param {number} [userId=1] - ID do usuário
 * @returns {Promise<{ totalStudyMinutes: number, totalTasksCompleted: number, streakDays: number, currentXp: number, level: number }>}
 */
export async function getUserStats(userId = DEFAULT_USER_ID) {
  return await fetchApi(`/users/${userId}/stats`, { method: 'GET' });
}

/**
 * Busca a tabela de classificação (Leaderboard) com os usuários de maior XP.
 * @returns {Promise<Array>} Lista dos 10 melhores usuários
 */
export async function getLeaderboard() {
  return await fetchApi('/gamification/leaderboard', { method: 'GET' });
}

/**
 * Verifica o status de conectividade com a API Spring Boot.
 * @returns {Promise<boolean>} Retorna true se a API estiver respondendo
 */
export async function checkApiHealth() {
  try {
    await fetchApi('/gamification/leaderboard', { method: 'GET' });
    return true;
  } catch (e) {
    return false;
  }
}

// Export default com todas as funções
const api = {
  getTasksBySeason,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  logTime,
  getTimeLogsByTask,
  getUserProfile,
  getUserStats,
  getLeaderboard,
  checkApiHealth,
};

export default api;
