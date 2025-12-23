export const RBAC_USER_SELECTOR = Symbol('RBAC_USER_SELECTOR');
export type RbacUserSelector = (req: any) => { roles?: string[]; permissions?: string[] } | undefined;

export const RBAC_ON_DENY = Symbol('RBAC_ON_DENY');
export type RbacOnDeny = (context: { handler: string; path?: string; user?: unknown }) => void;

