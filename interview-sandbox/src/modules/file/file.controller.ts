import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileResponseMapper } from './mappers/file-response.mapper';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly responseMapper: FileResponseMapper,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadFile(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.fileService.uploadFile(user.id, file);
    return this.responseMapper.toCreateResponse(result);
  }

  @Get()
  @ApiOperation({ summary: 'Get user files' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  async getUserFiles(@CurrentUser() user: { id: number }) {
    const result = await this.fileService.getUserFiles(user.id);
    return this.responseMapper.toReadResponse(result);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MODERATOR') // Example: Only admins and moderators can delete files
  @ApiOperation({ summary: 'Delete a file (Admin/Moderator only)' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Moderator role required' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.fileService.deleteFile(user.id, id);
    return this.responseMapper.toDeleteResponse(result || id);
  }
}

