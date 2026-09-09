const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AuthUser {
  id: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  businessId: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function register(
  businessId: string,
  name: string,
  email: string,
  password: string,
  role: 'owner' | 'manager' | 'staff' = 'owner',
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId, name, email, password, role }),
  });
  return handleResponse(res);
}

const TOKEN_KEY = 'bizmind_token';
const USER_KEY = 'bizmind_user';

export function saveSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
