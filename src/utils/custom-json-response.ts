export interface JsonResponse<T> {
    statusCode: number;
    success?: boolean;
    message?: string;
    data?: T;
    errors?: string;
}

/**
 * Genere un JSON response custom con distintas propiedades
 * @param statusCode-  Código del status
 * @param success -
 * @param message - Mensaje de respuesta
 * @param data  - Información o data que se necesite
 * @param errors - Error, si llega a ocurrir
 * @returns Un JSON de repuesta
 */
export function generateResponse<T>(
    statusCode: number,
    success: boolean,
    message?: string,
    data?: T,
    errors?: string
): JsonResponse<T> {
    return {
        statusCode: statusCode,
        success: success,
        message: message,
        data: data,
        errors: errors ? errors : '',
    };
}
