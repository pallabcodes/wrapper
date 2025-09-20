import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import fastJson from 'fast-json-stringify';

const SERIALIZE_SCHEMA = 'serialize:schema';

export function Serialize(schema?: object): MethodDecorator & ClassDecorator {
  return ((target: any, _key?: any, descriptor?: any) => {
    const loc = descriptor?.value || target;
    Reflect.defineMetadata(SERIALIZE_SCHEMA, schema, loc);
  }) as any;
}

@Injectable()
export class FastStringifyInterceptor implements NestInterceptor {
  private cache = new WeakMap<object, (data: any) => string>();
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const schema = this.reflector.get<object | undefined>(SERIALIZE_SCHEMA, handler);
    if (!schema) return next.handle();

    let stringify = this.cache.get(handler);
    if (!stringify) {
      stringify = fastJson(schema as any);
      this.cache.set(handler, stringify);
    }
    const res = context.switchToHttp().getResponse();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return next.handle().pipe(map((data) => stringify!(data)));
  }
}


