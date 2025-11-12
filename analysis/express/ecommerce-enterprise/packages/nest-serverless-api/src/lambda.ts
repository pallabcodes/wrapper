import type { Handler, Context } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import { bootstrapExpress } from './main';

let server: Handler | undefined;

export const handler: Handler = async (event, context: Context, callback) => {
  if (!server) {
    const app = await bootstrapExpress();
    server = serverlessExpress({ app });
  }
  return (server as Handler)(event, context, callback);
};
