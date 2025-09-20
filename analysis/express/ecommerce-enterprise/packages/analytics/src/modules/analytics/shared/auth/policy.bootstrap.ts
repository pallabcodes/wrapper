import { PolicyService } from '@ecommerce-enterprise/authx';

export function bootstrapPolicies(policies: PolicyService) {
  // RBAC roles → permissions
  policies.registerRole('user', ['events:write']);
  policies.registerRole('admin', ['events:write', 'events:read']);

  // ABAC named predicate examples
  policies.registerPredicate('ownsResource', ({ principal, req }) => {
    return principal?.userId && req?.body?.userId && principal.userId === req.body.userId;
  });
}


