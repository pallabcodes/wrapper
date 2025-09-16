import { Inject, Injectable } from '@nestjs/common';
import { generateRegistrationOptions, generateAuthenticationOptions } from '@simplewebauthn/server';

@Injectable()
export class WebAuthnService {
  constructor(@Inject('AUTHX_OPTIONS') private readonly options: any) {}

  generateRegistration(user: { id: string; name: string; displayName?: string }) {
    const { rpName, rpID, origin } = this.options.webauthn || {};
    if (!rpName || !rpID || !origin) throw new Error('AuthX: WebAuthn config incomplete');
    return generateRegistrationOptions({ rpName, rpID, userName: user.name, userID: Buffer.from(user.id), attestationType: 'none' });
  }

  generateAuthentication(allowCredentials: { id: string; transports?: any[] }[]) {
    const { rpID } = this.options.webauthn || {};
    return generateAuthenticationOptions({ rpID, allowCredentials });
  }
}

