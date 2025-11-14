import { Injectable } from '@nestjs/common';
import { BaseResponseMapper } from '@common/mappers/base-response-mapper';

/**
 * FileResponseMapper
 * 
 * Maps file-related domain entities/DTOs to API response format.
 */
@Injectable()
export class FileResponseMapper extends BaseResponseMapper<any, any> {
  /**
   * Transform file upload response
   */
  toUploadResponse(file: any) {
    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: file.id,
        filename: file.filename,
        path: file.path,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      },
    };
  }

  /**
   * Transform file list response
   */
  toFileListResponse(files: any[]) {
    return {
      success: true,
      data: files.map(file => ({
        id: file.id,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      })),
    };
  }

  /**
   * Transform file detail response
   */
  toFileDetailResponse(file: any) {
    return {
      success: true,
      data: {
        id: file.id,
        filename: file.filename,
        path: file.path,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      },
    };
  }

  /**
   * Default implementation
   */
  toResponse(domain: any): any {
    if (Array.isArray(domain)) {
      return this.toFileListResponse(domain);
    }
    return this.toFileDetailResponse(domain);
  }

  /**
   * CREATE response (POST /files/upload)
   */
  toCreateResponse(domain: any): any {
    return this.toUploadResponse(domain);
  }

  /**
   * READ response (GET /files)
   */
  toReadResponse(domain: any): any {
    if (Array.isArray(domain)) {
      return this.toFileListResponse(domain);
    }
    return this.toFileDetailResponse(domain);
  }

  /**
   * DELETE response (DELETE /files/:id)
   */
  toDeleteResponse(domain: any | string | number): any {
    const id = typeof domain === 'object' && domain !== null
      ? (domain as any).id
      : domain;
    
    return {
      success: true,
      message: 'File deleted successfully',
      data: {
        id,
      },
    };
  }
}

