export interface ApiResponse<T = unknown> {
  success:   boolean;
  data:      T;
  message:   string;
  timestamp: string;
}

export interface ApiError {
  success:    false;
  statusCode: number;
  message:    string | string[];
  error:      string;
  timestamp:  string;
  path:       string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

export interface PaginationParams {
  page?:  number;
  limit?: number;
}
