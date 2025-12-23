import { Inject, Injectable } from '@nestjs/common';
import { Issuer, generators, Client, AuthorizationParameters } from 'openid-client';

@Injectable()
export class OidcService {
  private client?: Client;
  constructor(@Inject('AUTHX_OPTIONS') private readonly options: any) {}

  async ensureClient(): Promise<Client> {
    if (this.client) return this.client;
    const { issuer, clientId, clientSecret, redirectUri } = this.options.oidc || {};
    if (!issuer || !clientId || !redirectUri) throw new Error('AuthX: OIDC config incomplete');
    const iss = await Issuer.discover(issuer);
    this.client = new iss.Client({ client_id: clientId, client_secret: clientSecret, redirect_uris: [redirectUri], response_types: ['code'] });
    return this.client;
  }

  async authUrl(state?: string) {
    const client = await this.ensureClient();
    const verifier = generators.codeVerifier();
    const challenge = generators.codeChallenge(verifier);
    const params: AuthorizationParameters = { scope: 'openid email profile', code_challenge: challenge, code_challenge_method: 'S256' } as any;
    if (state !== undefined) (params as any).state = state as string;
    const url = client.authorizationUrl(params);
    return { url, verifier };
  }
}

