export interface JwtRegisteredClaims {
  iss?: string;
  sub: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

export interface AuthUserBase {
  id: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  tenantId?: string;
}

export type JwtPayload<TCustom extends object = Record<string, unknown>> = JwtRegisteredClaims & TCustom;

export interface AuthContext<TUser extends AuthUserBase = AuthUserBase> {
  user: TUser;
  token?: string;
  requestId?: string;
}

declare global {
  namespace Express {
    // Augment Express Request for better DX in controllers/guards
    interface Request {
      user?: AuthUserBase;
      authContext?: AuthContext;
    }
  }
}

