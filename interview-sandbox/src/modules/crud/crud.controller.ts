import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CrudService } from './crud.service';
import { EntityRegistryService } from './entity-registry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('CRUD')
@Controller('api')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrudController {
  constructor(
    private readonly crudService: CrudService,
    private readonly entityRegistry: EntityRegistryService,
  ) {}

  @Get(':entity')
  @ApiOperation({ summary: 'Get all records for an entity' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Records retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findAll(
    @Param('entity') entity: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const config = this.entityRegistry.get(entity);

    if (!config) {
      throw new NotFoundException(`Entity '${entity}' not found. Available entities: ${this.entityRegistry.getAllEntityNames().join(', ')}`);
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.crudService.findAll(config.model, {
      page: pageNum,
      limit: limitNum,
      search: search || '',
      searchFields: config.searchFields || [],
      order: config.defaultOrder || [['id', 'DESC']],
    });
  }

  @Get(':entity/:id')
  @ApiOperation({ summary: 'Get one record by ID' })
  @ApiResponse({ status: 200, description: 'Record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async findOne(@Param('entity') entity: string, @Param('id', ParseIntPipe) id: number) {
    const config = this.entityRegistry.get(entity);

    if (!config) {
      throw new NotFoundException(`Entity '${entity}' not found`);
    }

    return this.crudService.findOne(config.model, id);
  }

  @Post(':entity')
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Param('entity') entity: string, @Body() data: any) {
    const config = this.entityRegistry.get(entity);

    if (!config) {
      throw new NotFoundException(`Entity '${entity}' not found`);
    }

    return this.crudService.create(config.model, data);
  }

  @Put(':entity/:id')
  @ApiOperation({ summary: 'Update a record by ID' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async update(@Param('entity') entity: string, @Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const config = this.entityRegistry.get(entity);

    if (!config) {
      throw new NotFoundException(`Entity '${entity}' not found`);
    }

    return this.crudService.update(config.model, id, data);
  }

  @Delete(':entity/:id')
  @ApiOperation({ summary: 'Delete a record by ID' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async delete(@Param('entity') entity: string, @Param('id', ParseIntPipe) id: number) {
    const config = this.entityRegistry.get(entity);

    if (!config) {
      throw new NotFoundException(`Entity '${entity}' not found`);
    }

    return this.crudService.delete(config.model, id);
  }
}

