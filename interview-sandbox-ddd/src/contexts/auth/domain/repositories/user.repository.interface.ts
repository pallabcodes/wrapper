import { UserAggregate } from '../aggregates/user.aggregate';

export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findById(id: string): Promise<UserAggregate | null>;
  findByEmail(email: string): Promise<UserAggregate | null>;
  findAll(): Promise<UserAggregate[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
