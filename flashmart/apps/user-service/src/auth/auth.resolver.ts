import { Resolver, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

@ObjectType()
export class AuthPayload {
    @Field(() => User)
    user: User;

    @Field()
    token: string;
}

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) { }

    @Mutation(() => AuthPayload)
    async register(
        @Args('email') email: string,
        @Args('password') password: string,
        @Args('name') name: string,
    ): Promise<AuthPayload> {
        return this.authService.register(email, password, name);
    }

    @Mutation(() => AuthPayload)
    async login(
        @Args('email') email: string,
        @Args('password') password: string,
    ): Promise<AuthPayload> {
        return this.authService.login(email, password);
    }
}
