import { UserId } from '../../value-objects/user-id.vo';
import { Email } from '../../value-objects/email.vo';
import { Password } from '../../value-objects/password.vo';

/**
 * Command objects for CQRS write operations
 * Commands represent user intentions to change state
 */

export abstract class UserCommand {
  constructor(public readonly userId?: UserId) {}
}

// Write Commands (Commands)
export class RegisterUserCommand extends UserCommand {
  constructor(
    public readonly email: Email,
    public readonly name: string,
    public readonly password: Password,
    public readonly role?: string
  ) {
    super();
  }
}

export class VerifyUserEmailCommand extends UserCommand {
  constructor(
    public readonly userId: UserId,
    public readonly otpCode: string
  ) {
    super(userId);
  }
}

export class ChangeUserPasswordCommand extends UserCommand {
  constructor(
    public readonly userId: UserId,
    public readonly newPassword: Password
  ) {
    super(userId);
  }
}

export class UpdateUserProfileCommand extends UserCommand {
  constructor(
    public readonly userId: UserId,
    public readonly name?: string,
    public readonly phone?: string
  ) {
    super(userId);
  }
}

export class DeactivateUserCommand extends UserCommand {
  constructor(
    public readonly userId: UserId,
    public readonly reason?: string
  ) {
    super(userId);
  }
}