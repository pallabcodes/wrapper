
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TemplateService } from '../application/template.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('template')
export class TemplateController {
    constructor(private readonly templateService: TemplateService) { }

    @Post()
    create(@Body() createTemplateDto: CreateTemplateDto) {
        return this.templateService.create(createTemplateDto);
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
