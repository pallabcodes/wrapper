import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuardSmart } from '../guards/auth.guard';

export const Auth = () => applyDecorators(UseGuards(AuthGuardSmart));

