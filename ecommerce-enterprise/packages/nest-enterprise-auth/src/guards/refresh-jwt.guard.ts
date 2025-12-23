import { Injectable, applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshJwtAuthGuard extends AuthGuard('jwt-refresh') {}

export function UseRefreshGuard() {
  return applyDecorators(UseGuards(RefreshJwtAuthGuard));
}

