export interface FileResponse {
    files: {
        id?: string;
        originalName: string;
        fileName: string;
        url: string;
        path: string;
    }[];
}

export function generateFileResponse(
    files: { originalName: string; fileName: string; url: string; path: string }[]
): FileResponse {
    return { files };
}
