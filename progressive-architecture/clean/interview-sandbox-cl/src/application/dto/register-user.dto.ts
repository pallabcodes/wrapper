export class RegisterUserDto {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly password: string,
    public readonly role?: 'USER' | 'ADMIN' | 'MODERATOR',
  ) {}
}

