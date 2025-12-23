import { Injectable } from '@nestjs/common';

export interface AuthDecision {
  at: string;
  guard: string;
  principal?: any;
  request?: { method: string; path: string };
  resource?: { relation?: string; object?: string };
  required?: string[];
  result: 'allow' | 'deny' | 'skip';
  reason?: string;
}

@Injectable()
export class DecisionAuditService {
  private buffer: AuthDecision[] = [];
  private max = 500;

  record(decision: AuthDecision) {
    this.buffer.push(decision);
    if (this.buffer.length > this.max) this.buffer.shift();
  }

  recent(limit = 100): AuthDecision[] {
    return this.buffer.slice(-limit);
  }
}


