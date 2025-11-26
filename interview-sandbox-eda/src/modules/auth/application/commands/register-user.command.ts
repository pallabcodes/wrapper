import { UserRole } from '../../domain/aggregates/user.aggregate';

export class RegisterUserCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly password: string,
    public readonly role: UserRole = 'USER',
  ) {}
}
