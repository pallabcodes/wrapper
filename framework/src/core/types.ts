export interface Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

export interface Response {
  status: number;
  headers: Record<string, string>;
  body?: any;
}

export type NextFunction = () => void | Promise<void>;
export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;
