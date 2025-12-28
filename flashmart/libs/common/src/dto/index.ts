// Shared DTOs for FlashMart services

export class PaginationDto {
    page?: number = 1;
    limit?: number = 20;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
