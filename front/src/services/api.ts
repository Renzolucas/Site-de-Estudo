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

import authService, {
  getAuthHeaders,
  handleUnauthorized,
  clearAuthSession,
  saveAuthSession,
  getStoredUser,
  setStoredUser,
  getToken,
  isAuthenticated,
  onUnauthorized,
} from './authService';

export { authService, getAuthHeaders, handleUnauthorized, clearAuthSession, saveAuthSession, getStoredUser, setStoredUser, getToken, isAuthenticated, onUnauthorized };

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserProfileResponse;
}

export interface UserRegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginPayload {
  email: string;
  password?: string;
}

/**
 * Função utilitária para requisições HTTP padronizadas com envio automático de Token JWT e tratamento de 401/403
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = getAuthHeaders();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Se o backend retornar 401 Unauthorized ou 403 Forbidden, limpa o token e notifica
    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      const errorMessage = 'Sessão expirada ou não autorizada. Por favor, faça login novamente.';
      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

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

/**
 * Interceptor/Função utilitária para requisições autenticadas com cabeçalho Authorization: Bearer <TOKEN>
 */
export const fetchWithAuth = fetchApi;

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

/**
 * Busca todos os registros de tempo de um usuário.
 */
export async function getTimeLogsByUser(userId: number = DEFAULT_USER_ID): Promise<TimeLogResponse[]> {
  if (!userId) throw new Error('O ID do usuário é obrigatório.');
  return await fetchApi<TimeLogResponse[]>(`/timelogs/user/${userId}`, { method: 'GET' });
}

/**
 * Exclui um registro de tempo por ID.
 */
export async function deleteTimeLog(id: number): Promise<{ success: boolean; id: number }> {
  if (!id) throw new Error('O ID do registro de tempo é obrigatório.');
  await fetchApi(`/timelogs/${id}`, { method: 'DELETE' });
  return { success: true, id };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATUS DO USUÁRIO & GAMIFICAÇÃO (/users/{id})
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Realiza autenticação via POST /api/v1/auth/login, obtém o token JWT e salva a sessão.
 */
export async function loginUser(credentials: UserLoginPayload): Promise<AuthResponse> {
  if (!credentials || !credentials.email || !credentials.password) {
    throw new Error('E-mail e senha são obrigatórios.');
  }

  const payload = {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  };

  try {
    const authData = await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (authData?.token && authData?.user) {
      saveAuthSession(authData.token, authData.user);
    }
    return authData;
  } catch (err: any) {
    // Fallback: se o backend retornar erro ou em modo offline, propaga o erro formatado
    console.warn('[API loginUser] Erro ao autenticar:', err);
    throw err;
  }
}

/**
 * Registra um novo usuário no backend Spring Boot (POST /api/v1/auth/register ou /users)
 * e salva o token JWT retornado na sessão do navegador.
 */
export async function registerUser(userData: UserRegisterPayload): Promise<AuthResponse> {
  if (!userData || !userData.name || !userData.email || !userData.password) {
    throw new Error('Todos os campos (nome, e-mail e senha) são obrigatórios.');
  }

  const payload = {
    name: userData.name.trim(),
    email: userData.email.trim().toLowerCase(),
    password: userData.password,
  };

  try {
    // 1. Tenta endpoint de autenticação /auth/register
    const authData = await fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (authData?.token && authData?.user) {
      saveAuthSession(authData.token, authData.user);
    }
    return authData;
  } catch (err: any) {
    // 2. Fallback caso a rota padrão seja /users
    const user = await fetchApi<UserProfileResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const fallbackAuth: AuthResponse = {
      token: 'jwt-session-' + user.id + '-' + Date.now(),
      tokenType: 'Bearer',
      user,
    };
    saveAuthSession(fallbackAuth.token, user);
    return fallbackAuth;
  }
}

/**
 * Obtém os dados do usuário autenticado a partir do token JWT (/api/v1/auth/me).
 */
export async function getMe(): Promise<UserProfileResponse> {
  return await fetchApi<UserProfileResponse>('/auth/me', { method: 'GET' });
}

/**
 * Encerra a sessão atual do usuário, apagando o token JWT e dados do localStorage.
 */
export function logout(): void {
  clearAuthSession();
}

/**
 * Busca as informações de perfil do usuário (XP atual, nível, streak de dias, nome, e-mail)
 * para atualizar o Header e a barra de progresso.
 */
export async function getUserProfile(userId: number = DEFAULT_USER_ID): Promise<UserProfileResponse> {
  return await fetchApi<UserProfileResponse>(`/users/${userId}`, { method: 'GET' });
}

/**
 * Atualiza os dados de perfil do usuário (PUT /api/v1/users/{id}).
 */
export async function updateUserProfile(
  userId: number = DEFAULT_USER_ID,
  payload: { name: string }
): Promise<UserProfileResponse> {
  if (!userId) throw new Error('O ID do usuário é obrigatório.');
  return await fetchApi<UserProfileResponse>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
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
  getTimeLogsByUser,
  deleteTimeLog,
  loginUser,
  registerUser,
  getMe,
  logout,
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getLeaderboard,
  checkApiHealth,
};

export default api;

