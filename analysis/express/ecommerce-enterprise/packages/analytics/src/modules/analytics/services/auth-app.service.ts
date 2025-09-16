import { Injectable } from '@nestjs/common';
import { JwtServiceX, SessionStore } from '@ecommerce-enterprise/authx';

export interface PrincipalInput {
    sub: string;
    email?: string;
    roles?: string[];
}

@Injectable()
export class AuthAppService {
    constructor(private readonly sessions: SessionStore, private readonly jwt: JwtServiceX) { }

    async login(principal: PrincipalInput) {
        const accessToken = await this.jwt.signAccess(principal);
        const refreshToken = await this.jwt.signRefresh(principal);
        const { sessionId } = await this.sessions.create({ sub: principal.sub, roles: principal.roles ?? [], ...(principal.email !== undefined ? { email: principal.email } : {}) });
        return { accessToken, refreshToken, sessionId };
    }

    async rotate(refreshToken: string) {
        const rotated = await this.jwt.rotate(refreshToken);
        if (!rotated.ok) return undefined;
        return { accessToken: rotated.tokens.accessToken, refreshToken: rotated.tokens.refreshToken };
    }
}

