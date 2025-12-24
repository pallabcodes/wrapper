import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TemplateService } from '../application/services/template.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('templates')
export class TemplateController {
    constructor(private readonly templateService: TemplateService) { }

    @Post()
    create(@Body() dto: CreateTemplateDto) {
        return this.templateService.create(dto);
    }

    @Get()
    findAll() {
        return this.templateService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.templateService.findOne(id);
    }
}
