
import { Module } from '@nestjs/common';
import { TemplateController } from './presentation/template.controller';
import { TemplateService } from './application/template.service';

@Module({
    controllers: [TemplateController],
    providers: [TemplateService],
})
export class TemplateModule { }
