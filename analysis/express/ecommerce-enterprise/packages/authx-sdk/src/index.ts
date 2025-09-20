export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthClientOptions {
  baseUrl: string; // e.g., http://localhost:3003/api/v1/analytics
  fetchImpl?: typeof fetch;
  getTokens?: () => Promise<AuthTokens | null> | AuthTokens | null;
  setTokens?: (t: AuthTokens | null) => Promise<void> | void;
}

export function createAuthClient(opts: AuthClientOptions) {
  const f = opts.fetchImpl ?? fetch.bind(globalThis);

  async function json<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  return {
    async login(body: Record<string, unknown>): Promise<AuthTokens> {
      const res = await f(`${opts.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const tokens = await json<AuthTokens>(res);
      await opts.setTokens?.(tokens);
      return tokens;
    },

    async refresh(): Promise<AuthTokens> {
      const res = await f(`${opts.baseUrl}/auth/refresh`, { method: 'POST' });
      const tokens = await json<AuthTokens>(res);
      await opts.setTokens?.(tokens);
      return tokens;
    },

    async fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
      let tokens = (await opts.getTokens?.()) || null;
      const tryOnce = async (tkns: AuthTokens | null): Promise<Response> => {
        const headers = new Headers(init.headers || {});
        if (tkns?.accessToken) headers.set('authorization', `Bearer ${tkns.accessToken}`);
        return await f(input, { ...init, headers });
      };
      let res = await tryOnce(tokens);
      if (res.status === 401 && tokens?.refreshToken) {
        try {
          tokens = await this.refresh();
          res = await tryOnce(tokens);
        } catch {
          await opts.setTokens?.(null);
        }
      }
      return res;
    },

    async requestOtp(subject: string, channel: 'email' | 'sms') {
      const res = await f(`${opts.baseUrl}/auth/otp/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject, channel }),
      });
      return json<{ ticketId: string; expiresIn: number }>(res);
    },

    async verifyOtp(ticketId: string, code: string) {
      const res = await f(`${opts.baseUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketId, code }),
      });
      const tokens = await json<AuthTokens & { ok: boolean }>(res);
      if (tokens.ok) await opts.setTokens?.(tokens);
      return tokens;
    },
  };
}


