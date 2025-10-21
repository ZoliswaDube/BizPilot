export interface User {
  id: string;
  email: string;
  provider: 'email' | 'google' | 'github';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  provider: string;
  emailVerified: boolean;
  businessId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string | null;
  businessName: string | null;
  hourlyRate: number | null;
  defaultMargin: number | null;
  businessId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    profile: UserProfile;
    settings: UserSettings;
    emailVerified: boolean;
  };
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    provider: string;
    emailVerified: boolean;
    profile: UserProfile;
    settings: UserSettings;
    businesses: Array<{
      id: string;
      name: string;
      role: string;
      isActive: boolean;
    }>;
  };
}



