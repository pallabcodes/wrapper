
import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from '../presentation/dto/create-template.dto';

@Injectable()
export class TemplateService {
    create(dto: CreateTemplateDto) {
        // Business Logic Here
        // e.g., call repository, validate domain entity
        return `This action adds a new template: ${dto.name}`;
    }

    findAll() {
        return `This action returns all templates`;
    }

    findOne(id: string) {
        return `This action returns a #${id} template`;
    }
}
