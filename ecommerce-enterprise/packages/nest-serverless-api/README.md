# @ecommerce-enterprise/nest-serverless-api

A minimal NestJS service packaged for AWS Lambda using `@vendia/serverless-express`.

## Commands

- build: `npm run build`
- offline: `npm run sls:offline`
- deploy: `npm run deploy`

## Endpoints

- GET `/public` – no auth
- GET `/secure` – guarded by enterprise-auth and rbac

## Notes

- Uses Express adapter and caches the Nest app across invocations.
- Integrates with `@ecommerce-enterprise/nest-enterprise-auth` and `@ecommerce-enterprise/nest-enterprise-rbac`.
