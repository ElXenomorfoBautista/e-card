import { BindingScope, injectable, service } from '@loopback/core';
import { UserRepository } from '../repositories';
import { repository } from '@loopback/repository';
import { EmailService } from './email.service';
import path from 'path';
import { HttpErrors } from '@loopback/rest';
import { UserWithRelations } from '../models';
import pdfMake from 'pdfmake/build/pdfmake';

import * as fs from 'fs';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@injectable({ scope: BindingScope.TRANSIENT })
export class UserService {
    constructor(
        @repository(UserRepository)
        public userRepository: UserRepository,
        @service(EmailService)
        private emailService: EmailService
    ) {}

    public async sendEmail(id: number): Promise<{ success: boolean; message: string; data: string }> {
        try {
            const user = await this.userRepository.findById(id);

            if (user.email) {
                const subject = `Te hacemos entrega de tu tarjeta de identificación, ${user.firstName}`;
                const body = `Hola, ${user.firstName} <br><br> Es un placer informarte que hemos actualizado tus datos en nuestro sistema.
                Te mandamos una tarjeta para tu identificación con la información más reciente.<br><br>Atentamente,<br>NAME.`;

                const destinationPath = path.join(__dirname, `../../public/${user.imagePath}`);

                const attachment = {
                    filename: `${user.firstName}.pdf`,
                    contentType: 'application/pdf',
                    path: destinationPath,
                };

                return await this.emailService.sendEmail(user.email, subject, body, [attachment]);
            } else {
                return { success: false, message: `The user doesn't have an email registered.`, data: '' };
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            throw new HttpErrors.UnprocessableEntity(error.message);
        }
    }

    public async generateCard(id: number) {
        try {
            const user = await this.userRepository.findById(id);
            return await this.generateCardPDF(user);
        } catch (error) {
            throw new HttpErrors.UnprocessableEntity(error.message);
        }
    }

    private generateCardPDF(user: UserWithRelations): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const documentDefinition = this.documentDefinitionPDF(user);
                const appDir = process.cwd();
                const outputPath = path.join(appDir, 'uploads', 'pdfs');
                const pathFile = path.join(outputPath, `${user.id}-${user.firstName}.pdf`);

                if (!fs.existsSync(outputPath)) {
                    fs.mkdirSync(outputPath, { recursive: true });
                }

                // Genera y guarda el PDF
                const pdfDoc = pdfMake.createPdf(documentDefinition);
                pdfDoc.getBuffer((buffer: any) => {
                    // Escribe el buffer en un archivo
                    fs.writeFile(pathFile, buffer, (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (error) {
                throw new HttpErrors.UnprocessableEntity(error.message);
            }
        });
    }

    private documentDefinitionPDF(user: UserWithRelations): TDocumentDefinitions {
        const qrPath = user.qrPath ? this.returnQRPath(user.qrPath) : '';
        const logo = '';

        const documentDefinition: TDocumentDefinitions = {
            pageOrientation: 'landscape',
            pageSize: 'A6',
            pageMargins: [50, 15, 20, 20],
            content: [
                {
                    table: {
                        widths: ['40%', '20%', '40%'],
                        body: [
                            [
                                {
                                    text: `${user.id} | ${user.firstName}`,
                                    style: 'userName',
                                    border: [false, false, false, true],
                                    colSpan: 3,
                                },
                                { text: '', border: [false, false, false, false] },
                                { text: '', border: [false, false, false, false] },
                            ],
                            [
                                {
                                    stack: [
                                        {
                                            image: 'qrLink',
                                            width: 150,
                                            alignment: 'center',
                                            margin: [0, 5],
                                        },
                                    ],
                                    border: [false, false, false, false],
                                },
                                {
                                    stack: [
                                        { text: ``, style: 'infoTitle' },
                                        { text: `Nombre:`, style: 'infoTitle' },
                                        { text: `Usuario:`, style: 'infoTitle' },
                                        { text: `Email:`, style: 'infoTitle' },
                                    ],
                                    border: [false, false, false, false],
                                },
                                {
                                    stack: [
                                        { text: ``, style: 'userInfo' },
                                        {
                                            text: `${user?.firstName} ${user?.middleName}${user?.lastName}`,
                                            style: 'userInfo',
                                        },
                                        { text: `${user?.username}`, style: 'userInfo' },
                                        { text: `${user?.email}`, style: 'userInfo' },
                                    ],
                                    border: [false, false, false, false],
                                },
                            ],
                        ],
                    },
                    layout: {
                        hLineColor: '#FF1420',
                        hLineWidth: function () {
                            return 2;
                        },
                    },
                },
                {
                    absolutePosition: { x: 0, y: 0 },
                    canvas: [
                        {
                            type: 'line',
                            x1: 10,
                            y1: 0,
                            x2: 10,
                            y2: 841.89, // Altura de una página A6
                            lineWidth: 60,
                            lineColor: '#FF1420',
                        },
                    ],
                },
            ],
            images: {
                qrLink: qrPath,
            },
            styles: {
                userName: {
                    fontSize: 25,
                    alignment: 'center',
                    bold: true,
                },
                infoTitle: {
                    fontSize: 15,
                    margin: [0, 10],
                    bold: true,
                },
                userInfo: {
                    fontSize: 15,
                    margin: [0, 10],
                },
            },
        };
        return documentDefinition;
    }

    returnQRPath(qrPath: string): string {
        const appDir = process.cwd();
        const qrDirectoryPath = path.join(appDir, 'uploads', qrPath);

        if (fs.existsSync(qrDirectoryPath)) {
            return `data:image/png;base64,${fs.readFileSync(qrDirectoryPath, 'base64')}`;
        } else {
            return '';
        }
    }
}
