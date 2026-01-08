
import { DomainEvent } from '@streamverse/common';

export class UserRegisteredEvent extends DomainEvent {
    constructor(
        public readonly userId: string,
        public readonly email: string,
        public readonly username: string
    ) {
        super(userId, 'User');
    }

    getEventName(): string {
        return 'user.registered';
    }

    protected getPayload(): any {
        return {
            email: this.email,
            username: this.username,
        };
    }
}

export class PasswordChangedEvent extends DomainEvent {
    constructor(public readonly userId: string) {
        super(userId, 'User');
    }

    getEventName(): string {
        return 'user.password_changed';
    }

    protected getPayload(): any {
        return {};
    }
}
