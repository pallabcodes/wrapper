import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export class TestUtils {
  static async createTestingModule(module: any): Promise<TestingModule> {
    return Test.createTestingModule(module).compile();
  }

  static async createNestApplication(module: any): Promise<INestApplication> {
    const testingModule = await this.createTestingModule(module);
    return testingModule.createNestApplication();
  }

  static async makeRequest(app: INestApplication, method: string, url: string, data?: any): Promise<request.Response> {
    const agent = request(app.getHttpServer());
    
    switch (method.toLowerCase()) {
      case 'get':
        return agent.get(url);
      case 'post':
        return agent.post(url).send(data);
      case 'put':
        return agent.put(url).send(data);
      case 'patch':
        return agent.patch(url).send(data);
      case 'delete':
        return agent.delete(url);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  static async closeApp(app: INestApplication): Promise<void> {
    await app.close();
  }
}