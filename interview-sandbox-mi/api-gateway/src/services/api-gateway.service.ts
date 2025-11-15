import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ApiGatewayService {
  private readonly authServiceUrl: string;
  private readonly userServiceUrl: string;
  private readonly paymentServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://localhost:3001');
    this.userServiceUrl = this.configService.get('USER_SERVICE_URL', 'http://localhost:3002');
    this.paymentServiceUrl = this.configService.get('PAYMENT_SERVICE_URL', 'http://localhost:3003');
  }

  async callAuthService(endpoint: string, method: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.authServiceUrl}${endpoint}`,
        data,
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Auth service error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async callUserService(endpoint: string, method: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.userServiceUrl}${endpoint}`,
        data,
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'User service error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async callPaymentService(endpoint: string, method: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.paymentServiceUrl}${endpoint}`,
        data,
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Payment service error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

