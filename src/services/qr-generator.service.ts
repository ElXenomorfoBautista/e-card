import { injectable, service } from '@loopback/core';
import * as qrcode from 'qrcode';
import * as path from 'path';
import { fileDirectories } from '../utils/file-directories';
import { FileUploadService } from './file-upload.service';

export class QRCodeGenerator {
    constructor(
        @service(FileUploadService)
        private fileUploadService: FileUploadService,
    ) { }

    /**
     * Generates a QR code and saves it in a dynamic subdirectory under the "public" directory.
     * @param data The data to be encoded in the QR code.
     * @param subDirectory The dynamic subdirectory under the "public" directory.
     * @param fileName The name of the QR code file.
     * @returns The URL path to the generated QR code.
     */
    async generateQRCode(
        data: string,
        subDirectory: string,
        fileName: string
    ): Promise<{ success: boolean; message: string; data: string }> {
        try {
            const selectedDirectory = fileDirectories.find((directory) => directory.subDirectory === subDirectory);
            if (selectedDirectory) {
                // Get the current working directory of the application
                const appDir = process.cwd();

                // Build path
                const qrDirectoryPath = path.join(appDir, 'uploads', `${selectedDirectory?.path}`);
                this.fileUploadService.ensureDirectoryExists(qrDirectoryPath);

                // Build the full file path within the "public" directory
                const filePath = path.join(qrDirectoryPath, `${fileName}.png`); // Include 'qr' subdirectory and .png extension

                // Generate the QR code and save it to the file
                await qrcode.toFile(filePath, data, { type: 'png' });

                // Build the URL path to the generated QR code using the static route
                const urlPath = `${selectedDirectory?.path}/${fileName}.png`; // Include .png extension in URL

                return { success: true, message: `QR created successfully`, data: urlPath }

            } else {
                return { success: false, message: `Invalid`, data: '' }
            }

        } catch (error) {
            return { success: false, message: error.message, data: '' }
        }
    }

}
