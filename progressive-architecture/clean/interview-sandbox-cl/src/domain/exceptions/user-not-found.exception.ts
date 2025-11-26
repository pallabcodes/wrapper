export class UserNotFoundException extends Error {
  constructor(identifier: string) {
    super(`User with identifier '${identifier}' not found`);
    this.name = 'UserNotFoundException';
  }
}