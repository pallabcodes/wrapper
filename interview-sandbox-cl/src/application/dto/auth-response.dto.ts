import { UserDto } from './user.dto';
import { TokenPair } from '../../infrastructure/auth/jwt.service';

export class AuthResponseDto {
  constructor(
    public readonly user: UserDto,
    public readonly tokens: TokenPair,
  ) {}
}
