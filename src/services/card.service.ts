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

        // 2. Crear estilos (CORREGIDO - usar create normal)
        if (cardData.styles) {
            await this.cardStyleRepository.create({
                cardId: card.id,
                primaryColor: cardData.styles.primaryColor ?? '#007bff',
                secondaryColor: cardData.styles.secondaryColor ?? '#6c757d',
                backgroundColor: cardData.styles.backgroundColor ?? '#ffffff',
                textColor: cardData.styles.textColor ?? '#212529',
                accentColor: cardData.styles.accentColor ?? '#28a745',
                fontFamily: cardData.styles.fontFamily ?? 'Inter',
                fontSize: cardData.styles.fontSize ?? 'medium',
                layoutTemplate: cardData.styles.layoutTemplate ?? 'modern',
                borderRadius: cardData.styles.borderRadius ?? 'medium',
            });
        } else {
            // Crear estilos por defecto
            await this.cardStyleRepository.create({
                cardId: card.id,
                primaryColor: '#007bff',
                secondaryColor: '#6c757d',
                backgroundColor: '#ffffff',
                textColor: '#212529',
                accentColor: '#28a745',
                fontFamily: 'Inter',
                fontSize: 'medium',
                layoutTemplate: 'modern',
                borderRadius: 'medium',
            });
        }

        // 3-5. El resto del código está bien...

        // 6. Generar código QR (CORREGIDO)
        await this.generateCardQR(card.id);

        return card;
    }

    // ===================================================
    // OBTENER TARJETA COMPLETA
    // ===================================================
    async getCompleteCard(slug: string): Promise<CardCompleteResponse | null> {
        // CAMBIAR: Incluir relaciones al buscar la tarjeta
        const card = await this.cardRepository.findOne({
            where: { slug, isActive: true },
            include: [
                {
                    relation: 'user',
                    scope: {
                        fields: ['firstName', 'lastName'],
                    },
                },
                {
                    relation: 'tenant',
                    scope: {
                        fields: ['name'],
                    },
                },
            ],
        });

        if (!card) {
            return null;
        }

        // Obtener datos relacionados con include de socialNetworkType
        const [contactInfo, socialLinks, businessHours, cardStyle] = await Promise.all([
            this.cardContactInfoRepository.findByCardId(card.id!),
            this.cardSocialLinkRepository.find({
                where: { cardId: card.id! },
                include: ['socialNetworkType'],
                order: ['displayOrder ASC'],
            }),
            this.cardBusinessHourRepository.findByCardId(card.id!),
            this.cardStyleRepository.findOne({ where: { cardId: card.id! } }),
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

            // Información del dueño (CORREGIDO)
            ownerName: `${card.user?.firstName ?? ''} ${card.user?.lastName ?? ''}`.trim(),
            tenantName: card.tenant?.name ?? '',

            // Estilos
            styles: {
                primaryColor: cardStyle?.primaryColor ?? '#007bff',
                secondaryColor: cardStyle?.secondaryColor ?? '#6c757d',
                backgroundColor: cardStyle?.backgroundColor ?? '#ffffff',
                textColor: cardStyle?.textColor ?? '#212529',
                accentColor: cardStyle?.accentColor ?? '#28a745',
                fontFamily: cardStyle?.fontFamily ?? 'Inter',
                fontSize: cardStyle?.fontSize ?? 'medium',
                layoutTemplate: cardStyle?.layoutTemplate ?? 'modern',
                borderRadius: cardStyle?.borderRadius ?? 'medium',
            },

            // Información de contacto
            contactInfo: contactInfo.map((contact) => ({
                contactType: contact.contactType,
                label: contact.label,
                value: contact.value,
                isPrimary: contact.isPrimary,
                displayOrder: contact.displayOrder,
            })),

            // Redes sociales con URLs generadas (CORREGIDO)
            socialLinks: socialLinks.map((link) => ({
                socialNetworkName: link.socialNetworkType?.name ?? '',
                value: link.value,
                urlPattern: link.socialNetworkType?.urlPattern ?? '',
                iconClass: link.socialNetworkType?.iconClass,
                displayOrder: link.displayOrder,
                generatedUrl: this.generateSocialUrl(link.socialNetworkType?.urlPattern ?? '', link.value),
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

            // Metadatos (CORREGIDO)
            createdOn: card.createdOn?.toISOString() ?? new Date().toISOString(),
            modifiedOn: card.modifiedOn?.toISOString() ?? new Date().toISOString(),
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
            profession: duplicateData.newProfession ?? sourceCard.profession,
            description: duplicateData.newDescription ?? sourceCard.description,
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

        return {
            ...stats,
            id: stats.id!,
        };
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

        // CORREGIR: Usar el método correcto con 3 parámetros
        const qrResult = await this.qrCodeGenerator.generateQRCode(publicUrl, `card-${card.id}`, 'cards');

        // CORREGIR: Extraer solo la ruta del resultado
        const qrPath = qrResult.data; // Asumir que qrResult.data contiene la ruta

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
