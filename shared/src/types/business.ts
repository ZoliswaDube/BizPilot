import { TimestampFields } from './index';

export interface Business extends TimestampFields {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  createdBy: string | null;
}

export interface BusinessUser extends TimestampFields {
  id: string;
  businessId: string;
  userId: string;
  role: string;
  isActive: boolean | null;
  invitedBy: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
}

export interface CreateBusinessRequest {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateBusinessRequest {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface InviteUserRequest {
  email: string;
  roleId?: string;
}

export interface UpdateUserRoleRequest {
  role?: string;
  isActive?: boolean;
}



