import { Body, Controller, Post, Res, Req, Get } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthAppService } from '../services/auth-app.service';
import { Auth, OtpService } from '@ecommerce-enterprise/authx';

class LoginDto {
    email?: string;
    userId?: string;
    roles?: string[];
}

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthAppService, private readonly otp: OtpService) { }

    @Post('login')
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        const principal = this.buildPrincipal(body);
        const { accessToken, refreshToken, sessionId } = await this.auth.login(principal);
        this.setAuthCookies(res, sessionId, refreshToken);
        return { accessToken, refreshToken };
    }

    @Post('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refresh = this.getRefreshToken(req);
        if (!refresh) {
            res.status(401);
            return { message: 'Missing refresh token' };
        }
        const rotated = await this.auth.rotate(refresh);
        if (!rotated) {
            res.status(401);
            return { message: 'Invalid refresh token' };
        }
        this.setAuthCookies(res, undefined, rotated.refreshToken);
        return { accessToken: rotated.accessToken, refreshToken: rotated.refreshToken };
    }

    @Auth()
    @Get('me')
    me(@Req() req: Request) {
        const anyReq = req as Request & { auth?: { sub: string; roles?: string[] } };
        return { sub: anyReq.auth?.sub, roles: anyReq.auth?.roles ?? [] };
    }

    @Post('otp/request')
    async requestOtp(@Body() body: { subject: string; channel: 'email' | 'sms' }) {
        const { ticketId, expiresIn } = await this.otp.requestCode(body.subject, body.channel);
        return { ticketId, expiresIn };
    }

    @Post('otp/verify')
    async verifyOtp(@Body() body: { ticketId: string; code: string; roles?: string[] }) {
        const res = await this.otp.verifyCode(body.ticketId, body.code);
        if (!res.ok || !res.subject) {
            return { ok: false };
        }
        const principal = this.buildPrincipal({ email: res.subject, roles: body.roles ?? ['user'] });
        const tokens = await this.auth.login(principal);
        return { ok: true, ...tokens };
    }

    private buildPrincipal(body: LoginDto): { sub: string; roles?: string[]; email?: string } {
        const principal: { sub: string; roles?: string[]; email?: string } = {
            sub: String(body.userId ?? body.email ?? 'demo-user'),
            roles: body.roles ?? ['user'],
        };
        if (body.email !== undefined) principal.email = body.email;
        return principal;
    }

    private getRefreshToken(req: Request): string | undefined {
        const cookieReq = req as Request & { cookies?: Record<string, string> };
        const headerValue = req.headers['x-refresh-token'];
        const headerRefresh = Array.isArray(headerValue) ? headerValue[0] : (headerValue as string | undefined);
        return cookieReq.cookies?.refresh_token || headerRefresh;
    }

    private setAuthCookies(res: Response, sessionId?: string, refreshToken?: string) {
        if (sessionId) res.cookie('sid', sessionId, { httpOnly: true, sameSite: 'lax' });
        if (refreshToken) res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax' });
    }
}

