
import { AggregateRoot, DomainException, ErrorCode } from '@streamverse/common';
import { User } from '../entities/user.entity';

// We import the events from the events file
import { UserRegisteredEvent, PasswordChangedEvent } from '../events/user.events';

export class UserAggregate extends AggregateRoot {
    private _user: User;

    constructor(user: User) {
        super(user.getId()); // Use getter
        this._user = user;
    }

    public get user(): User {
        return this._user;
    }

    // Factory method
    public static register(
        id: string,
        email: string,
        passwordHash: string,
        username: string
    ): UserAggregate {
        // Use User entity factory
        const user = User.create(
            id,
            email,
            username,
            passwordHash,
            // phone is optional in create? checking entity signature next step if fail
            // assuming basic create signature based on common patterns
        );

        const aggregate = new UserAggregate(user);

        aggregate.addDomainEvent(
            new UserRegisteredEvent(id, email, username)
        );

        return aggregate;
    }

    public verifyEmail(): void {
        // Delegate to entity method
        this._user.verifyEmail();

        // We could add an event here
        // this.addDomainEvent(new EmailVerifiedEvent(this.getId()));
    }

    public changePassword(newPasswordHash: string): void {
        // Delegate
        this._user.changePassword(newPasswordHash);

        this.addDomainEvent(
            new PasswordChangedEvent(this.getId())
        );
    }

    // Implement abstract equals
    equals(other: AggregateRoot): boolean {
        return other instanceof UserAggregate && this.getId() === other.getId();
    }
}
