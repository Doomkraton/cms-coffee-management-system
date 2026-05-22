import axios, { AxiosError } from "axios";
import type {
  TokenResponse,
  InstanceStatus,
  Bean, BeanCreate, BeanUpdate,
  Grinder, GrinderCreate, GrinderUpdate,
  GrinderSettingsProfile,
  BrewMethod, BrewMethodCreate, BrewMethodUpdate,
  BrewLog, BrewLogCreate, BrewLogUpdate,
  InviteCode,
  BrewStats,
  User,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const client = axios.create({ baseURL: BASE_URL });

// Attach JWT from localStorage on every request
client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to /login on 401
client.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────── Auth ────────────────────────────────────────

export const authApi = {
  status: () => client.get<InstanceStatus>("/api/auth/status").then((r) => r.data),
  register: (email: string, name: string, password: string) =>
    client.post<TokenResponse>("/api/auth/register", { email, name, password }).then((r) => r.data),
  join: (email: string, name: string, password: string, invite_code: string) =>
    client.post<TokenResponse>("/api/auth/join", { email, name, password, invite_code }).then((r) => r.data),
  login: (email: string, password: string) =>
    client.post<TokenResponse>("/api/auth/login", { email, password }).then((r) => r.data),
  me: () => client.get<User>("/api/auth/me").then((r) => r.data),

  createInviteCode: (expires_in_days = 7) =>
    client.post<InviteCode>("/api/auth/invite-codes", { expires_in_days }).then((r) => r.data),
  listInviteCodes: () =>
    client.get<InviteCode[]>("/api/auth/invite-codes").then((r) => r.data),
  revokeInviteCode: (id: number) =>
    client.delete(`/api/auth/invite-codes/${id}`),
};

// ─────────────────────────────── Beans ───────────────────────────────────────

export const beansApi = {
  list: () => client.get<Bean[]>("/api/beans/").then((r) => r.data),
  get: (id: number) => client.get<Bean>(`/api/beans/${id}`).then((r) => r.data),
  create: (data: BeanCreate) => client.post<Bean>("/api/beans/", data).then((r) => r.data),
  update: (id: number, data: BeanUpdate) =>
    client.patch<Bean>(`/api/beans/${id}`, data).then((r) => r.data),
  delete: (id: number) => client.delete(`/api/beans/${id}`),
};

// ─────────────────────────────── Grinders ────────────────────────────────────

export const grindersApi = {
  list: () => client.get<Grinder[]>("/api/grinders/").then((r) => r.data),
  get: (id: number) => client.get<Grinder>(`/api/grinders/${id}`).then((r) => r.data),
  create: (data: GrinderCreate) => client.post<Grinder>("/api/grinders/", data).then((r) => r.data),
  update: (id: number, data: GrinderUpdate) =>
    client.patch<Grinder>(`/api/grinders/${id}`, data).then((r) => r.data),
  delete: (id: number) => client.delete(`/api/grinders/${id}`),
  createProfile: (grinderId: number, data: { name: string; setting: string; description?: string }) =>
    client.post<GrinderSettingsProfile>(`/api/grinders/${grinderId}/profiles`, data).then((r) => r.data),
  deleteProfile: (grinderId: number, profileId: number) =>
    client.delete(`/api/grinders/${grinderId}/profiles/${profileId}`),
};

// ─────────────────────────────── Brew Methods ────────────────────────────────

export const methodsApi = {
  list: () => client.get<BrewMethod[]>("/api/methods/").then((r) => r.data),
  get: (id: number) => client.get<BrewMethod>(`/api/methods/${id}`).then((r) => r.data),
  create: (data: BrewMethodCreate) => client.post<BrewMethod>("/api/methods/", data).then((r) => r.data),
  update: (id: number, data: BrewMethodUpdate) =>
    client.patch<BrewMethod>(`/api/methods/${id}`, data).then((r) => r.data),
  delete: (id: number) => client.delete(`/api/methods/${id}`),
};

// ─────────────────────────────── Brew Logs ───────────────────────────────────

export const brewsApi = {
  list: (skip = 0, limit = 50) =>
    client.get<BrewLog[]>(`/api/brews/?skip=${skip}&limit=${limit}`).then((r) => r.data),
  get: (id: number) => client.get<BrewLog>(`/api/brews/${id}`).then((r) => r.data),
  create: (data: BrewLogCreate) => client.post<BrewLog>("/api/brews/", data).then((r) => r.data),
  update: (id: number, data: BrewLogUpdate) =>
    client.patch<BrewLog>(`/api/brews/${id}`, data).then((r) => r.data),
  delete: (id: number) => client.delete(`/api/brews/${id}`),
  stats: () => client.get<BrewStats>("/api/brews/stats").then((r) => r.data),
};

// Helper: extract error message from Axios error
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  }
  return "An unexpected error occurred";
}
