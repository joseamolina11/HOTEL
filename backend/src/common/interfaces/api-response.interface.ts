export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}
