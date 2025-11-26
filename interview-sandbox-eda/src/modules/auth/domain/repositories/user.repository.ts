import { UserAggregate } from '../aggregates/user.aggregate';
import { Email } from '../value-objects/email.vo';

export interface UserRepository {
  save(user: UserAggregate): Promise<void>;
  findById(id: string): Promise<UserAggregate | null>;
  findByEmail(email: string): Promise<UserAggregate | null>;
  findAll(): Promise<UserAggregate[]>;
  delete(id: string): Promise<void>;
}
