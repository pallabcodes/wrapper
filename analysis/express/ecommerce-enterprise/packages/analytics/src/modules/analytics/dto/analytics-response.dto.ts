export class AnalyticsResponseDto {
  success!: boolean;
  data!: any;
  timestamp!: Date;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };

  static success<T>(data: T, message?: string): AnalyticsResponseDto {
    const response = new AnalyticsResponseDto();
    response.success = true;
    response.data = data;
    response.timestamp = new Date();
    if (message) response.message = message;
    return response;
  }

  static error(error: string, message?: string): AnalyticsResponseDto {
    const response = new AnalyticsResponseDto();
    response.success = false;
    response.error = error;
    response.timestamp = new Date();
    if (message) response.message = message;
    return response;
  }

  static paginated<T>(data: T, pagination: { total: number; page: number; limit: number }): AnalyticsResponseDto {
    const response = new AnalyticsResponseDto();
    response.success = true;
    response.data = data;
    response.timestamp = new Date();
    response.meta = {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page * pagination.limit < pagination.total,
      hasPrev: pagination.page > 1,
    };
    return response;
  }
}