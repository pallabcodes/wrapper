import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateUserInput {
    @Field()
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }) => value?.toLowerCase()?.trim())
    email: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    @Transform(({ value }) => value?.trim())
    name: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;
}
