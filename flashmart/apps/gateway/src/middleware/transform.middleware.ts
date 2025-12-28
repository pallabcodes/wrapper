import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface TransformRule {
    match: RegExp;
    transform: (req: Request, body: any) => any;
}

@Injectable()
export class RequestTransformMiddleware implements NestMiddleware {
    private readonly requestRules: TransformRule[] = [
        // Normalize field names (snake_case to camelCase)
        {
            match: /.*/,
            transform: (req, body) => this.snakeToCamel(body),
        },
        // Add request metadata
        {
            match: /.*/,
            transform: (req, body) => ({
                ...body,
                _meta: {
                    requestId: req.headers['x-request-id'] || this.generateRequestId(),
                    timestamp: new Date().toISOString(),
                    clientIp: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            }),
        },
    ];

    use(req: Request, res: Response, next: NextFunction) {
        // Generate request ID if not present
        if (!req.headers['x-request-id']) {
            req.headers['x-request-id'] = this.generateRequestId();
        }
        res.setHeader('X-Request-ID', req.headers['x-request-id']);

        // Transform request body if present
        if (req.body && typeof req.body === 'object') {
            for (const rule of this.requestRules) {
                if (rule.match.test(req.path)) {
                    req.body = rule.transform(req, req.body);
                }
            }
        }

        // Wrap response.json to transform responses
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            const transformed = this.transformResponse(body);
            return originalJson(transformed);
        };

        next();
    }

    private transformResponse(body: any): any {
        if (!body || typeof body !== 'object') return body;

        // Wrap in standard envelope if not already wrapped
        if (!body.data && !body.error && !body.errors) {
            return {
                success: true,
                data: body,
                timestamp: new Date().toISOString(),
            };
        }

        return body;
    }

    private snakeToCamel(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this.snakeToCamel(v));
        }
        if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((result, key) => {
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                result[camelKey] = this.snakeToCamel(obj[key]);
                return result;
            }, {} as any);
        }
        return obj;
    }

    private generateRequestId(): string {
        return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
