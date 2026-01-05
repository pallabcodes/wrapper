import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { CheckRateLimitUseCase } from '@application/use-cases/check-rate-limit.usecase';
import { CheckRateLimitRequest } from '@application/dto/check-rate-limit-request.dto';
import { CheckRateLimitHttpDto } from '../dto/check-rate-limit-http.dto';
import { CheckRateLimitHttpResponse } from '../dto/check-rate-limit-response.dto';

/**
 * Presentation Layer: HTTP Controller
 * 
 * Inbound adapter for HTTP requests
 * (In Hexagonal: adapters/inbound/rate-limit.controller.ts)
 */
@Controller('check')
export class RateLimitController {
    constructor(private readonly checkUseCase: CheckRateLimitUseCase) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async check(@Body() dto: CheckRateLimitHttpDto): Promise<CheckRateLimitHttpResponse> {
        // 1. Transform HTTP Request DTO -> Application Request DTO
        const request = new CheckRateLimitRequest(dto.clientId, dto.resource);

        // 2. Execute Use Case
        const response = await this.checkUseCase.execute(request); // Gets Application DTO

        // 3. Transform Application Response DTO -> HTTP Response DTO
        return CheckRateLimitHttpResponse.from(response); // Converts then returns HTTP DTO
    }
}
