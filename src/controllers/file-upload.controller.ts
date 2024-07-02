import { Request, Response, RestBindings, del, get, param, post, requestBody, response } from '@loopback/rest';
import { inject, service } from '@loopback/core';
import { STRATEGY, authenticate } from 'loopback4-authentication';
import { PermissionKey } from '../modules/auth/permission-key.enum';
import { authorize } from 'loopback4-authorization';
import { UserRepository } from '@loopback/authentication-jwt';
import { repository } from '@loopback/repository';
import path from 'path';
import fs from 'fs';
import { UserService, FileUploadService } from '../services';

export class FileUploadController {
    constructor(
        @repository(UserRepository)
        public userRepository: UserRepository,
        @service(UserService)
        private userService: UserService,
        @service(FileUploadService)
        private fileUploadService: FileUploadService
    ) { }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.CreateAnyUser, PermissionKey.CreateTenantUser],
    })
    @post('uploads/profilePhoto/{id}')
    @response(200, {
        description: 'Save image profile of user.',
        content: {
            'aplication/json': {
                schema: {
                    type: 'object',
                },
            },
        },
    })
    async fileUpload(
        @requestBody.file()
        request: Request,
        @inject(RestBindings.Http.RESPONSE)
        responseEndpoint: Response,
        @param.path.number('id')
        userId: number
    ): Promise<void> {
        return this.userService.saveImageUser(userId, request, responseEndpoint);
    }

    @authorize({ permissions: ['*'] })
    @get('uploads/getImage/{imagePath}')
    @response(200, {
        description: 'View images from uploads.',
        content: {
            'image/jpeg': {
                schema: {
                    type: 'object',
                },
            },
        },
    })
    async getImage(
        @inject(RestBindings.Http.RESPONSE)
        responseEndpoint: Response,
        @param.path.string('imagePath') imageName: string
    ): Promise<void> {
        try {
            const appDir = process.cwd();
            const PROFILE_PATH_ABSOLUTE = path.join(appDir, 'uploads');

            // Ruta a las imágenes en el servidor
            const imagePath = `${PROFILE_PATH_ABSOLUTE}${imageName}`;

            // Intentar leer los datos binarios de la imagen
            const image = await fs.promises.readFile(imagePath);

            // Establecer el encabezado de contenido como 'image/jpeg'
            responseEndpoint.setHeader('Content-Type', 'image/jpeg');

            // Enviar los datos binarios de la imagen como respuesta
            responseEndpoint.end(image);
        } catch (error) {
            // Si la imagen no existe, enviar un mensaje de error
            responseEndpoint.status(404);
            responseEndpoint.send('Imagen no encontrada.');
        }
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.DeleteAnyUser, PermissionKey.DeleteTenantUser],
    })
    @del('uploads/{imagePath}/{subdirectory}/{id}')
    @response(204, {
        description: 'ContactsTypes DELETE success',
    })
    async deleteById(
        @param.path.string('imagePath') imagePath: string,
        @param.path.string('subdirectory') subdirectory: string,
        @param.path.number('id') id?: number
    ): Promise<void> {
        await this.fileUploadService.deleteImagePath(imagePath, subdirectory, id!);
    }
}
