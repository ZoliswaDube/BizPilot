import { ApiClient } from './client';
import {
  Business,
  BusinessUser,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  InviteUserRequest,
  UpdateUserRoleRequest,
} from '../types';

export class BusinessApi {
  constructor(private client: ApiClient) {}

  async create(data: CreateBusinessRequest): Promise<{ business: Business }> {
    const response = await this.client.post<{ business: Business }>('/businesses', data);
    return response.data!;
  }

  async getById(businessId: string): Promise<{ business: Business }> {
    const response = await this.client.get<{ business: Business }>(`/businesses/${businessId}`);
    return response.data!;
  }

  async update(businessId: string, data: UpdateBusinessRequest): Promise<{ business: Business }> {
    const response = await this.client.put<{ business: Business }>(`/businesses/${businessId}`, data);
    return response.data!;
  }

  async getUsers(businessId: string): Promise<{ users: BusinessUser[] }> {
    const response = await this.client.get<{ users: BusinessUser[] }>(`/businesses/${businessId}/users`);
    return response.data!;
  }

  async inviteUser(businessId: string, data: InviteUserRequest): Promise<{ invitation: any }> {
    const response = await this.client.post<{ invitation: any }>(`/businesses/${businessId}/users/invite`, data);
    return response.data!;
  }

  async updateUserRole(businessId: string, userId: string, data: UpdateUserRoleRequest): Promise<{ businessUser: BusinessUser }> {
    const response = await this.client.put<{ businessUser: BusinessUser }>(`/businesses/${businessId}/users/${userId}`, data);
    return response.data!;
  }

  async removeUser(businessId: string, userId: string): Promise<void> {
    await this.client.delete(`/businesses/${businessId}/users/${userId}`);
  }
}



