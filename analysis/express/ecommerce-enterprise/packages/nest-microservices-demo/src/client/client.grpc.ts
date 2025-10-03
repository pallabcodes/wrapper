import { credentials, loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'node:path';

export interface DemoGrpcClient {
  Sum(req: { a: number; b: number }): Promise<{ result: number }>;
  BatchProcess(req: { items: { id: string; value: number }[] }): Promise<{ processed: number }>;
}

export function createGrpcClient(address = '0.0.0.0:50051'): DemoGrpcClient {
  const protoPath = join(__dirname, '..', 'proto', 'demo.proto');
  const packageDef = loadSync(protoPath, { keepCase: false, longs: String, defaults: true, oneofs: true });
  const pkg = loadPackageDefinition(packageDef) as unknown as { demo: { Demo: new (addr: string, creds: any) => any } };
  const client = new pkg.demo.Demo(address, credentials.createInsecure());
  return {
    Sum: (req) => callUnary(client, 'Sum', req),
    BatchProcess: (req) => callUnary(client, 'BatchProcess', req),
  };
}

function callUnary<TReq, TRes>(client: any, method: string, req: TReq): Promise<TRes> {
  return new Promise<TRes>((resolve, reject) => {
    client[method](req, (err: unknown, res: TRes) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}
