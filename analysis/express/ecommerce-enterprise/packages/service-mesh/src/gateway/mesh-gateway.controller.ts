import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeshGatewayService } from '../services/mesh-gateway.service';

@ApiTags('Service Mesh Gateway')
@Controller('mesh')
export class MeshGatewayController {
  constructor(private readonly meshGateway: MeshGatewayService) {}

  @Get('services')
  @ApiOperation({ summary: 'Get all service instances' })
  @ApiResponse({ status: 200, description: 'Service instances retrieved successfully' })
  async getServices() {
    return this.meshGateway.getServiceInstances('*');
  }

  @Get('services/:serviceName')
  @ApiOperation({ summary: 'Get service instances by name' })
  @ApiResponse({ status: 200, description: 'Service instances retrieved successfully' })
  async getServiceInstances(@Param('serviceName') serviceName: string) {
    return this.meshGateway.getServiceInstances(serviceName);
  }

  @Get('services/:serviceName/health')
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ status: 200, description: 'Service health retrieved successfully' })
  async getServiceHealth(@Param('serviceName') serviceName: string) {
    return this.meshGateway.getServiceHealth(serviceName);
  }

  @Post('services/:serviceName/call')
  @ApiOperation({ summary: 'Make a service call' })
  @ApiResponse({ status: 200, description: 'Service call completed successfully' })
  async callService(
    @Param('serviceName') serviceName: string,
    @Body() body: {
      endpoint: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      data?: any;
      headers?: Record<string, string>;
    }
  ) {
    return this.meshGateway.callService({
      serviceName,
      endpoint: body.endpoint,
      method: body.method || 'GET',
      headers: body.headers,
    }, body.data);
  }
}