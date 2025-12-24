import { Module } from '@nestjs/common';
import { TemplateController } from './presentation/template.controller';
import { TemplateService } from './application/services/template.service';
import { TemplateFacade } from './template.facade';

@Module({
    controllers: [TemplateController],
    providers: [TemplateService, TemplateFacade],
    exports: [TemplateFacade], // Only export the Facade - the public API
})
export class TemplateModule { }
