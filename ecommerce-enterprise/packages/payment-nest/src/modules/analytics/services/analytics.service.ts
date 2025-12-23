import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../payment/repositories/payment.repository';
import { PaymentProvider } from '../../payment/entities/payment.entity';

export interface AnalyticsFilters {
  period: string;
  startDate?: string;
  endDate?: string;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  failedPayments: number;
  pendingPayments: number;
}

interface PaymentStatsResponse extends PaymentStats {
  successRate: number;
  averageTransactionValue: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

interface TransactionData {
  date: string;
  transactions: number;
}

interface MonthlyTransactionData {
  month: string;
  transactions: number;
}

interface ProviderStat {
  provider: PaymentProvider;
  totalPayments: number;
  totalAmount: number;
  successRate: number;
}

interface RevenueAnalytics {
  totalRevenue: number;
  period: string;
  startDate: Date;
  endDate: Date;
  dailyRevenue: RevenueData[];
  monthlyRevenue: MonthlyRevenueData[];
}

interface TransactionAnalytics {
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  period: string;
  startDate: Date;
  endDate: Date;
  dailyTransactions: TransactionData[];
  monthlyTransactions: MonthlyTransactionData[];
}

interface ProviderAnalytics {
  providers: ProviderStat[];
  period: string;
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async getPaymentStats(tenantId: string): Promise<PaymentStatsResponse> {
    const stats = await this.paymentRepository.getPaymentStats(tenantId);
    
    return {
      totalPayments: stats.totalPayments,
      totalAmount: stats.totalAmount,
      completedPayments: stats.completedPayments,
      failedPayments: stats.failedPayments,
      pendingPayments: stats.pendingPayments,
      successRate: stats.totalPayments > 0 
        ? (stats.completedPayments / stats.totalPayments) * 100 
        : 0,
      averageTransactionValue: stats.completedPayments > 0 
        ? stats.totalAmount / stats.completedPayments 
        : 0,
    };
  }

  async getRevenueAnalytics(tenantId: string, filters: AnalyticsFilters): Promise<RevenueAnalytics> {
    const { startDate, endDate } = this.parseDateRange(filters);
    
    // This would typically involve more complex queries
    // For now, we'll return basic revenue data
    const stats = await this.paymentRepository.getPaymentStats(tenantId);
    
    return {
      totalRevenue: stats.totalAmount,
      period: filters.period,
      startDate,
      endDate,
      dailyRevenue: await this.getDailyRevenue(tenantId, startDate, endDate),
      monthlyRevenue: await this.getMonthlyRevenue(tenantId, startDate, endDate),
    };
  }

  async getTransactionAnalytics(tenantId: string, filters: AnalyticsFilters): Promise<TransactionAnalytics> {
    const { startDate, endDate } = this.parseDateRange(filters);
    
    const stats = await this.paymentRepository.getPaymentStats(tenantId);
    
    return {
      totalTransactions: stats.totalPayments,
      completedTransactions: stats.completedPayments,
      failedTransactions: stats.failedPayments,
      pendingTransactions: stats.pendingPayments,
      period: filters.period,
      startDate,
      endDate,
      dailyTransactions: await this.getDailyTransactions(tenantId, startDate, endDate),
      monthlyTransactions: await this.getMonthlyTransactions(tenantId, startDate, endDate),
    };
  }

  async getProviderAnalytics(tenantId: string, filters: AnalyticsFilters): Promise<ProviderAnalytics> {
    const { startDate, endDate } = this.parseDateRange(filters);
    
    // This would typically involve more complex queries
    // For now, we'll return basic provider data
    const providerStats = await this.getProviderStats(tenantId, startDate, endDate);
    
    return {
      providers: providerStats,
      period: filters.period,
      startDate,
      endDate,
    };
  }

  private parseDateRange(filters: AnalyticsFilters): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (filters.startDate && filters.endDate) {
      startDate = new Date(filters.startDate);
      endDate = new Date(filters.endDate);
    } else {
      switch (filters.period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return { startDate, endDate };
  }

  private async getDailyRevenue(_tenantId: string, _startDate: Date, _endDate: Date): Promise<RevenueData[]> {
    // This would typically involve a complex SQL query
    // For now, we'll return mock data
    return [
      { date: '2023-01-01', revenue: 1000 },
      { date: '2023-01-02', revenue: 1500 },
      { date: '2023-01-03', revenue: 2000 },
    ];
  }

  private async getMonthlyRevenue(_tenantId: string, _startDate: Date, _endDate: Date): Promise<MonthlyRevenueData[]> {
    // This would typically involve a complex SQL query
    // For now, we'll return mock data
    return [
      { month: '2023-01', revenue: 30000 },
      { month: '2023-02', revenue: 35000 },
      { month: '2023-03', revenue: 40000 },
    ];
  }

  private async getDailyTransactions(_tenantId: string, _startDate: Date, _endDate: Date): Promise<TransactionData[]> {
    // This would typically involve a complex SQL query
    // For now, we'll return mock data
    return [
      { date: '2023-01-01', transactions: 10 },
      { date: '2023-01-02', transactions: 15 },
      { date: '2023-01-03', transactions: 20 },
    ];
  }

  private async getMonthlyTransactions(tenantId: string, startDate: Date, endDate: Date): Promise<MonthlyTransactionData[]> {
    // This would typically involve a complex SQL query
    // For now, we'll return mock data
    return [
      { month: '2023-01', transactions: 300 },
      { month: '2023-02', transactions: 350 },
      { month: '2023-03', transactions: 400 },
    ];
  }

  private async getProviderStats(tenantId: string, startDate: Date, endDate: Date): Promise<ProviderStat[]> {
    // This would typically involve a complex SQL query
    // For now, we'll return mock data
    return [
      {
        provider: PaymentProvider.STRIPE,
        totalPayments: 100,
        totalAmount: 50000,
        successRate: 95,
      },
      {
        provider: PaymentProvider.BRAINTREE,
        totalPayments: 50,
        totalAmount: 25000,
        successRate: 90,
      },
      {
        provider: PaymentProvider.PAYPAL,
        totalPayments: 30,
        totalAmount: 15000,
        successRate: 85,
      },
    ];
  }
}
