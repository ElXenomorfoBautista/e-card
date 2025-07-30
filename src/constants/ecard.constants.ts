import { ContactType, DeviceType, LayoutTemplate, FontSize, BorderRadius } from '../types/ecard.types';

export const CONTACT_TYPES: ContactType[] = ['phone', 'email', 'address', 'website'];

export const DEVICE_TYPES: DeviceType[] = ['mobile', 'desktop', 'tablet'];

export const FONT_FAMILIES = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Playfair Display',
    'Dancing Script',
    'Oswald',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Verdana',
];

export const LAYOUT_TEMPLATES: LayoutTemplate[] = ['modern', 'classic', 'minimal'];

export const FONT_SIZES: FontSize[] = ['small', 'medium', 'large'];

export const BORDER_RADIUS_OPTIONS: BorderRadius[] = ['none', 'small', 'medium', 'large'];

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Colores predefinidos por categoría de negocio
export const BUSINESS_COLOR_PALETTES = {
    restaurant: {
        primary: '#ff5722',
        secondary: '#d84315',
        background: '#fff3e0',
        text: '#bf360c',
        accent: '#ff9800',
    },
    beauty: {
        primary: '#e91e63',
        secondary: '#9c27b0',
        background: '#ffffff',
        text: '#212529',
        accent: '#ff4081',
    },
    sports: {
        primary: '#4caf50',
        secondary: '#2e7d32',
        background: '#f1f8e9',
        text: '#1b5e20',
        accent: '#76ff03',
    },
    professional: {
        primary: '#2196f3',
        secondary: '#1976d2',
        background: '#e3f2fd',
        text: '#0d47a1',
        accent: '#03a9f4',
    },
    technology: {
        primary: '#607d8b',
        secondary: '#455a64',
        background: '#eceff1',
        text: '#263238',
        accent: '#78909c',
    },
};

// Regex para validaciones
export const VALIDATION_PATTERNS = {
    slug: /^[a-z0-9\-]+$/,
    hexColor: /^#[0-9A-Fa-f]{6}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]+$/,
    time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
};
