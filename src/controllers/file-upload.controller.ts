/* eslint-disable @typescript-eslint/no-explicit-any */
import { post, Request, requestBody, Response, RestBindings } from '@loopback/rest';
import { inject } from '@loopback/core';
import { authorize } from 'loopback4-authorization';
import { FileUploadService } from '../services/file-upload.service';
import { generateResponse } from '../utils/custom-json-response';
import { authenticate, STRATEGY } from 'loopback4-authentication';
/* import { generateResponse } from '../utils/custom-json-response';
import { authenticate, STRATEGY } from 'loopback4-authentication'; */

export class FileUploadController {
    constructor(
        @inject('services.FileUploadService')
        public fileUploadService: FileUploadService,
        @inject(RestBindings.Http.RESPONSE)
        private httpResponse: Response
    ) {}

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: ['*'] })
    @post('/upload')
    async fileUpload(
        @requestBody({
            description: 'Subida de archivos',
            required: false,
            content: {
                'multipart/form-data': {
                    'x-parser': 'stream',
                    schema: {
                        type: 'object',
                        properties: {
                            files: {
                                description: 'Archivos',
                                type: 'array',
                                items: { type: 'string', format: 'binary' },
                            },
                            customPath: {
                                type: 'string',
                                description: 'Ruta personalizada',
                            },
                        },
                    },
                },
            },
        })
        request: Request,
        @inject(RestBindings.Http.RESPONSE) response: Response
    ): Promise<object | null> {
        try {
            const serviceResponse = await this.fileUploadService.fileUpload(request, response);
            return serviceResponse;
        } catch (error) {
            return this.httpResponse
                .status(error.statusCode || 500)
                .send(
                    generateResponse(error.statusCode || 500, false, error.message, null, error.detail || error.details)
                );
        }
    }
}
