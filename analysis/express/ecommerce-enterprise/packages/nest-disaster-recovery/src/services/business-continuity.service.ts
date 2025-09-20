import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { 
  BusinessContinuityPlan, 
  CriticalProcess, 
  RecoveryStrategy,
  CommunicationPlan,
  Stakeholder,
  CommunicationChannel,
  CommunicationTemplate,
  EscalationMatrix,
  TestingSchedule
} from '../interfaces/disaster-recovery.interface';

@Injectable()
export class BusinessContinuityService {
  private readonly logger = new Logger(BusinessContinuityService.name);
  private bcPlans: Map<string, BusinessContinuityPlan> = new Map();
  private incidents: Map<string, any> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeDefaultPlans();
  }

  private initializeDefaultPlans() {
    const ecommerceBCPlan: BusinessContinuityPlan = {
      id: 'ecommerce-bc-plan',
      name: 'E-commerce Business Continuity Plan',
      description: 'Comprehensive business continuity plan for e-commerce operations',
      businessImpact: {
        financial: 9.5, // High financial impact
        operational: 9.0, // High operational impact
        reputational: 8.5 // High reputational impact
      },
      criticalProcesses: [
        {
          id: 'order-processing',
          name: 'Order Processing',
          description: 'End-to-end order processing from placement to fulfillment',
          owner: 'Operations Team',
          mttr: 2, // 2 hours
          mtbf: 720, // 30 days
          dependencies: ['payment-processing', 'inventory-management'],
          resources: ['order-service', 'database', 'payment-gateway'],
          sla: {
            availability: 99.9,
            performance: 2000 // 2 seconds
          }
        },
        {
          id: 'payment-processing',
          name: 'Payment Processing',
          description: 'Secure payment processing and transaction handling',
          owner: 'Finance Team',
          mttr: 1, // 1 hour
          mtbf: 1440, // 60 days
          dependencies: ['payment-gateway', 'fraud-detection'],
          resources: ['payment-service', 'encryption', 'compliance'],
          sla: {
            availability: 99.99,
            performance: 1000 // 1 second
          }
        },
        {
          id: 'customer-support',
          name: 'Customer Support',
          description: 'Customer service and support operations',
          owner: 'Support Team',
          mttr: 4, // 4 hours
          mtbf: 168, // 7 days
          dependencies: ['ticket-system', 'knowledge-base'],
          resources: ['support-portal', 'chat-system', 'phone-system'],
          sla: {
            availability: 99.5,
            performance: 5000 // 5 seconds
          }
        }
      ],
      recoveryStrategies: [
        {
          id: 'preventive-monitoring',
          name: 'Preventive Monitoring',
          type: 'preventive',
          description: 'Proactive monitoring and alerting to prevent incidents',
          implementation: 'Implement comprehensive monitoring across all systems',
          cost: 50000,
          effectiveness: 85,
          timeline: 30
        },
        {
          id: 'redundant-infrastructure',
          name: 'Redundant Infrastructure',
          type: 'preventive',
          description: 'Deploy redundant systems for critical components',
          implementation: 'Set up active-passive or active-active redundancy',
          cost: 200000,
          effectiveness: 95,
          timeline: 90
        },
        {
          id: 'rapid-response-team',
          name: 'Rapid Response Team',
          type: 'corrective',
          description: 'Dedicated team for rapid incident response',
          implementation: 'Establish 24/7 incident response team',
          cost: 300000,
          effectiveness: 90,
          timeline: 60
        }
      ],
      communicationPlan: {
        id: 'ecommerce-comm-plan',
        stakeholders: [
          {
            id: 'executive-team',
            name: 'Executive Team',
            role: 'Business Owners',
            contactInfo: {
              email: 'executives@company.com',
              phone: '+1-555-0001'
            },
            notificationPreferences: ['email', 'phone'],
            criticality: 'critical'
          },
          {
            id: 'technical-team',
            name: 'Technical Team',
            role: 'System Administrators',
            contactInfo: {
              email: 'tech-team@company.com',
              phone: '+1-555-0002'
            },
            notificationPreferences: ['email', 'slack'],
            criticality: 'critical'
          },
          {
            id: 'customers',
            name: 'Customers',
            role: 'End Users',
            contactInfo: {
              email: 'status@company.com',
              phone: '+1-555-0003'
            },
            notificationPreferences: ['email', 'website'],
            criticality: 'important'
          }
        ],
        channels: [
          {
            id: 'email-primary',
            name: 'Primary Email',
            type: 'email',
            config: {
              smtp: 'smtp.company.com',
              port: 587
            },
            priority: 1,
            reliability: 99
          },
          {
            id: 'slack-alerts',
            name: 'Slack Alerts',
            type: 'slack',
            config: {
              webhook: 'https://hooks.slack.com/services/...',
              channel: '#incidents'
            },
            priority: 2,
            reliability: 95
          },
          {
            id: 'phone-emergency',
            name: 'Emergency Phone',
            type: 'phone',
            config: {
              provider: 'Twilio',
              number: '+1-555-0000'
            },
            priority: 1,
            reliability: 98
          }
        ],
        templates: [
          {
            id: 'incident-notification',
            name: 'Incident Notification',
            type: 'incident',
            subject: 'INCIDENT: {{severity}} - {{service}} is experiencing issues',
            body: 'We are currently experiencing issues with {{service}}. Impact: {{impact}}. ETA for resolution: {{eta}}. Updates will be provided every {{updateInterval}} minutes.',
            variables: ['severity', 'service', 'impact', 'eta', 'updateInterval']
          },
          {
            id: 'resolution-notification',
            name: 'Resolution Notification',
            type: 'resolution',
            subject: 'RESOLVED: {{service}} issue has been resolved',
            body: 'The issue with {{service}} has been resolved. Total downtime: {{downtime}}. Root cause: {{rootCause}}. Preventive measures: {{preventiveMeasures}}.',
            variables: ['service', 'downtime', 'rootCause', 'preventiveMeasures']
          }
        ],
        escalationMatrix: {
          levels: [
            {
              level: 1,
              contacts: ['technical-team'],
              criteria: ['Service degradation', 'Minor outage'],
              actions: ['Acknowledge incident', 'Begin investigation']
            },
            {
              level: 2,
              contacts: ['technical-team', 'executive-team'],
              criteria: ['Service outage', 'Data breach'],
              actions: ['Escalate to management', 'Activate response team']
            },
            {
              level: 3,
              contacts: ['executive-team', 'customers'],
              criteria: ['Extended outage', 'Security incident'],
              actions: ['Public communication', 'External support']
            }
          ],
          timeouts: [15, 30, 60] // minutes
        }
      },
      testingSchedule: {
        frequency: 'quarterly',
        dayOfMonth: 15,
        time: '02:00',
        duration: 4,
        type: 'hybrid'
      },
      lastReview: new Date(),
      nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      status: 'active'
    };

    this.bcPlans.set(ecommerceBCPlan.id, ecommerceBCPlan);
    this.logger.log('Default business continuity plans initialized');
  }

  async createBCPlan(plan: BusinessContinuityPlan): Promise<BusinessContinuityPlan> {
    plan.id = plan.id || uuidv4();
    this.bcPlans.set(plan.id, plan);
    this.logger.log(`BC Plan created: ${plan.name}`);
    return plan;
  }

  async getBCPlans(): Promise<BusinessContinuityPlan[]> {
    return Array.from(this.bcPlans.values());
  }

  async getBCPlan(id: string): Promise<BusinessContinuityPlan | null> {
    return this.bcPlans.get(id) || null;
  }

  async updateBCPlan(id: string, updates: Partial<BusinessContinuityPlan>): Promise<BusinessContinuityPlan | null> {
    const plan = this.bcPlans.get(id);
    if (!plan) return null;

    const updatedPlan = { ...plan, ...updates };
    this.bcPlans.set(id, updatedPlan);
    this.logger.log(`BC Plan updated: ${plan.name}`);
    return updatedPlan;
  }

  async createIncident(incident: any): Promise<any> {
    incident.id = incident.id || uuidv4();
    incident.createdAt = new Date();
    incident.status = 'open';
    this.incidents.set(incident.id, incident);
    this.logger.log(`Incident created: ${incident.id}`);
    return incident;
  }

  async getIncidents(status?: string): Promise<any[]> {
    let incidents = Array.from(this.incidents.values());
    
    if (status) {
      incidents = incidents.filter(incident => incident.status === status);
    }

    return incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateIncident(id: string, updates: any): Promise<any | null> {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    const updatedIncident = { ...incident, ...updates, updatedAt: new Date() };
    this.incidents.set(id, updatedIncident);
    this.logger.log(`Incident updated: ${id}`);
    return updatedIncident;
  }

  async escalateIncident(incidentId: string, level: number): Promise<boolean> {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    const plan = this.bcPlans.get(incident.planId);
    if (!plan) return false;

    const escalationLevel = plan.communicationPlan.escalationMatrix.levels.find(l => l.level === level);
    if (!escalationLevel) return false;

    // Simulate escalation notification
    this.logger.log(`Incident ${incidentId} escalated to level ${level}`);
    
    // Update incident with escalation info
    incident.escalationLevel = level;
    incident.escalatedAt = new Date();
    incident.escalatedTo = escalationLevel.contacts;

    return true;
  }

  async sendNotification(templateId: string, variables: Record<string, any>, recipients: string[]): Promise<boolean> {
    const plan = Array.from(this.bcPlans.values())[0]; // Get first plan for demo
    const template = plan.communicationPlan.templates.find(t => t.id === templateId);
    if (!template) return false;

    // Simulate notification sending
    this.logger.log(`Sending notification to ${recipients.length} recipients using template ${templateId}`);
    
    // In a real implementation, this would send actual notifications
    return true;
  }

  async getBCMetrics(): Promise<any> {
    const plans = Array.from(this.bcPlans.values());
    const incidents = Array.from(this.incidents.values());

    const totalPlans = plans.length;
    const activePlans = plans.filter(plan => plan.status === 'active').length;
    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter(incident => incident.status === 'open').length;
    const resolvedIncidents = incidents.filter(incident => incident.status === 'resolved').length;

    const averageMTTR = plans.reduce((sum, plan) => 
      sum + plan.criticalProcesses.reduce((processSum, process) => processSum + process.mttr, 0), 0) / 
      plans.reduce((sum, plan) => sum + plan.criticalProcesses.length, 0);

    const averageMTBF = plans.reduce((sum, plan) => 
      sum + plan.criticalProcesses.reduce((processSum, process) => processSum + process.mtbf, 0), 0) / 
      plans.reduce((sum, plan) => sum + plan.criticalProcesses.length, 0);

    return {
      totalPlans,
      activePlans,
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      resolutionRate: totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0,
      averageMTTR,
      averageMTBF,
      lastIncident: incidents.length > 0 ? incidents[0].createdAt : null
    };
  }

  async testCommunicationPlan(planId: string): Promise<{
    success: boolean;
    results: any[];
    issues: string[];
  }> {
    const plan = this.bcPlans.get(planId);
    if (!plan) {
      throw new Error(`BC Plan not found: ${planId}`);
    }

    const results: any[] = [];
    const issues: string[] = [];

    // Test each communication channel
    for (const channel of plan.communicationPlan.channels) {
      const result = {
        channelId: channel.id,
        channelName: channel.name,
        status: Math.random() < 0.9 ? 'success' : 'failed',
        responseTime: Math.random() * 5000, // 0-5 seconds
        details: `Test message sent via ${channel.name}`
      };
      results.push(result);

      if (result.status === 'failed') {
        issues.push(`Communication channel ${channel.name} is not responding`);
      }
    }

    // Test escalation matrix
    for (const level of plan.communicationPlan.escalationMatrix.levels) {
      const result = {
        level: level.level,
        contacts: level.contacts,
        status: Math.random() < 0.95 ? 'success' : 'failed',
        details: `Escalation level ${level.level} test completed`
      };
      results.push(result);

      if (result.status === 'failed') {
        issues.push(`Escalation level ${level.level} contacts not reachable`);
      }
    }

    return {
      success: issues.length === 0,
      results,
      issues
    };
  }
}
