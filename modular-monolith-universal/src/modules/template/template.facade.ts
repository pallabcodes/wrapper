import { Injectable } from '@nestjs/common';
import { TemplateService } from './application/services/template.service';
import { CreateTemplateDto } from './presentation/dto/create-template.dto';
import { Template } from './domain/entities/template.entity';

/**
 * TemplateFacade - The PUBLIC API for the Template module.
 * 
 * Other modules should ONLY interact with this Facade.
 * Never import internal services directly from another module.
 * 
 * This pattern enables:
 * 1. Easy extraction to microservice later (change facade to HTTP client).
 * 2. Clear module boundaries.
 * 3. Reduced coupling between modules.
 */
@Injectable()
export class TemplateFacade {
    constructor(private readonly templateService: TemplateService) { }

    async createTemplate(dto: CreateTemplateDto): Promise<Template> {
        return this.templateService.create(dto);
    }

    async getTemplateById(id: string): Promise<Template | undefined> {
        return this.templateService.findOne(id);
    }

    async getAllTemplates(): Promise<Template[]> {
        return this.templateService.findAll();
    }
}
