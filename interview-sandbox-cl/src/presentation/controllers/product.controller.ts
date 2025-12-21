import { Controller, Post, Get, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { ProductDto } from '../../application/dto/product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
    constructor(
        private readonly createProductUseCase: CreateProductUseCase,
        private readonly getProductUseCase: GetProductUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new product' })
    @ApiResponse({ status: 201, description: 'Product created', type: ProductDto })
    async create(@Body() dto: CreateProductDto): Promise<ProductDto> {
        return this.createProductUseCase.execute(dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID' })
    @ApiResponse({ status: 200, description: 'Product found', type: ProductDto })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async get(@Param('id') id: string): Promise<ProductDto> {
        return this.getProductUseCase.execute(id);
    }
}
