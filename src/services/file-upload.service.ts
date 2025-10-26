/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable, BindingScope, inject } from '@loopback/core';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { HttpErrors } from '@loopback/rest';
import { AuthenticationBindings } from 'loopback4-authentication';
import { AuthUser } from '../modules/auth';
import { FileResponse, generateFileResponse } from '../utils/custom-json-file';
import { JsonResponse, generateResponse } from '../utils/custom-json-response';

// Define la carpeta base de uploads
const BASE_UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

@injectable({ scope: BindingScope.TRANSIENT })
export class FileUploadService {
    constructor(
        @inject(AuthenticationBindings.CURRENT_USER, { optional: true })
        private currentUser: AuthUser
    ) {
        // Asegurarse que existe el directorio base
        fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
    }

    async fileUpload(
        request: Request,
        response: Response,
        customPath?: string
    ): Promise<JsonResponse<FileResponse | null>> {
        try {
            let finalCustomPath = customPath;

            return await new Promise<JsonResponse<FileResponse | null>>((resolve, reject) => {
                // Usar memoria temporal para procesar todo en un solo paso
                const upload = multer({ storage: multer.memoryStorage() });

                upload.fields([
                    { name: 'files', maxCount: 10 },
                    { name: 'customPath', maxCount: 1 },
                ])(request, response, async (err: any) => {
                    if (err) {
                        reject(generateResponse(500, false, err.message, err));
                        return;
                    }

                    // Extraer customPath del body
                    if (!finalCustomPath && request.body?.customPath) {
                        finalCustomPath = request.body.customPath;
                    }

                    // Extraer archivos
                    const files = (request.files as any)?.files || [];

                    if (!files?.length) {
                        reject(
                            generateResponse(
                                404,
                                false,
                                'No se encontraron archivos para subir',
                                'Sin archivos para subir'
                            )
                        );
                        return;
                    }

                    // Determinar el directorio de destino
                    let destinationPath = BASE_UPLOAD_DIR;
                    if (finalCustomPath) {
                        const cleanPath = finalCustomPath
                            .trim()
                            .replace(/^[/\\]+/, '')
                            .replace(/[/\\]+$/, '');

                        // Validar permisos
                        try {
                            destinationPath = path.join(BASE_UPLOAD_DIR, cleanPath);
                        } catch (validationError) {
                            reject(
                                generateResponse(
                                    validationError.statusCode || 400,
                                    false,
                                    validationError.message,
                                    null,
                                    validationError.details
                                )
                            );
                            return;
                        }
                    }

                    // Crear directorio
                    try {
                        fs.mkdirSync(destinationPath, { recursive: true });
                    } catch (dirError) {
                        reject(generateResponse(500, false, 'Error al crear el directorio', dirError));
                        return;
                    }

                    try {
                        const filesMapped = await Promise.all(
                            files.map(async (file: Express.Multer.File) => {
                                // Generar nombre de archivo único
                                const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                                const fileName = `${Date.now()}-${cleanFileName}`;
                                const filePath = path.join(destinationPath, fileName);

                                try {
                                    fs.writeFileSync(filePath, file.buffer);
                                } catch (writeError) {
                                    throw new Error(`Error al guardar archivo: ${writeError.message}`);
                                }

                                const fileData = {
                                    originalName: file.originalname,
                                    fileName: fileName,
                                    url: `${process.env.BACKEND_URL}/uploads/${
                                        finalCustomPath ? `${finalCustomPath}/` : ''
                                    }${fileName}`,
                                    path: filePath,
                                };

                                return {
                                    ...fileData,
                                };
                            })
                        );

                        const fileObject = generateFileResponse(filesMapped);
                        resolve(generateResponse(202, true, 'Archivo(s) subido(s) correctamente', fileObject));
                    } catch (error) {
                        reject(generateResponse(500, false, 'Error al procesar los archivos', error));
                    }
                });
            });
        } catch (error) {
            if (error instanceof HttpErrors.HttpError) {
                return generateResponse(error.statusCode, false, error.message, null, error.details || error.message);
            }
            return generateResponse(
                500,
                false,
                error.message || 'Error interno del servidor',
                null,
                error.details || error.message
            );
        }
    }
}
