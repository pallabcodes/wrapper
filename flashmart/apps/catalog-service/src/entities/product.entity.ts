import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class Category {
    @Field(() => ID)
    id: string;

    @Field()
    name: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    imageUrl?: string;
}

@ObjectType()
export class Product {
    @Field(() => ID)
    id: string;

    @Field()
    name: string;

    @Field()
    description: string;

    @Field(() => Float)
    price: number;

    @Field(() => Int)
    stock: number;

    @Field({ nullable: true })
    imageUrl?: string;

    @Field(() => [String], { nullable: true })
    images?: string[];

    @Field()
    categoryId: string;

    @Field(() => Category, { nullable: true })
    category?: Category;

    @Field()
    isActive: boolean;

    @Field()
    createdAt: Date;
}
