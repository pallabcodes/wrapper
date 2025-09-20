import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DatabaseQuery } from '../types';

/**
 * Decorator to extract database query from request
 */
export const Query = createParamDecorator(
  (data: string, ctx: ExecutionContext): DatabaseQuery => {
    const request = ctx.switchToHttp().getRequest();
    return request.query || {};
  }
);

/**
 * Decorator to extract pagination from request
 */
export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const { page = 1, limit = 10 } = request.query;
    
    return {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100), // Max 100 items per page
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10)
    };
  }
);

/**
 * Decorator to extract sorting from request
 */
export const Sort = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const { sort, order = 'asc' } = request.query;
    
    if (!sort) {
      return {};
    }
    
    const sortFields = Array.isArray(sort) ? sort : [sort];
    const orderFields = Array.isArray(order) ? order : [order];
    
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    
    sortFields.forEach((field: string, index: number) => {
      const direction = orderFields[index] || 'asc';
      orderBy[field] = direction.toLowerCase() === 'desc' ? 'desc' : 'asc';
    });
    
    return orderBy;
  }
);

/**
 * Decorator to extract filters from request
 */
export const Filters = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const { filters } = request.query;
    
    if (!filters) {
      return {};
    }
    
    try {
      return typeof filters === 'string' ? JSON.parse(filters) : filters;
    } catch (error) {
      return {};
    }
  }
);
