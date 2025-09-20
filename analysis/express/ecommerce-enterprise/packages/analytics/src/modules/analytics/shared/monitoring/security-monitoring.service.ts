import { Injectable } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Injectable()
export class SecurityMonitoringService {
  // private readonly logger = new Logger(SecurityMonitoringService.name);

  constructor(private readonly metrics: MetricsService) {}

  recordAuthFailure(reason: string, username?: string, ip?: string): void {
    this.metrics.increment('security.auth_failures.total');
    this.metrics.increment(`security.auth_failures.reason.${this.sanitize(reason)}`);
    if (ip) this.metrics.increment(`security.auth_failures.ip.${this.sanitize(ip)}`);
    if (username) this.metrics.increment(`security.auth_failures.user.${this.sanitize(username)}`);
  }

  recordBlockedRequest(rule: string, ip?: string, path?: string): void {
    this.metrics.increment('security.blocked_requests.total');
    this.metrics.increment(`security.blocked_requests.rule.${this.sanitize(rule)}`);
    if (ip) this.metrics.increment(`security.blocked_requests.ip.${this.sanitize(ip)}`);
    if (path) this.metrics.increment(`security.blocked_requests.path.${this.sanitize(path)}`);
  }

  recordSuspiciousActivity(kind: string, value?: string): void {
    this.metrics.increment('security.suspicious.total');
    this.metrics.increment(`security.suspicious.kind.${this.sanitize(kind)}`);
    if (value) this.metrics.increment(`security.suspicious.value.${this.sanitize(value)}`);
  }

  private sanitize(s: string): string {
    return s.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 80);
  }
}


