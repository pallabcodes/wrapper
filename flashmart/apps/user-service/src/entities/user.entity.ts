import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
    @Field(() => ID)
    id: string;

    @Field()
    email: string;

    @Field()
    name: string;

    @Field({ nullable: true })
    avatarUrl?: string;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
