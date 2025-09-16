import { SetMetadata } from '@nestjs/common';

export const POLICIES_KEY = 'authx:policies';
export type PolicyHandler = (principal: { roles?: string[]; permissions?: string[] }) => boolean;

export const Policies = (...handlers: PolicyHandler[]) => SetMetadata(POLICIES_KEY, handlers);

