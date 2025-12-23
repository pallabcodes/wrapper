import { Injectable } from '@nestjs/common';
import { BaseResponseMapper, ApiResponse } from './base-response.mapper';

/**
 * Protected Response DTOs
 */
export interface PublicDataDto {
  message: string;
  timestamp: Date;
}

export interface UserDataDto {
  message: string;
  user: {
    id: string;
    email: string;
    roles?: string[];
  };
}

export interface AdminDataDto {
  message: string;
  user: {
    id: string;
    email: string;
    roles?: string[];
  };
}

export interface UserListDto {
  message: string;
  users: any[];
  user: {
    id: string;
    email: string;
    roles?: string[];
  };
}

export interface UpdateUserDto {
  message: string;
  userId: string;
  data: any;
  user: {
    id: string;
    email: string;
    roles?: string[];
  };
}

/**
 * Protected Response Mapper
 * 
 * Maps protected route responses from domain/application layer
 * to presentation layer DTOs
 */
@Injectable()
export class ProtectedResponseMapper extends BaseResponseMapper {
  /**
   * Map to public data response (200 OK)
   */
  toPublicDataResponse(requestId?: string): ApiResponse<PublicDataDto> {
    return this.success<PublicDataDto>(
      {
        message: 'This is public data',
        timestamp: new Date(),
      },
      'Public data retrieved successfully',
      requestId,
    );
  }

  /**
   * Map to user data response (200 OK)
   */
  toUserDataResponse(user: any, requestId?: string): ApiResponse<UserDataDto> {
    return this.success<UserDataDto>(
      {
        message: 'This is user data',
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      'User data retrieved successfully',
      requestId,
    );
  }

  /**
   * Map to admin data response (200 OK)
   */
  toAdminDataResponse(user: any, requestId?: string): ApiResponse<AdminDataDto> {
    return this.success<AdminDataDto>(
      {
        message: 'This is admin-only data',
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      'Admin data retrieved successfully',
      requestId,
    );
  }

  /**
   * Map to moderator data response (200 OK)
   */
  toModeratorDataResponse(user: any, requestId?: string): ApiResponse<AdminDataDto> {
    return this.success<AdminDataDto>(
      {
        message: 'This is moderator data',
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      'Moderator data retrieved successfully',
      requestId,
    );
  }

  /**
   * Map to user list response (200 OK)
   */
  toUserListResponse(users: any[], user: any, requestId?: string): ApiResponse<UserListDto> {
    return this.success<UserListDto>(
      {
        message: 'Users list',
        users,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      'Users retrieved successfully',
      requestId,
    );
  }

  /**
   * Map to update user response (200 OK)
   */
  toUpdateUserResponse(userId: string, data: any, user: any, requestId?: string): ApiResponse<UpdateUserDto> {
    return this.updated<UpdateUserDto>(
      {
        message: 'User updated',
        userId,
        data,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      'User updated successfully',
      requestId,
    );
  }

  /**
   * Map to update profile response (200 OK)
   */
  toUpdateProfileResponse(userId: string, data: any, user: any, requestId?: string): ApiResponse<UpdateUserDto> {
    return this.updated<UpdateUserDto>(
      {
        message: 'Profile updated',
        userId,
        data,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      'Profile updated successfully',
      requestId,
    );
  }

  /**
   * Map to update resource response (200 OK)
   */
  toUpdateResourceResponse(resourceId: string, data: any, user: any, requestId?: string): ApiResponse<UpdateUserDto> {
    return this.updated<UpdateUserDto>(
      {
        message: 'Resource updated',
        userId: resourceId,
        data,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      'Resource updated successfully',
      requestId,
    );
  }

  /**
   * Map to advanced update response (200 OK)
   */
  toAdvancedUpdateResponse(userId: string, data: any, user: any, requestId?: string): ApiResponse<UpdateUserDto> {
    return this.updated<UpdateUserDto>(
      {
        message: 'Advanced update completed',
        userId,
        data,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      'Advanced update completed successfully',
      requestId,
    );
  }
}

