import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiGatewayService } from '../services/api-gateway.service';

@Controller()
export class ApiGatewayController {
  constructor(private readonly gatewayService: ApiGatewayService) { }

  // Auth routes
  @Post('auth/register')
  async register(@Body() body: any) {
    return this.gatewayService.callAuthService('/auth/register', 'POST', body);
  }

  @Post('auth/login')
  async login(@Body() body: any) {
    return this.gatewayService.callAuthService('/auth/login', 'POST', body);
  }

  // User routes
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.gatewayService.callUserService(`/users/${id}`, 'GET');
  }

  @Get('users')
  async getAllUsers() {
    return this.gatewayService.callUserService('/users', 'GET');
  }
}

