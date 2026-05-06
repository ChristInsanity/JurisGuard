import { AxiosError } from "axios";
import { apiClient, TOKEN_STORAGE_KEY } from "../api/client";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  TokenResponse,
} from "../types/auth";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    return typeof detail === "string" ? detail : fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  try {
    const response = await apiClient.post<RegisterResponse>("/auth/register", payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Registration failed"));
  }
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const form = new URLSearchParams();
  form.set("username", payload.email);
  form.set("password", payload.password);

  try {
    const response = await apiClient.post<TokenResponse>("/auth/token", form, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Login failed"));
  }
}

export async function getMe(): Promise<AuthUser> {
  try {
    const response = await apiClient.get<AuthUser>("/auth/me");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load current user"));
  }
}

export function logout() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function loginRequest(email: string, password: string): Promise<TokenResponse> {
  return login({ email, password });
}
