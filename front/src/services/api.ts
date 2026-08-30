/**
 * StudyOS Frontend - Typed API Integration Service
 * Conexão com o backend REST Java Spring Boot (http://localhost:8080/api)
 */

export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:8080/api/v1';

export const DEFAULT_USER_ID = 1;

// ── Enums & Types ────────────────────────────────────────────────────────────

export type Season = 'SUMMER' | 'AUTUMN' | 'WINTER' | 'SPRING';
export type TaskCategory = 
  | 'JAVA_BACKEND' 
  | 'FRONTEND' 
  | 'DATABASE' 
  | 'DEVOPS' 
  | 'ENGLISH' 
  | 'EXERCISE' 
  | 'READING' 
  | 'OTHER';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'PARTIAL' | 'COMPLETED';
export type CompletionStatus = 'COMPLETED' | 'PARTIAL' | 'INTERRUPTED';

export interface TaskResponse {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: TaskCategory;
  season: Season;
  plannedDurationMinutes: number;
  actualDurationMinutes: number | null;
  status: TaskStatus;
  targetDate: string;
  xpReward: number;
}

export interface TaskCreatePayload {
  userId?: number;
  title: string;
  description?: string;
  notes?: string;
  category?: TaskCategory | string;
  season?: Season | string;
  plannedDurationMinutes?: number;
  plannedMinutes?: number;
  targetDate?: string;
  dueDate?: string;
  xpReward?: number;
}

export interface TimeLogRequest {
  actualMinutes: number;
  completionStatus?: CompletionStatus | 'complete' | 'partial' | 'interrupted';
  notes?: string;
}

export interface TimeLogResponse {
  id: number;
  taskId: number;
  taskTitle: string;
  loggedDurationMinutes: number;
  completionStatus: CompletionStatus;
  notes: string;
  createdAt: string;
}

export interface UserProfileResponse {
  id: number;
  name: string;
  email: string;
  level: number;
  currentXp: number;
  streakDays: number;
}

export interface StudyStatsResponse {
  totalStudyMinutes: number;
  totalTasksCompleted: number;
  streakDays: number;
  currentXp: number;
  level: number;
}

export interface LeaderboardUserResponse {
  id: number;
  name: string;
  level: number;
  currentXp: number;
  streakDays: number;
}

/**
 * Função utilitária para requisições HTTP padronizadas com tratamento de erros
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
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
      return { success: true } as unknown as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Erro HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage) as Error & { status?: number; data?: unknown };
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data as T;
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
 */
export async function getTasksBySeason(season: Season | string, userId: number = DEFAULT_USER_ID): Promise<TaskResponse[]> {
  if (!season) {
    throw new Error('O parâmetro "season" é obrigatório.');
  }
  const formattedSeason = season.toUpperCase();
  const endpoint = `/tasks/user/${userId}?season=${encodeURIComponent(formattedSeason)}`;
  return await fetchApi<TaskResponse[]>(endpoint, { method: 'GET' });
}

/**
 * Busca todas as tarefas de um usuário.
 */
export async function getTasks(userId: number = DEFAULT_USER_ID, status?: TaskStatus | string): Promise<TaskResponse[]> {
  let endpoint = `/tasks/user/${userId}`;
  if (status) {
    endpoint += `?status=${encodeURIComponent(status.toUpperCase())}`;
  }
  return await fetchApi<TaskResponse[]>(endpoint, { method: 'GET' });
}

/**
 * Busca uma tarefa específica pelo ID.
 */
export async function getTaskById(taskId: number): Promise<TaskResponse> {
  if (!taskId) throw new Error('O ID da tarefa é obrigatório.');
  return await fetchApi<TaskResponse>(`/tasks/${taskId}`, { method: 'GET' });
}

/**
 * Cria uma nova tarefa ou macro-tarefa.
 */
export async function createTask(taskData: TaskCreatePayload): Promise<TaskResponse> {
  if (!taskData || !taskData.title) {
    throw new Error('O título da tarefa é obrigatório.');
  }

  const categoryMap: Record<string, TaskCategory> = {
    'JAVA BACKEND': 'JAVA_BACKEND',
    'FRONTEND': 'FRONTEND',
    'DATABASE': 'DATABASE',
    'SYSTEM DESIGN': 'DATABASE',
    'DEVOPS': 'DEVOPS',
    'ENGLISH': 'ENGLISH',
    'EXERCISE': 'EXERCISE',
    'LEETCODE': 'JAVA_BACKEND',
    'READING': 'READING',
  };

  const rawCat = (taskData.category || 'JAVA_BACKEND').toString().toUpperCase().trim();
  const validCategory = categoryMap[rawCat] || (rawCat.replace(/\s+/g, '_') as TaskCategory) || 'JAVA_BACKEND';

  const payload = {
    userId: taskData.userId || DEFAULT_USER_ID,
    title: taskData.title.trim(),
    description: taskData.description || taskData.notes || '',
    category: validCategory,
    season: (taskData.season || 'SUMMER').toUpperCase() as Season,
    plannedDurationMinutes: Number(taskData.plannedDurationMinutes || taskData.plannedMinutes || 60),
    targetDate: taskData.targetDate || taskData.dueDate || new Date().toISOString().split('T')[0],
    xpReward: Number(taskData.xpReward !== undefined ? taskData.xpReward : 80),
  };

  return await fetchApi<TaskResponse>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Atualiza os dados de uma tarefa existente.
 */
export async function updateTask(taskId: number, taskData: Partial<TaskCreatePayload>): Promise<TaskResponse> {
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

  return await fetchApi<TaskResponse>(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Atualiza apenas o status de uma tarefa.
 */
export async function updateTaskStatus(taskId: number, status: TaskStatus | string): Promise<TaskResponse> {
  if (!taskId) throw new Error('O ID da tarefa é obrigatório.');
  const formattedStatus = status.toUpperCase().replace(/-/g, '_');
  
  return await fetchApi<TaskResponse>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: formattedStatus }),
  });
}

/**
 * Exclui uma tarefa pelo ID.
 */
export async function deleteTask(taskId: number): Promise<{ success: boolean; id: number }> {
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
 */
export async function logTime(
  taskId: number,
  { actualMinutes, completionStatus = 'COMPLETED', notes = '' }: TimeLogRequest,
  userId: number = DEFAULT_USER_ID
): Promise<{ timeLog: TimeLogResponse; user: UserProfileResponse | null }> {
  if (!taskId) {
    throw new Error('O ID da tarefa é obrigatório.');
  }
  
  const minutes = Number(actualMinutes || 0);
  if (minutes <= 0) {
    throw new Error('A duração registrada deve ser maior que 0 minutos.');
  }

  let normalizedStatus: CompletionStatus = 'COMPLETED';
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

  const timeLogResponse = await fetchApi<TimeLogResponse>('/timelogs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  let updatedUserProfile: UserProfileResponse | null = null;
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
 */
export async function getTimeLogsByTask(taskId: number): Promise<TimeLogResponse[]> {
  if (!taskId) throw new Error('O ID da tarefa é obrigatório.');
  return await fetchApi<TimeLogResponse[]>(`/timelogs/task/${taskId}`, { method: 'GET' });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATUS DO USUÁRIO & GAMIFICAÇÃO (/users/{id})
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca as informações de perfil do usuário (XP atual, nível, streak de dias, nome, e-mail)
 * para atualizar o Header e a barra de progresso.
 */
export async function getUserProfile(userId: number = DEFAULT_USER_ID): Promise<UserProfileResponse> {
  return await fetchApi<UserProfileResponse>(`/users/${userId}`, { method: 'GET' });
}

/**
 * Busca estatísticas completas de estudo e gamificação do usuário.
 */
export async function getUserStats(userId: number = DEFAULT_USER_ID): Promise<StudyStatsResponse> {
  return await fetchApi<StudyStatsResponse>(`/users/${userId}/stats`, { method: 'GET' });
}

/**
 * Busca a tabela de classificação (Leaderboard) com os usuários de maior XP.
 */
export async function getLeaderboard(): Promise<LeaderboardUserResponse[]> {
  return await fetchApi<LeaderboardUserResponse[]>('/gamification/leaderboard', { method: 'GET' });
}

/**
 * Verifica o status de conectividade com a API Spring Boot.
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await fetchApi('/gamification/leaderboard', { method: 'GET' });
    return true;
  } catch (e) {
    return false;
  }
}

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
