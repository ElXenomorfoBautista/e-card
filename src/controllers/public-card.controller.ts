/* eslint-disable @typescript-eslint/no-explicit-any */
// ===================================================
// src/controllers/public-card.controller.ts
// ===================================================

import { inject } from '@loopback/core';
import { get, param, response, Request, RestBindings, HttpErrors } from '@loopback/rest';
import { service } from '@loopback/core';
import { authorize } from 'loopback4-authorization';

import { CardService } from '../services';
import { CardCompleteResponse } from '../types/ecard.types';
interface PublicCardSummary {
    id: number;
    slug: string;
    title: string;
    profession?: string;
    logoUrl?: string;
    viewCount: number;
    ownerName: string;
    tenantName: string;
    styles: {
        primaryColor: string;
        backgroundColor: string;
    };
}
export class PublicCardController {
    constructor(
        @service(CardService)
        private cardService: CardService,
        @inject(RestBindings.Http.REQUEST)
        private request: Request
    ) {}

    // ===================================================
    // OBTENER TARJETA PÚBLICA POR SLUG (SIN AUTENTICACIÓN)
    // ===================================================
    @authorize({ permissions: ['*'] }) // Permitir acceso público
    @get('/public/cards/{slug}')
    @response(200, {
        description: 'Public card view by slug',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        // Datos principales
                        id: { type: 'number' },
                        slug: { type: 'string' },
                        title: { type: 'string' },
                        profession: { type: 'string' },
                        description: { type: 'string' },
                        logoUrl: { type: 'string' },
                        qrCodeUrl: { type: 'string' },
                        isActive: { type: 'boolean' },
                        viewCount: { type: 'number' },

                        // Información del dueño
                        ownerName: { type: 'string' },
                        tenantName: { type: 'string' },

                        // Estilos
                        styles: {
                            type: 'object',
                            properties: {
                                primaryColor: { type: 'string' },
                                secondaryColor: { type: 'string' },
                                backgroundColor: { type: 'string' },
                                textColor: { type: 'string' },
                                accentColor: { type: 'string' },
                                fontFamily: { type: 'string' },
                                fontSize: { type: 'string' },
                                layoutTemplate: { type: 'string' },
                                borderRadius: { type: 'string' },
                            },
                        },

                        // Información de contacto
                        contactInfo: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    contactType: { type: 'string' },
                                    label: { type: 'string' },
                                    value: { type: 'string' },
                                    isPrimary: { type: 'boolean' },
                                    displayOrder: { type: 'number' },
                                },
                            },
                        },

                        // Redes sociales
                        socialLinks: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    socialNetworkName: { type: 'string' },
                                    value: { type: 'string' },
                                    urlPattern: { type: 'string' },
                                    iconClass: { type: 'string' },
                                    displayOrder: { type: 'number' },
                                    generatedUrl: { type: 'string' },
                                },
                            },
                        },

                        // Horarios de atención
                        businessHours: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    dayOfWeek: { type: 'number' },
                                    dayName: { type: 'string' },
                                    openTime: { type: 'string' },
                                    closeTime: { type: 'string' },
                                    isClosed: { type: 'boolean' },
                                    notes: { type: 'string' },
                                    formattedSchedule: { type: 'string' },
                                },
                            },
                        },

                        // Metadatos
                        createdOn: { type: 'string' },
                        modifiedOn: { type: 'string' },
                    },
                },
            },
        },
    })
    async getPublicCard(@param.path.string('slug') slug: string): Promise<CardCompleteResponse> {
        const card = await this.cardService.getCompleteCard(slug);

        if (!card) {
            throw new HttpErrors.NotFound(`Card with slug '${slug}' not found`);
        }

        if (!card.isActive) {
            throw new HttpErrors.NotFound('Card is not available');
        }

        // Registrar la visualización
        await this.recordView(card.id);

        return card;
    }

    // ===================================================
    // ENDPOINT DIRECTO PARA FRONTEND (/{slug})
    // ===================================================
    @authorize({ permissions: ['*'] }) // Permitir acceso público
    @get('/{slug}')
    @response(200, {
        description: 'Direct public card access (frontend route)',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    // Mismo schema que arriba
                },
            },
        },
    })
    async getCardBySlug(@param.path.string('slug') slug: string): Promise<CardCompleteResponse> {
        // Reutilizar la misma lógica
        return this.getPublicCard(slug);
    }

    // ===================================================
    // OBTENER TARJETAS POPULARES (PÚBLICO)
    // ===================================================
    @authorize({ permissions: ['*'] })
    @get('/public/cards/popular')
    @response(200, {
        description: 'Get popular public cards',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            slug: { type: 'string' },
                            title: { type: 'string' },
                            profession: { type: 'string' },
                            logoUrl: { type: 'string' },
                            viewCount: { type: 'number' },
                            ownerName: { type: 'string' },
                            tenantName: { type: 'string' },
                            styles: {
                                type: 'object',
                                properties: {
                                    primaryColor: { type: 'string' },
                                    backgroundColor: { type: 'string' },
                                },
                                // QUITAR las propiedades que no estamos enviando
                            },
                        },
                    },
                },
            },
        },
    })
    async getPublicPopularCards(@param.query.number('limit') limit?: number): Promise<PublicCardSummary[]> {
        // CAMBIO: Incluir relaciones necesarias
        const cards = await this.cardService.getPopularCardsWithRelations(limit ?? 10);

        // Filtrar solo tarjetas activas y devolver datos básicos
        return cards
            .filter((card) => card.isActive)
            .map((card) => ({
                id: card.id!,
                slug: card.slug,
                title: card.title,
                profession: card.profession,
                logoUrl: card.logoUrl,
                viewCount: card.viewCount,
                // CORRECCIÓN: Ahora las relaciones están cargadas
                ownerName: `${card.user?.firstName || ''} ${card.user?.lastName || ''}`.trim(),
                tenantName: card.tenant?.name || '',
                styles: {
                    // CORRECCIÓN: Solo las propiedades necesarias para la vista pública
                    primaryColor: card.cardStyle?.primaryColor || '#007bff',
                    backgroundColor: card.cardStyle?.backgroundColor || '#ffffff',
                },
            }));
    }

    // ===================================================
    // BÚSQUEDA PÚBLICA DE TARJETAS
    // ===================================================
    @authorize({ permissions: ['*'] })
    @get('/public/cards/search/{query}')
    @response(200, {
        description: 'Public search cards by query',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            slug: { type: 'string' },
                            title: { type: 'string' },
                            profession: { type: 'string' },
                            description: { type: 'string' },
                            logoUrl: { type: 'string' },
                            ownerName: { type: 'string' },
                            tenantName: { type: 'string' },
                            // QUITAR la propiedad styles si no la estamos enviando
                        },
                    },
                },
            },
        },
    })
    async searchPublicCards(
        @param.path.string('query') query: string,
        @param.query.number('limit') limit?: number
    ): Promise<any[]> {
        // CAMBIO: Usar método que incluye relaciones
        const cards = await this.cardService.searchCardsWithRelations(query, limit ?? 10);

        // Filtrar solo tarjetas activas y devolver datos básicos
        return cards
            .filter((card) => card.isActive)
            .map((card) => ({
                id: card.id!,
                slug: card.slug,
                title: card.title,
                profession: card.profession,
                description: card.description,
                logoUrl: card.logoUrl,
                ownerName: `${card.user?.firstName || ''} ${card.user?.lastName || ''}`.trim(),
                tenantName: card.tenant?.name || '',
            }));
    }

    // ===================================================
    // VERIFICAR SI UNA TARJETA EXISTE (PÚBLICO)
    // ===================================================
    @authorize({ permissions: ['*'] })
    @get('/public/cards/exists/{slug}')
    @response(200, {
        description: 'Check if public card exists by slug',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        exists: { type: 'boolean' },
                        slug: { type: 'string' },
                        isActive: { type: 'boolean' },
                    },
                },
            },
        },
    })
    async checkCardExists(
        @param.path.string('slug') slug: string
    ): Promise<{ exists: boolean; slug: string; isActive?: boolean }> {
        const card = await this.cardService.getCompleteCard(slug);

        if (!card) {
            return { exists: false, slug };
        }

        return {
            exists: true,
            slug,
            isActive: card.isActive,
        };
    }

    // ===================================================
    // MÉTODO PRIVADO PARA REGISTRAR VISUALIZACIONES
    // ===================================================
    private async recordView(cardId: number): Promise<void> {
        try {
            // Extraer información del request
            const viewerData = {
                ip: this.getClientIp(),
                userAgent: this.request.headers['user-agent'],
                // CORRECCIÓN: Manejar referrer como string o array
                referrer: Array.isArray(this.request.headers.referer)
                    ? this.request.headers.referer[0]
                    : this.request.headers.referer ?? this.request.headers.referrer,
                deviceType: this.detectDeviceType(this.request.headers['user-agent'] ?? ''),
            };

            // Registrar la vista
            await this.cardService.recordCardView(cardId, viewerData);
        } catch (error) {
            // No fallar si no se puede registrar la vista
            console.error('Error recording card view:', error);
        }
    }
    // ===================================================
    // UTILIDADES PRIVADAS
    // ===================================================
    private getClientIp(): string {
        const forwarded = this.request.headers['x-forwarded-for'] as string;
        const ip = forwarded ? forwarded.split(',')[0] : this.request.connection.remoteAddress;
        return ip ?? 'unknown';
    }

    private detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
        const ua = userAgent.toLowerCase();

        if (ua.includes('tablet') || ua.includes('ipad')) {
            return 'tablet';
        }

        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'mobile';
        }

        return 'desktop';
    }
}
