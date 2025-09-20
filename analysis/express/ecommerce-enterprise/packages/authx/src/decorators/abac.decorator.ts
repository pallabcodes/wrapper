import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PREDICATE = 'authx:require_predicate';

export type AbacPredicate = (args: {
  principal: any;
  req: any;
}) => boolean | Promise<boolean>;

export function Require(predicate: AbacPredicate) {
  return SetMetadata(REQUIRE_PREDICATE, predicate);
}


