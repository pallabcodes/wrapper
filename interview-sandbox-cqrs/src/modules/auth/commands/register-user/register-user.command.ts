export class RegisterUserCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly password: string,
    public readonly role?: string,
  ) {}
}
