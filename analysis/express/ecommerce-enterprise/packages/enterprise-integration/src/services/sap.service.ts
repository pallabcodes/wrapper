import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SAPOptions, EnterpriseData, SyncResult } from '../interfaces/enterprise-options.interface';
import { SAPAdapter } from '../adapters/sap.adapter';
import { CacheService } from './cache.service';
import { RetryService } from './retry.service';

@Injectable()
export class SAPService {
  private readonly logger = new Logger(SAPService.name);
  private sapAdapter!: SAPAdapter;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly retryService: RetryService,
  ) {
    this.initializeSAP();
  }

  private async initializeSAP() {
    try {
      const sapOptions = this.configService.get<SAPOptions>('SAP_CONFIG');
      if (!sapOptions?.enabled) {
        this.logger.warn('SAP integration is disabled');
        return;
      }

      this.sapAdapter = new SAPAdapter(sapOptions);
      await this.sapAdapter.connect();
      this.isConnected = true;
      this.logger.log('SAP service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize SAP service: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  async isHealthy(): Promise<boolean> {
    // For demo purposes, return true if SAP is enabled
    // In production, you would check actual connection
    return true;
  }

  async callRFC(functionName: string, parameters: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('SAP service is not connected');
    }

    const cacheKey = `sap_rfc_${functionName}_${JSON.stringify(parameters)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.retryService.executeWithRetry(
        () => this.sapAdapter.callRFC(functionName, parameters),
        `SAP RFC ${functionName}`
      );

      await this.cacheService.set(cacheKey, result, 300); // 5 minutes cache
      return result;
    } catch (error) {
      this.logger.error(`SAP RFC call failed: ${functionName}`, (error as Error).stack);
      throw error;
    }
  }

  async queryOData(entitySet: string, filters?: Record<string, any>, options?: {
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
  }): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('SAP service is not connected');
    }

    const cacheKey = `sap_odata_${entitySet}_${JSON.stringify({ filters, options })}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.retryService.executeWithRetry(
        () => this.sapAdapter.queryOData(entitySet, filters, options),
        `SAP OData ${entitySet}`
      );

      await this.cacheService.set(cacheKey, result, 600); // 10 minutes cache
      return result;
    } catch (error) {
      this.logger.error(`SAP OData query failed: ${entitySet}`, (error as Error).stack);
      throw error;
    }
  }

  async createODataEntity(entitySet: string, data: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('SAP service is not connected');
    }

    try {
      const result = await this.retryService.executeWithRetry(
        () => this.sapAdapter.createODataEntity(entitySet, data),
        `SAP OData Create ${entitySet}`
      );

      // Invalidate related cache
      await this.cacheService.deletePattern(`sap_odata_${entitySet}_*`);
      return result;
    } catch (error) {
      this.logger.error(`SAP OData create failed: ${entitySet}`, (error as Error).stack);
      throw error;
    }
  }

  async updateODataEntity(entitySet: string, key: string, data: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('SAP service is not connected');
    }

    try {
      const result = await this.retryService.executeWithRetry(
        () => this.sapAdapter.updateODataEntity(entitySet, key, data),
        `SAP OData Update ${entitySet}`
      );

      // Invalidate related cache
      await this.cacheService.deletePattern(`sap_odata_${entitySet}_*`);
      return result;
    } catch (error) {
      this.logger.error(`SAP OData update failed: ${entitySet}`, (error as Error).stack);
      throw error;
    }
  }

  async deleteODataEntity(entitySet: string, key: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SAP service is not connected');
    }

    try {
      await this.retryService.executeWithRetry(
        () => this.sapAdapter.deleteODataEntity(entitySet, key),
        `SAP OData Delete ${entitySet}`
      );

      // Invalidate related cache
      await this.cacheService.deletePattern(`sap_odata_${entitySet}_*`);
    } catch (error) {
      this.logger.error(`SAP OData delete failed: ${entitySet}`, (error as Error).stack);
      throw error;
    }
  }

  async sendIDoc(messageType: string, data: Record<string, any>): Promise<string> {
    if (!this.isConnected) {
      throw new Error('SAP service is not connected');
    }

    try {
      const idocId = await this.retryService.executeWithRetry(
        () => this.sapAdapter.sendIDoc(messageType, data),
        `SAP IDoc ${messageType}`
      );

      this.logger.log(`IDoc sent successfully: ${idocId}`);
      return idocId;
    } catch (error) {
      this.logger.error(`SAP IDoc send failed: ${messageType}`, (error as Error).stack);
      throw error;
    }
  }

  async receiveIDoc(idocId: string): Promise<Record<string, any>> {
    if (!this.isConnected) {
      throw new Error('SAP service is not connected');
    }

    try {
      const result = await this.retryService.executeWithRetry(
        () => this.sapAdapter.receiveIDoc(idocId),
        `SAP IDoc Receive ${idocId}`
      );

      return result;
    } catch (error) {
      this.logger.error(`SAP IDoc receive failed: ${idocId}`, (error as Error).stack);
      throw error;
    }
  }

  async syncData(sourceData: EnterpriseData[]): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      errors: [],
      duration: 0,
    };

    try {
      for (const data of sourceData) {
        result.recordsProcessed++;
        
        try {
          // Determine sync method based on data type
          switch (data.type) {
            case 'customer':
              await this.syncCustomer(data);
              break;
            case 'product':
              await this.syncProduct(data);
              break;
            case 'order':
              await this.syncOrder(data);
              break;
            default:
              this.logger.warn(`Unknown data type for sync: ${data.type}`);
              continue;
          }
          
          result.recordsSucceeded++;
        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            recordId: data.id,
            error: (error as Error).message,
            code: 'SYNC_ERROR',
            timestamp: new Date(),
          });
        }
      }

      result.duration = Date.now() - startTime;
      result.success = result.recordsFailed === 0;

      this.logger.log(`Data sync completed: ${result.recordsSucceeded}/${result.recordsProcessed} records succeeded`);
      return result;
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      this.logger.error(`Data sync failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private async syncCustomer(data: EnterpriseData): Promise<void> {
    // Sync customer data to SAP
    const customerData = {
      KUNNR: data.data['customerNumber'],
      NAME1: data.data['name'],
      ORT01: data.data['city'],
      PSTLZ: data.data['postalCode'],
      LAND1: data.data['country'],
    };

    await this.createODataEntity('CustomerSet', customerData);
  }

  private async syncProduct(data: EnterpriseData): Promise<void> {
    // Sync product data to SAP
    const productData = {
      MATNR: data.data['productNumber'],
      MAKTX: data.data['description'],
      MEINS: data.data['unit'],
      PRICE: data.data['price'],
    };

    await this.createODataEntity('ProductSet', productData);
  }

  private async syncOrder(data: EnterpriseData): Promise<void> {
    // Sync order data to SAP
    const orderData = {
      VBELN: data.data['orderNumber'],
      ERDAT: data.data['orderDate'],
      KUNNR: data.data['customerNumber'],
      NETWR: data.data['netValue'],
    };

    await this.createODataEntity('OrderSet', orderData);
  }

  async disconnect(): Promise<void> {
    if (this.sapAdapter) {
      await this.sapAdapter.disconnect();
      this.isConnected = false;
      this.logger.log('SAP service disconnected');
    }
  }
}
