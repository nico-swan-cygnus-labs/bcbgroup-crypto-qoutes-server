import { Injectable } from '@nestjs/common';
/**
 * This is the Application main service
 * The hello function can return a nicely formatted status/telemetry output
 *  or redirect to the API docs
 */
@Injectable()
export class AppService {
    getHello(): string {
        return '<a href="/api/">Documentation available<a>';
    }
}
