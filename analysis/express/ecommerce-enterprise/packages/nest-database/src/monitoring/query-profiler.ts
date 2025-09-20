import { Injectable, Logger } from '@nestjs/common';

export interface QueryProfile {
  id: string;
  query: string;
  duration: number;
  timestamp: Date;
  parameters?: any[];
  stack?: string;
}

@Injectable()
export class QueryProfiler {
  private readonly logger = new Logger(QueryProfiler.name);
  private readonly profiles: Map<string, QueryProfile> = new Map();
  private readonly slowQueryThreshold: number = 1000; // 1 second

  startQuery(id: string, query: string, parameters?: any[]): void {
    const profile: QueryProfile = {
      id,
      query,
      duration: 0,
      timestamp: new Date(),
      parameters,
      stack: new Error().stack,
    };
    
    this.profiles.set(id, profile);
  }

  endQuery(id: string): QueryProfile | null {
    const profile = this.profiles.get(id);
    if (!profile) {
      return null;
    }

    profile.duration = Date.now() - profile.timestamp.getTime();
    this.profiles.delete(id);

    if (profile.duration > this.slowQueryThreshold) {
      this.logger.warn(`Slow query detected: ${profile.duration}ms`, {
        query: profile.query,
        parameters: profile.parameters,
        stack: profile.stack,
      });
    }

    return profile;
  }

  getSlowQueries(threshold?: number): QueryProfile[] {
    const actualThreshold = threshold || this.slowQueryThreshold;
    return Array.from(this.profiles.values()).filter(
      profile => profile.duration > actualThreshold
    );
  }

  clearProfiles(): void {
    this.profiles.clear();
  }

  getProfileCount(): number {
    return this.profiles.size;
  }
}

