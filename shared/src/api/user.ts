import { ApiClient } from './client';
import { UserProfile, UserSettings } from '../types';

export class UserApi {
  constructor(private client: ApiClient) {}

  async getProfile(): Promise<{ profile: UserProfile }> {
    const response = await this.client.get<{ profile: UserProfile }>('/users/profile');
    return response.data!;
  }

  async updateProfile(data: Partial<Pick<UserProfile, 'fullName' | 'avatarUrl'>>): Promise<{ profile: UserProfile }> {
    const response = await this.client.put<{ profile: UserProfile }>('/users/profile', data);
    return response.data!;
  }

  async getSettings(): Promise<{ settings: UserSettings }> {
    const response = await this.client.get<{ settings: UserSettings }>('/users/settings');
    return response.data!;
  }

  async updateSettings(data: Partial<Pick<UserSettings, 'businessName' | 'hourlyRate' | 'defaultMargin'>>): Promise<{ settings: UserSettings }> {
    const response = await this.client.put<{ settings: UserSettings }>('/users/settings', data);
    return response.data!;
  }

  async getBusinesses(): Promise<{ businesses: Array<{ id: string; name: string; description: string; role: string; joinedAt: string; logoUrl: string }> }> {
    const response = await this.client.get<{ businesses: Array<{ id: string; name: string; description: string; role: string; joinedAt: string; logoUrl: string }> }>('/users/businesses');
    return response.data!;
  }
}



