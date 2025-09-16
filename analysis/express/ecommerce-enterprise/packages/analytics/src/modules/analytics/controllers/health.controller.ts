import { Controller, Get } from '@nestjs/common';
import { JwtServiceX } from '@ecommerce-enterprise/authx';
import net from 'net';

function tryConnect(host: string, port: number, timeoutMs = 1500): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = net.createConnection({ host, port });
        const onOk = () => { cleanup(); resolve(true); };
        const onErr = () => { cleanup(); resolve(false); };
        const cleanup = () => { socket.removeAllListeners(); socket.destroy(); };
        socket.setTimeout(timeoutMs);
        socket.once('connect', onOk);
        socket.once('timeout', onErr);
        socket.once('error', onErr);
    });
}

@Controller()
export class HealthController {
    constructor(private readonly jwt: JwtServiceX) {}

    @Get('live')
    live() {
        return { status: 'ok' };
    }

    @Get('ready')
    async ready() {
        const dbHost = process.env['DATABASE_HOST'] || 'localhost';
        const dbPort = Number(process.env['DATABASE_PORT'] || 5432);
        const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
        const { hostname: redisHost, port: redisPortStr } = new URL(redisUrl);
        const redisPort = Number(redisPortStr || 6379);

        const dbOk = await tryConnect(dbHost, dbPort);
        const redisOk = await tryConnect(redisHost, redisPort);

        let jwtOk = false;
        try {
            // attempt a cheap sign to verify signer readiness
            await this.jwt.signAccess({ sub: 'readiness-probe' });
            jwtOk = true;
        } catch {
            jwtOk = false;
        }

        const ok = dbOk && redisOk && jwtOk;
        return { status: ok ? 'ok' : 'degraded', checks: { dbOk, redisOk, jwtOk } };
    }
}


