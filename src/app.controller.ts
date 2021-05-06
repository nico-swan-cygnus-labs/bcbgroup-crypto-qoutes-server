import { CacheInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOperation({
        summary: 'Hello page for micorservice and the link to to this API documentation'
    })
    getHello(): string {
        return this.appService.getHello();
    }
}
