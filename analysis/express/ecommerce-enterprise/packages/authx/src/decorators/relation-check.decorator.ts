import { SetMetadata } from '@nestjs/common';

export const RELATION_CHECK = 'authx:relation_check';

export interface RelationCheckSpec {
  relation: string;
  objectParam: string; // name of param in request (req.params[objectParam])
  subjectFrom?: 'principal' | 'param';
  subjectParam?: string; // if subjectFrom=param, param name
}

export function RelationCheck(spec: RelationCheckSpec) {
  return SetMetadata(RELATION_CHECK, spec);
}


