/**
 * StudyOS Frontend - Authentication & JWT Token Management Service
 * Gerencia persistência de token JWT, cabeçalhos de autorização e eventos de sessão.
 */

import type { UserProfileResponse } from "./api";

const TOKEN_KEY = "studyos_jwt_token";
const USER_KEY = "studyos_auth_user";

type UnauthorizedListener = () => void;
const unauthorizedListeners: Set<UnauthorizedListener> = new Set();

/**
 * Obtém o token JWT armazenado no localStorage.
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Salva o token JWT no localStorage.
 */
export function setToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn("[AuthService] Não foi possível salvar o token:", e);
  }
}

/**
 * Obtém os dados do usuário autenticado do localStorage.
 */
export function getStoredUser(): UserProfileResponse | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Salva os dados do usuário autenticado no localStorage.
 */
export function setStoredUser(user: UserProfileResponse | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.warn("[AuthService] Não foi possível salvar o usuário:", e);
  }
}

/**
 * Salva a sessão completa de autenticação (Token JWT + Perfil do Usuário).
 */
export function saveAuthSession(token: string, user: UserProfileResponse): void {
  setToken(token);
  setStoredUser(user);
}

/**
 * Alias para saveAuthSession
 */
export const setAuthSession = saveAuthSession;

/**
 * Limpa a sessão de autenticação atual (Logout).
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn("[AuthService] Erro ao limpar sessão:", e);
  }
}

/**
 * Alias para clearAuthSession
 */
export const logout = clearAuthSession;

/**
 * Verifica se existe um token de autenticação válido salvo.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Retorna os headers de autorização necessários para requisições autenticadas.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Disparado quando a API retorna 401 Unauthorized ou 403 Forbidden.
 * Limpa a sessão e notifica os ouvintes registrados (ex: redirecionar para login).
 */
export function handleUnauthorized(): void {
  clearAuthSession();
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("[AuthService] Erro ao executar ouvinte de não-autorizado:", e);
    }
  });
}

/**
 * Registra um callback para ser executado quando a sessão expirar (401/403).
 */
export function onUnauthorized(callback: UnauthorizedListener): () => void {
  unauthorizedListeners.add(callback);
  return () => {
    unauthorizedListeners.delete(callback);
  };
}

const authService = {
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  saveAuthSession,
  clearAuthSession,
  isAuthenticated,
  getAuthHeaders,
  handleUnauthorized,
  onUnauthorized,
};

export default authService;
