export * from './auth';
export * from './business';
export * from './user';
export * from './product';
export * from './inventory';
export * from './order';
export * from './customer';
export * from './financial';
export * from './api';

// Common utility types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type Status = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';

export interface TimestampFields {
  createdAt: string;
  updatedAt: string;
}



