export type ContactType = 'phone' | 'email' | 'address' | 'website';
export type DeviceType = 'mobile' | 'desktop' | 'tablet';
export type FontSize = 'small' | 'medium' | 'large';
export type LayoutTemplate = 'modern' | 'classic' | 'minimal';
export type BorderRadius = 'none' | 'small' | 'medium' | 'large';

export interface CardStatsResponse {
    id: number;
    title: string;
    slug: string;
    viewCount: number;
    totalDetailedViews: number;
    uniqueVisitors: number;
    lastViewedAt?: string;
}

export interface CardCompleteResponse {
    // Datos principales
    id: number;
    slug: string;
    title: string;
    profession?: string;
    description?: string;
    logoUrl?: string;
    qrCodeUrl?: string;
    isActive: boolean;
    viewCount: number;
    publicUrl?: string;
    // Información del dueño
    ownerName: string;
    tenantName: string;

    // Estilos
    styles: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        textColor: string;
        accentColor: string;
        fontFamily: string;
        fontSize: string;
        layoutTemplate: string;
        borderRadius: string;
    };

    // Información de contacto
    contactInfo: Array<{
        contactType: ContactType;
        label?: string;
        value: string;
        isPrimary: boolean;
        displayOrder: number;
    }>;

    // Redes sociales
    socialLinks: Array<{
        socialNetworkName: string;
        value: string;
        urlPattern: string;
        iconClass?: string;
        displayOrder: number;
        generatedUrl: string;
    }>;

    // Horarios de atención
    businessHours: Array<{
        dayOfWeek: number;
        dayName: string;
        openTime?: string;
        closeTime?: string;
        isClosed: boolean;
        notes?: string;
        formattedSchedule: string;
    }>;

    // Metadatos
    createdOn: string;
    modifiedOn: string;
}

export interface CreateCardRequest {
    title: string;
    profession?: string;
    description?: string;
    logoUrl?: string;

    // Estilos opcionales
    styles?: {
        primaryColor?: string;
        secondaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
        accentColor?: string;
        fontFamily?: string;
        fontSize?: FontSize;
        layoutTemplate?: LayoutTemplate;
        borderRadius?: BorderRadius;
    };

    // Información de contacto
    contactInfo?: Array<{
        contactType: ContactType;
        label?: string;
        value: string;
        isPrimary?: boolean;
        displayOrder?: number;
    }>;

    // Redes sociales
    socialLinks?: Array<{
        socialNetworkTypeId: number;
        value: string;
        displayOrder?: number;
    }>;

    // Horarios
    businessHours?: Array<{
        dayOfWeek: number;
        openTime?: string;
        closeTime?: string;
        isClosed?: boolean;
        notes?: string;
    }>;
}

export interface DuplicateCardRequest {
    fromCardId: number;
    newTitle: string;
    newProfession?: string;
    newDescription?: string;
    modifyStyles?: boolean;
    newStyles?: {
        primaryColor?: string;
        secondaryColor?: string;
        fontFamily?: string;
        layoutTemplate?: LayoutTemplate;
    };
}
