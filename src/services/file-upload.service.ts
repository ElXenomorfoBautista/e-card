import { injectable, BindingScope } from '@loopback/core';
import { HttpErrors, Request, Response } from '@loopback/rest';
import multer from 'multer';
import path from 'path';
import { fileDirectories } from '../utils/file-directories';
import * as fs from 'fs';
import { repository } from '@loopback/repository';
import { UserRepository } from '../repositories';

export interface FileUploadOptions {
    storePath: string;
    fieldname: string;
    request: Request;
    responseEndpoint: Response;
    acceptedExt: string[];
}

@injectable({ scope: BindingScope.TRANSIENT })
export class FileUploadService {
    constructor(
        @repository(UserRepository) private userRepository: UserRepository
    ) { }

    /**
     * Return a config for multer storage
     * @param path
     */
    public getMulterStorageConfig(pathDestination: string) {
        let filename = '';
        this.ensureDirectoryExists(pathDestination);
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, pathDestination);
            },
            filename: function (req, file, cb) {
                const randomNumber = Math.floor(Math.random() * 99);
                const fileExtension = path.extname(file.originalname);

                // Utiliza un operador ternario para determinar el prefijo
                const prefix = ['.jpg', '.jpeg', '.png'].includes(fileExtension.toLowerCase()) ? 'img' : 'file';

                // Formato: img_numero-random_Date.Now()
                filename = `${prefix}-${randomNumber}-${Date.now()}${fileExtension}`;

                cb(null, filename);
            },
        });
        return storage;
    }

    /**
     * store the file in a specific path
     * @param storePath
     * @param request
     * @param response
     */
    private performFileUpload(
        options: FileUploadOptions,
        single: boolean,
        enableFormatFilter: boolean
    ): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            const storage = this.getMulterStorageConfig(options.storePath);

            const upload = multer({
                storage: storage,
                fileFilter: enableFormatFilter
                    ? function (req, file, callback) {
                        const ext = path.extname(file.originalname).toUpperCase();
                        if (options.acceptedExt.includes(ext)) {
                            return callback(null, true);
                        }
                        return callback(new HttpErrors[400]('This format file is not supported.'));
                    }
                    : undefined,
            });

            const middleware = single
                ? upload.single(options.fieldname)
                : upload.fields([{ name: options.fieldname, maxCount: 15 }]);

            middleware(options.request, options.responseEndpoint, (err: string) => {
                if (err) {
                    reject(err);
                }
                resolve(options.responseEndpoint);
            });
        });
    }

    public storeFileToPath(options: FileUploadOptions, single = true, enableFormatFilter = true): Promise<object> {
        return this.performFileUpload(options, single, enableFormatFilter);
    }

    public storeMultipleFilesToPath(
        options: FileUploadOptions,
        single = false,
        enableFormatFilter = true
    ): Promise<object> {
        return this.performFileUpload(options, single, enableFormatFilter);
    }

    public async existsFileDirectoryInConfig(
        subDirectory: string
    ): Promise<{ success: boolean; message: string; path: string; directory: string }> {
        const selectedDirectory = fileDirectories.find((directory) => directory.subDirectory === subDirectory);

        if (selectedDirectory) {
            return {
                success: true,
                message: 'Directory found!',
                path: selectedDirectory.path,
                directory: selectedDirectory.subDirectory,
            };
        }
        {
            return {
                success: false,
                message: `The directory '${subDirectory}' is not declared`,
                path: '',
                directory: '',
            };
        }
    }

    public ensureDirectoryExists(directoryPath: string): { success: boolean; message: string } {
        if (!fs.existsSync(directoryPath)) {
            // Create the directory if it doesn't exist
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        // Return a success response with the directory path
        return { success: true, message: 'Directory found' };
    }

    public async deleteImagePath(imagePath: string, subDirectory: string, id: number): Promise<void> {
        try {
            const appDir = process.cwd();

            const selectSubdirectory = await this.existsFileDirectoryInConfig(subDirectory);

            if (!selectSubdirectory.success) {
                throw new HttpErrors.UnprocessableEntity(selectSubdirectory.message);
            }

            const destinationPath = path.join(appDir, 'uploads', imagePath);

            await fs.promises.unlink(destinationPath);

            if (!id || id !== 0) {
                const getRepo = await this.getRepositoryByDirectory(subDirectory);
                await getRepo?.updateById(id, { imagePath: undefined });
            }
        } catch (error) {
            throw new HttpErrors.UnprocessableEntity(error.message);
        }
    }

    private async getRepositoryByDirectory(
        subDirectory: string
    ): Promise<UserRepository | undefined> {
        switch (subDirectory) {
            case 'user':
                return this.userRepository;
            default:
        }
    }
}
