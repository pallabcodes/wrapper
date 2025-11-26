export class UserDto {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: string,
    public readonly isEmailVerified: boolean,
  ) {}
}

