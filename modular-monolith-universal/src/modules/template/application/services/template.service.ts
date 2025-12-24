import { Injectable } from '@nestjs/common';
import { Template } from '../../domain/entities/template.entity';
import { CreateTemplateDto } from '../../presentation/dto/create-template.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TemplateService {
    private templates: Map<string, Template> = new Map();

    create(dto: CreateTemplateDto): Template {
        const template = new Template(randomUUID(), dto.name, dto.description);
        this.templates.set(template.id, template);
        return template;
    }

    findAll(): Template[] {
        return Array.from(this.templates.values());
    }

    findOne(id: string): Template | undefined {
        return this.templates.get(id);
    }
}
