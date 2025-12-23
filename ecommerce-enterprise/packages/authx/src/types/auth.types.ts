export interface AuthPrincipal {
  sub: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
}

declare global {
  // Express
  namespace Express {
    interface Request {
      auth?: AuthPrincipal;
    }
  }
}

