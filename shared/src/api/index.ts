export { ApiClient, type ApiClientConfig } from './client';
export { AuthApi } from './auth';
export { BusinessApi } from './business';
export { UserApi } from './user';

// Create a factory function to create a fully configured API client
import { ApiClient } from './client';
import { AuthApi } from './auth';
import { BusinessApi } from './business';
import { UserApi } from './user';

export interface BizPilotApiClient {
  auth: AuthApi;
  business: BusinessApi;
  user: UserApi;
  // More APIs will be added here as they're implemented
}

export function createApiClient(config: {
  baseURL: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
  onAuthError?: () => void;
}): BizPilotApiClient {
  const client = new ApiClient(config);

  return {
    auth: new AuthApi(client),
    business: new BusinessApi(client),
    user: new UserApi(client),
  };
}



