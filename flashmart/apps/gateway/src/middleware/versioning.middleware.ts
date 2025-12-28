import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface VersionedRequest extends Request {
    apiVersion?: string;
}

@Injectable()
export class VersioningMiddleware implements NestMiddleware {
    private readonly defaultVersion = '1';
    private readonly supportedVersions = ['1', '2'];

    use(req: VersionedRequest, res: Response, next: NextFunction) {
        // Extract version from multiple sources (priority order)
        let version = this.extractVersion(req);

        // Validate and default
        if (!version || !this.supportedVersions.includes(version)) {
            version = this.defaultVersion;
        }

        req.apiVersion = version;
        res.setHeader('X-API-Version', version);
        res.setHeader('X-API-Deprecated', version === '1' ? 'true' : 'false');

        // Add deprecation warning for v1
        if (version === '1') {
            res.setHeader('Deprecation', 'true');
            res.setHeader('Sunset', 'Sat, 01 Jan 2026 00:00:00 GMT');
        }

        next();
    }

    private extractVersion(req: Request): string | undefined {
        // 1. URL path: /v1/users, /v2/products
        const pathMatch = req.path.match(/^\/v(\d+)\//);
        if (pathMatch) return pathMatch[1];

        // 2. Header: Accept-Version: v1 or X-API-Version: 1
        const acceptVersion = req.headers['accept-version'] as string;
        if (acceptVersion) {
            const match = acceptVersion.match(/v?(\d+)/);
            if (match) return match[1];
        }

        const xApiVersion = req.headers['x-api-version'] as string;
        if (xApiVersion) return xApiVersion;

        // 3. Query parameter: ?version=1
        const queryVersion = req.query.version as string;
        if (queryVersion) return queryVersion;

        // 4. Accept header: Accept: application/vnd.flashmart.v1+json
        const accept = req.headers.accept as string;
        if (accept) {
            const match = accept.match(/vnd\.flashmart\.v(\d+)/);
            if (match) return match[1];
        }

        return undefined;
    }
}
