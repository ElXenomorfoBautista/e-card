import { Request, RestBindings, get, ResponseObject } from '@loopback/rest';
import { inject } from '@loopback/context';
import { authorize } from 'loopback4-authorization';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
    description: 'Ping Response',
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    greeting: { type: 'string' },
                    date: { type: 'string' },
                    url: { type: 'string' },
                    headers: {
                        type: 'object',
                        properties: {
                            'Content-Type': { type: 'string' },
                        },
                        additionalProperties: true,
                    },
                },
            },
        },
    },
};

/**
 * A simple controller to bounce back http requests
 */
export class PingController {
    constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

    // Map to `GET /ping`
    @authorize({ permissions: ['*'] })
    @get('/ping', {
        responses: {
            '200': PING_RESPONSE,
        },
    })
    ping(): object {
        // Reply with a greeting, the current time, the url, and request headers
        return {
            greeting: 'Hello from LoopBack',
            date: new Date(),
            url: this.req.url,
            headers: Object.assign({}, this.req.headers),
        };
    }
}
