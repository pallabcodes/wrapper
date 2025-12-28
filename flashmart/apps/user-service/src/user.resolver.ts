import { Resolver, Query, Mutation, Args, ResolveReference } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';

@Resolver(() => User)
export class UserResolver {
    constructor(private readonly userService: UserService) { }

    @Query(() => User, { nullable: true })
    async user(@Args('id') id: string): Promise<User | null> {
        return this.userService.findById(id);
    }

    @Query(() => [User])
    async users(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Mutation(() => User)
    async createUser(@Args('input') input: CreateUserInput): Promise<User> {
        return this.userService.create(input);
    }

    // Federation: resolve User references from other services
    @ResolveReference()
    async resolveReference(reference: { __typename: string; id: string }): Promise<User | null> {
        return this.userService.findById(reference.id);
    }
}
