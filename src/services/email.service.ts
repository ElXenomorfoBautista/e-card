/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable } from '@loopback/context';
const nodemailer = require('nodemailer');

interface Attachment {
    filename: string; // Name of the attached file
    contentType: string; // Content type for the attachment
    path?: string; // Path to the file.
    content?: any; // String, Buffer or a Stream contents for the attachment.
}

interface Message {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments?: Attachment[];
}
@injectable()
export class EmailService {
    constructor() { }

    private transporter() {
        return {
            // host: process.env.NODEMAILER_HOST,
            // port: process.env.NODEMAILER_PORT,
            // secure: true,
            service: process.env.NODEMAILER_SERVICE,
            auth: {
                user: process.env.NODEMAILER_USER,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        };
    }

    async sendEmail(
        to: any = `${process.env.NODEMAILER_DEFAULT_TO}`,
        subject: string,
        body: string,
        attachments?: Attachment[]
    ): Promise<{ success: boolean; message: string; data: any }> {
        try {
            const messageConfig: Message = {
                from: `NAME ${process.env.NODEMAILER_USER}`,
                to,
                subject: subject,
                html: body,
            };

            if (attachments) messageConfig.attachments = attachments;

            const transporter = nodemailer.createTransport(this.transporter());

            return await new Promise<{ success: boolean; message: string; data: any }>((resolve, reject) => {
                transporter.sendMail(messageConfig, function (error: any, info: any) {
                    if (error) {
                        console.log(error);
                        resolve({
                            success: false,
                            message: `Ha ocurrido un error al mandar el correo: ${error.message}`,
                            data: process.env.NODEMAILER_USER + ' ' + process.env.NODEMAILER_PASSWORD
                        });
                    } else {
                        resolve({ success: true, message: 'El correo ha sido enviado.', data: '' });
                    }
                });
            });
        } catch (error) {
            console.error(`Error: ${error.message}`);
            return { success: false, message: error.message, data: '' };
        }
    }
}
