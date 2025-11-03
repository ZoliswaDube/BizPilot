import { apiClient, tokenStorage } from '../config/api';
import { AuthResponse, LoginRequest, RegisterRequest, MeResponse } from '../../../shared/src/types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.auth.login(credentials);
      
      // Store tokens
      await tokenStorage.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.auth.register(userData);
      
      // Store tokens
      await tokenStorage.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local tokens
      await tokenStorage.clearTokens();
    }
  }

  async getCurrentUser(): Promise<MeResponse | null> {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        return null;
      }

      return await apiClient.auth.getMe();
    } catch (error) {
      console.error('Get current user error:', error);
      // If token is invalid, clear it
      await tokenStorage.clearTokens();
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await apiClient.auth.refreshToken({ refreshToken });
      
      await tokenStorage.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      await tokenStorage.clearTokens();
      return false;
    }
  }
}

export const authService = new AuthService();



