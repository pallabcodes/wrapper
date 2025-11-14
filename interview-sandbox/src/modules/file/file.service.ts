import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileRepository } from './file.repository';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private fileRepository: FileRepository) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save file metadata to database
    const fileRecord = await this.fileRepository.create({
      userId,
      filename: file.originalname,
      path: filePath,
      mimeType: file.mimetype,
      size: file.size,
    });

    return {
      id: fileRecord.id,
      filename: fileRecord.filename,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      createdAt: fileRecord.createdAt,
    };
  }

  async getUserFiles(userId: number) {
    return this.fileRepository.findByUserId(userId);
  }

  async deleteFile(userId: number, fileId: number) {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.userId !== userId) {
      throw new BadRequestException('You can only delete your own files');
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete file record from database
    await this.fileRepository.delete(fileId);

    return { message: 'File deleted successfully' };
  }
}

