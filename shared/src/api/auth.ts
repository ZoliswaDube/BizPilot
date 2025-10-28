import { ApiClient } from './client';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  MeResponse,
} from '../types';

export class AuthApi {
  constructor(private client: ApiClient) {}

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    return response.data!;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data!;
  }

  async refreshToken(data: RefreshTokenRequest): Promise<{ tokens: { accessToken: string; refreshToken: string } }> {
    const response = await this.client.post<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/refresh', data);
    return response.data!;
  }

  async getMe(): Promise<MeResponse> {
    const response = await this.client.get<MeResponse>('/auth/me');
    return response.data!;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>('/auth/forgot-password', data);
    return response.data!;
  }

  // OAuth URLs (these would be direct navigation, not API calls)
  getGoogleAuthUrl(): string {
    return `${this.client.getAxiosInstance().defaults.baseURL}/auth/google`;
  }

  getGithubAuthUrl(): string {
    return `${this.client.getAxiosInstance().defaults.baseURL}/auth/github`;
  }
}



