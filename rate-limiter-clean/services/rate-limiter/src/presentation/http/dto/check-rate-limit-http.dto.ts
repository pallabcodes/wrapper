import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * Presentation DTO: HTTP Request Validation
 * 
 * This is HTTP-specific validation (different from application DTO)
 */
export class CheckRateLimitHttpDto {
    @IsString()
    @IsNotEmpty()
    clientId!: string;

    @IsString()
    @Matches(/^\/.*/, { message: 'resource must start with /' })
    resource!: string;
}
