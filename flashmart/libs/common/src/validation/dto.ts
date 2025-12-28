import { IsString, IsNumber, IsOptional, IsEmail, IsUUID, Min, Max, IsEnum, IsBoolean, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// =============== User DTOs ===============

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    name?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

// =============== Payment DTOs ===============

export class CreatePaymentDto {
    @IsUUID()
    userId: string;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsString()
    currency: string = 'usd';

    @IsOptional()
    @IsString()
    orderId?: string;
}

// =============== Order DTOs ===============

export class OrderItemDto {
    @IsUUID()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    price: number;
}

export class CreateOrderDto {
    @IsUUID()
    userId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}

// =============== Pagination DTOs ===============

export class PaginationQueryDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}
