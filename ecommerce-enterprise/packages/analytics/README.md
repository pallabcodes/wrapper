OpenAPI and SDK generation
--------------------------

Generate spec and types:
```bash
pnpm --filter @ecommerce-enterprise/analytics openapi:gen
pnpm --filter @ecommerce-enterprise/analytics openapi:types
```

Consume in clients by importing generated `openapi/analytics.d.ts` or generating a full SDK with your preferred tool.


