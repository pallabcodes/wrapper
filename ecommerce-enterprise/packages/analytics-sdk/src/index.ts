// Minimal typed client; OpenAPI types are optional in this workspace build.
// Consumers can re-export their own API types; we provide a placeholder here to avoid build coupling.
type API = unknown;

export interface ClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | undefined> | string | undefined;
}

export class AnalyticsClient {
  constructor(private readonly opts: ClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const token = await this.opts.getToken?.();
    if (token) headers['authorization'] = `Bearer ${token}`;
    const res = await fetch(`${this.opts.baseUrl}${path}`, { ...init, headers: { ...headers, ...(init?.headers as any) } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  // Example endpoints (extend as needed using API types)
  getHealth(): Promise<{ status: string }> {
    return this.request('/health');
  }

  getEvents(): Promise<{ data: unknown[]; count: number }> {
    return this.request('/events');
  }
}

export type { API };


