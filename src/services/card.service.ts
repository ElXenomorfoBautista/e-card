/* eslint-disable @typescript-eslint/no-inferrable-types */
import { BindingScope, injectable, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';

import {
    CardRepository,
    CardStyleRepository,
    CardContactInfoRepository,
    CardSocialLinkRepository,
    CardBusinessHourRepository,
    CardViewRepository,
    SocialNetworkTypeRepository,
} from '../repositories';
import { Card, CardBusinessHour } from '../models';
import { CreateCardRequest, DuplicateCardRequest, CardCompleteResponse, CardStatsResponse } from '../types/ecard.types';
import { QRCodeGenerator } from './qr-generator.service';

@injectable({ scope: BindingScope.TRANSIENT })
export class CardService {
    constructor(
        @repository(CardRepository)
        public cardRepository: CardRepository,
        @repository(CardStyleRepository)
        public cardStyleRepository: CardStyleRepository,
        @repository(CardContactInfoRepository)
        public cardContactInfoRepository: CardContactInfoRepository,
        @repository(CardSocialLinkRepository)
        public cardSocialLinkRepository: CardSocialLinkRepository,
        @repository(CardBusinessHourRepository)
        public cardBusinessHourRepository: CardBusinessHourRepository,
        @repository(CardViewRepository)
        public cardViewRepository: CardViewRepository,
        @repository(SocialNetworkTypeRepository)
        public socialNetworkTypeRepository: SocialNetworkTypeRepository,
        @service(QRCodeGenerator)
        private qrCodeGenerator: QRCodeGenerator
    ) {}

    // ===================================================
    // CREAR TARJETA COMPLETA
    // ===================================================
    async createCompleteCard(cardData: CreateCardRequest): Promise<Card> {
        // 1. Crear tarjeta principal
        const card = await this.cardRepository.create({
            title: cardData.title,
            profession: cardData.profession,
            description: cardData.description,
            logoUrl: cardData.logoUrl,
            isActive: true,
        });

        if (!card.id) {
            throw new HttpErrors.InternalServerError('Failed to create card');
        }

        // 2. Crear estilos (si se proporcionan)
        if (cardData.styles) {
            await this.cardStyleRepository.createWithDefaults(card.id, cardData.styles);
        } else {
            await this.cardStyleRepository.createWithDefaults(card.id);
        }

        // 3. Crear información de contacto
        if (cardData.contactInfo && cardData.contactInfo.length > 0) {
            for (const contact of cardData.contactInfo) {
                await this.cardContactInfoRepository.create({
                    cardId: card.id,
                    contactType: contact.contactType,
                    label: contact.label,
                    value: contact.value,
                    isPrimary: contact.isPrimary ?? false,
                    displayOrder: contact.displayOrder ?? 0,
                });
            }
        }

        // 4. Crear enlaces de redes sociales
        if (cardData.socialLinks && cardData.socialLinks.length > 0) {
            for (const socialLink of cardData.socialLinks) {
                await this.cardSocialLinkRepository.create({
                    cardId: card.id,
                    socialNetworkTypeId: socialLink.socialNetworkTypeId,
                    value: socialLink.value,
                    displayOrder: socialLink.displayOrder ?? 0,
                });
            }
        }

        // 5. Crear horarios de atención
        if (cardData.businessHours && cardData.businessHours.length > 0) {
            for (const hour of cardData.businessHours) {
                await this.cardBusinessHourRepository.create({
                    cardId: card.id,
                    dayOfWeek: hour.dayOfWeek,
                    openTime: hour.openTime,
                    closeTime: hour.closeTime,
                    isClosed: hour.isClosed ?? false,
                    notes: hour.notes,
                });
            }
        } else {
            // Crear horarios por defecto si no se proporcionan
            await this.cardBusinessHourRepository.createDefaultSchedule(card.id);
        }

        // 6. Generar código QR
        await this.generateCardQR(card.id);

        return card;
    }

    // ===================================================
    // OBTENER TARJETA COMPLETA
    // ===================================================
    async getCompleteCard(slug: string): Promise<CardCompleteResponse | null> {
        const card = await this.cardRepository.findBySlug(slug);

        if (!card) {
            return null;
        }

        // Obtener datos relacionados
        const [contactInfo, socialLinks, businessHours, cardStyle] = await Promise.all([
            this.cardContactInfoRepository.findByCardId(card.id!),
            this.cardSocialLinkRepository.findByCardId(card.id!),
            this.cardBusinessHourRepository.findByCardId(card.id!),
            this.cardStyleRepository.findByCardId(card.id!),
        ]);

        // Formatear respuesta completa
        return {
            // Datos principales
            id: card.id!,
            slug: card.slug,
            title: card.title,
            profession: card.profession,
            description: card.description,
            logoUrl: card.logoUrl,
            qrCodeUrl: card.qrCodeUrl,
            isActive: card.isActive,
            viewCount: card.viewCount,

            // Información del dueño
            ownerName: `${card.user?.firstName || ''} ${card.user?.lastName || ''}`.trim(),
            tenantName: card.tenant?.name || '',

            // Estilos
            styles: {
                primaryColor: cardStyle?.primaryColor || '#007bff',
                secondaryColor: cardStyle?.secondaryColor || '#6c757d',
                backgroundColor: cardStyle?.backgroundColor || '#ffffff',
                textColor: cardStyle?.textColor || '#212529',
                accentColor: cardStyle?.accentColor || '#28a745',
                fontFamily: cardStyle?.fontFamily || 'Inter',
                fontSize: cardStyle?.fontSize || 'medium',
                layoutTemplate: cardStyle?.layoutTemplate || 'modern',
                borderRadius: cardStyle?.borderRadius || 'medium',
            },

            // Información de contacto
            contactInfo: contactInfo.map((contact) => ({
                contactType: contact.contactType,
                label: contact.label,
                value: contact.value,
                isPrimary: contact.isPrimary,
                displayOrder: contact.displayOrder,
            })),

            // Redes sociales con URLs generadas
            socialLinks: socialLinks.map((link) => ({
                socialNetworkName: link.socialNetworkType?.name || '',
                value: link.value,
                urlPattern: link.socialNetworkType?.urlPattern || '',
                iconClass: link.socialNetworkType?.iconClass,
                displayOrder: link.displayOrder,
                generatedUrl: this.generateSocialUrl(link.socialNetworkType?.urlPattern || '', link.value),
            })),

            // Horarios formateados
            businessHours: businessHours.map((hour) => ({
                dayOfWeek: hour.dayOfWeek,
                dayName: this.getDayName(hour.dayOfWeek),
                openTime: hour.openTime,
                closeTime: hour.closeTime,
                isClosed: hour.isClosed,
                notes: hour.notes,
                formattedSchedule: this.formatSchedule(hour),
            })),

            // Metadatos
            createdOn: card.createdOn?.toISOString() || '',
            modifiedOn: card.modifiedOn?.toISOString() || '',
        };
    }

    // ===================================================
    // DUPLICAR TARJETA
    // ===================================================
    async duplicateCard(duplicateData: DuplicateCardRequest): Promise<Card> {
        const sourceCard = await this.cardRepository.findById(duplicateData.fromCardId, {
            include: ['cardStyle', 'contactInfo', 'socialLinks', 'businessHours'],
        });

        if (!sourceCard) {
            throw new HttpErrors.NotFound('Source card not found');
        }

        // 1. Crear nueva tarjeta
        const newCard = await this.cardRepository.create({
            title: duplicateData.newTitle,
            profession: duplicateData.newProfession || sourceCard.profession,
            description: duplicateData.newDescription || sourceCard.description,
            logoUrl: sourceCard.logoUrl,
            duplicatedFromId: sourceCard.id,
            isActive: true,
        });

        if (!newCard.id) {
            throw new HttpErrors.InternalServerError('Failed to duplicate card');
        }

        // 2. Duplicar estilos
        if (sourceCard.cardStyle) {
            const styleData =
                duplicateData.modifyStyles && duplicateData.newStyles
                    ? { ...sourceCard.cardStyle, ...duplicateData.newStyles }
                    : sourceCard.cardStyle;

            await this.cardStyleRepository.create({
                cardId: newCard.id,
                primaryColor: styleData.primaryColor,
                secondaryColor: styleData.secondaryColor,
                backgroundColor: styleData.backgroundColor,
                textColor: styleData.textColor,
                accentColor: styleData.accentColor,
                fontFamily: styleData.fontFamily,
                fontSize: styleData.fontSize,
                layoutTemplate: styleData.layoutTemplate,
                borderRadius: styleData.borderRadius,
            });
        }

        // 3. Duplicar información de contacto
        if (sourceCard.contactInfo) {
            for (const contact of sourceCard.contactInfo) {
                await this.cardContactInfoRepository.create({
                    cardId: newCard.id,
                    contactType: contact.contactType,
                    label: contact.label,
                    value: contact.value,
                    isPrimary: contact.isPrimary,
                    displayOrder: contact.displayOrder,
                });
            }
        }

        // 4. Duplicar redes sociales
        if (sourceCard.socialLinks) {
            for (const socialLink of sourceCard.socialLinks) {
                await this.cardSocialLinkRepository.create({
                    cardId: newCard.id,
                    socialNetworkTypeId: socialLink.socialNetworkTypeId,
                    value: socialLink.value,
                    displayOrder: socialLink.displayOrder,
                });
            }
        }

        // 5. Duplicar horarios
        if (sourceCard.businessHours) {
            for (const hour of sourceCard.businessHours) {
                await this.cardBusinessHourRepository.create({
                    cardId: newCard.id,
                    dayOfWeek: hour.dayOfWeek,
                    openTime: hour.openTime,
                    closeTime: hour.closeTime,
                    isClosed: hour.isClosed,
                    notes: hour.notes,
                });
            }
        }

        // 6. Generar nuevo código QR
        await this.generateCardQR(newCard.id);

        return newCard;
    }

    // ===================================================
    // REGISTRAR VISUALIZACIÓN
    // ===================================================
    async recordCardView(
        cardId: number,
        viewerData: {
            ip?: string;
            userAgent?: string;
            referrer?: string;
            deviceType?: 'mobile' | 'desktop' | 'tablet';
        }
    ): Promise<void> {
        // Registrar view detallada
        await this.cardViewRepository.recordView(
            cardId,
            viewerData.ip,
            viewerData.userAgent,
            viewerData.referrer,
            viewerData.deviceType
        );

        // Incrementar contador simple
        await this.cardRepository.incrementViewCount(cardId);
    }

    // ===================================================
    // OBTENER ESTADÍSTICAS
    // ===================================================
    async getCardStats(cardId: number): Promise<CardStatsResponse> {
        const stats = await this.cardRepository.getCardStats(cardId);
        return stats;
    }

    // ===================================================
    // GENERAR CÓDIGO QR
    // ===================================================
    async generateCardQR(cardId: number): Promise<string> {
        const card = await this.cardRepository.findById(cardId);

        if (!card) {
            throw new HttpErrors.NotFound('Card not found');
        }

        // URL pública de la tarjeta
        const publicUrl = `${process.env.FRONTEND_URL ?? 'https://ecard.com'}/${card.slug}`;

        // Generar QR usando el servicio
        const qrPath = await this.qrCodeGenerator.generateQRCodeForCard(card.id!, publicUrl);

        // Actualizar la tarjeta con la URL del QR
        await this.cardRepository.updateById(cardId, {
            qrCodeUrl: qrPath,
        });

        return qrPath;
    }

    // ===================================================
    // ACTUALIZAR SLUG
    // ===================================================
    async updateCardSlug(cardId: number, newTitle: string): Promise<string> {
        const newSlug = await this.cardRepository.generateUniqueSlug(newTitle);

        await this.cardRepository.updateById(cardId, {
            slug: newSlug,
        });

        // Regenerar QR con nueva URL
        await this.generateCardQR(cardId);

        return newSlug;
    }

    // ===================================================
    // VALIDAR SLUG DISPONIBLE
    // ===================================================
    async isSlugAvailable(slug: string): Promise<boolean> {
        return !(await this.cardRepository.existsSlug(slug));
    }

    // ===================================================
    // MÉTODOS UTILITARIOS PRIVADOS
    // ===================================================
    private generateSocialUrl(urlPattern: string, value: string): string {
        if (!urlPattern) return value;
        return urlPattern.replace('{value}', value);
    }

    private getDayName(dayOfWeek: number): string {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[dayOfWeek] || 'Día inválido';
    }

    private formatSchedule(hour: CardBusinessHour): string {
        if (hour.isClosed) {
            return 'Cerrado';
        }

        if (!hour.openTime || !hour.closeTime) {
            return 'Horario no definido';
        }

        return `${hour.openTime} - ${hour.closeTime}`;
    }

    // ===================================================
    // BÚSQUEDAS Y FILTROS
    // ===================================================
    async searchCards(query: string, limit: number = 10): Promise<Card[]> {
        return this.cardRepository.find({
            where: {
                or: [
                    { title: { ilike: `%${query}%` } },
                    { profession: { ilike: `%${query}%` } },
                    { description: { ilike: `%${query}%` } },
                ],
                isActive: true,
            },
            limit,
            include: ['user', 'tenant'],
        });
    }

    // Obtener tarjetas populares (más vistas)
    async getPopularCards(limit: number = 10): Promise<Card[]> {
        return this.cardRepository.find({
            where: { isActive: true },
            order: ['viewCount DESC'],
            limit,
            include: ['user', 'tenant', 'cardStyle'],
        });
    }

    // Obtener tarjetas recientes
    async getRecentCards(limit: number = 10): Promise<Card[]> {
        return this.cardRepository.find({
            where: { isActive: true },
            order: ['createdOn DESC'],
            limit,
            include: ['user', 'tenant', 'cardStyle'],
        });
    }
}
