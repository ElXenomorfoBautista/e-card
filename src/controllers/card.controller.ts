/* eslint-disable @typescript-eslint/no-shadow */
import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where } from '@loopback/repository';
import {
    post,
    param,
    get,
    getModelSchemaRef,
    patch,
    put,
    del,
    requestBody,
    response,
    HttpErrors,
} from '@loopback/rest';
import { inject, service } from '@loopback/core';
import { authenticate, STRATEGY } from 'loopback4-authentication';
import { authorize } from 'loopback4-authorization';
import { RestBindings, Response } from '@loopback/rest';

import { Card } from '../models';
import { CardRepository } from '../repositories';
import { CardService } from '../services';
import { PermissionKey } from '../modules/auth/permission-key.enum';
import { CreateCardRequest, DuplicateCardRequest, CardStatsResponse, CardCompleteResponse } from '../types/ecard.types';
import { STATUS_CODE } from './status-codes.enum';

export class CardController {
    constructor(
        @repository(CardRepository)
        public cardRepository: CardRepository,
        @service(CardService)
        private cardService: CardService,
        @inject(RestBindings.Http.RESPONSE)
        private readonly httpResponse: Response
    ) {}

    // ===================================================
    // CREAR TARJETA COMPLETA
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.CreateCard],
    })
    @post('/cards')
    @response(200, {
        description: 'Card model instance',
        content: { 'application/json': { schema: getModelSchemaRef(Card) } },
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        title: 'CreateCardRequest',
                        properties: {
                            title: { type: 'string' },
                            profession: { type: 'string' },
                            description: { type: 'string' },
                            logoUrl: { type: 'string' },
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
                            contactInfo: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        contactType: { type: 'string', enum: ['phone', 'email', 'address', 'website'] },
                                        label: { type: 'string' },
                                        value: { type: 'string' },
                                        isPrimary: { type: 'boolean' },
                                        displayOrder: { type: 'number' },
                                    },
                                },
                            },
                            socialLinks: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        socialNetworkTypeId: { type: 'number' },
                                        value: { type: 'string' },
                                        displayOrder: { type: 'number' },
                                    },
                                },
                            },
                            businessHours: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        dayOfWeek: { type: 'number', minimum: 0, maximum: 6 },
                                        openTime: { type: 'string' },
                                        closeTime: { type: 'string' },
                                        isClosed: { type: 'boolean' },
                                        notes: { type: 'string' },
                                    },
                                },
                            },
                        },
                        required: ['title'],
                    },
                },
            },
        })
        cardData: CreateCardRequest
    ): Promise<Card> {
        return this.cardService.createCompleteCard(cardData);
    }

    // ===================================================
    // CONTAR TARJETAS
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/count')
    @response(200, {
        description: 'Card model count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async count(@param.where(Card) where?: Where<Card>): Promise<Count> {
        return this.cardRepository.count(where);
    }

    // ===================================================
    // LISTAR TARJETAS
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards')
    @response(200, {
        description: 'Array of Card model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Card, { includeRelations: true }),
                },
            },
        },
    })
    async find(@param.filter(Card) filter?: Filter<Card>): Promise<Card[]> {
        return this.cardRepository.find(filter);
    }

    // ===================================================
    // OBTENER TARJETAS DEL USUARIO ACTUAL
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard],
    })
    @get('/cards/my-cards')
    @response(200, {
        description: 'Array of current user Card model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Card, { includeRelations: true }),
                },
            },
        },
    })
    async findMyCards(@param.filter(Card) filter?: Filter<Card>): Promise<Card[]> {
        return this.cardRepository.findByCurrentUser(filter);
    }

    // ===================================================
    // ACTUALIZAR MÚLTIPLES TARJETAS
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateAnyCard],
    })
    @patch('/cards')
    @response(200, {
        description: 'Card PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async updateAll(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Card, { partial: true }),
                },
            },
        })
        card: Partial<Card>,
        @param.where(Card) where?: Where<Card>
    ): Promise<Count> {
        return this.cardRepository.updateAll(card, where);
    }

    // ===================================================
    // OBTENER TARJETA POR ID
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/{id}')
    @response(200, {
        description: 'Card model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Card, { includeRelations: true }),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Card, { exclude: 'where' }) filter?: FilterExcludingWhere<Card>
    ): Promise<Card> {
        return this.cardRepository.findById(id, filter);
    }

    // ===================================================
    // ACTUALIZAR TARJETA POR ID
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateAnyCard],
    })
    @patch('/cards/{id}')
    @response(204, {
        description: 'Card PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Card, { partial: true }),
                },
            },
        })
        card: Partial<Card>
    ): Promise<void> {
        await this.cardRepository.updateById(id, card);
    }

    // ===================================================
    // REEMPLAZAR TARJETA POR ID
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateAnyCard],
    })
    @put('/cards/{id}')
    @response(204, {
        description: 'Card PUT success',
    })
    async replaceById(@param.path.number('id') id: number, @requestBody() card: Card): Promise<void> {
        await this.cardRepository.replaceById(id, card);
    }

    // ===================================================
    // ELIMINAR TARJETA POR ID
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.DeleteOwnCard, PermissionKey.DeleteAnyCard],
    })
    @del('/cards/{id}')
    @response(204, {
        description: 'Card DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.cardRepository.deleteById(id);
    }

    // ===================================================
    // DUPLICAR TARJETA
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.CreateCard],
    })
    @post('/cards/{id}/duplicate')
    @response(200, {
        description: 'Duplicated Card model instance',
        content: { 'application/json': { schema: getModelSchemaRef(Card) } },
    })
    async duplicateCard(
        @param.path.number('id') fromCardId: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            newTitle: { type: 'string' },
                            newProfession: { type: 'string' },
                            newDescription: { type: 'string' },
                            modifyStyles: { type: 'boolean' },
                            newStyles: {
                                type: 'object',
                                properties: {
                                    primaryColor: { type: 'string' },
                                    secondaryColor: { type: 'string' },
                                    fontFamily: { type: 'string' },
                                    layoutTemplate: { type: 'string' },
                                },
                            },
                        },
                        required: ['newTitle'],
                    },
                },
            },
        })
        duplicateData: Omit<DuplicateCardRequest, 'fromCardId'>
    ): Promise<Card> {
        return this.cardService.duplicateCard({
            ...duplicateData,
            fromCardId,
        });
    }

    // ===================================================
    // OBTENER ESTADÍSTICAS DE TARJETA
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewCardStats],
    })
    @get('/cards/{id}/stats')
    @response(200, {
        description: 'Card statistics',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        title: { type: 'string' },
                        slug: { type: 'string' },
                        viewCount: { type: 'number' },
                        totalDetailedViews: { type: 'number' },
                        uniqueVisitors: { type: 'number' },
                        lastViewedAt: { type: 'string' },
                    },
                },
            },
        },
    })
    async getCardStats(@param.path.number('id') id: number): Promise<CardStatsResponse> {
        return this.cardService.getCardStats(id);
    }

    // ===================================================
    // GENERAR QR CODE
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateAnyCard],
    })
    @post('/cards/{id}/generate-qr')
    @response(200, {
        description: 'QR Code generated successfully',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        qrCodeUrl: { type: 'string' },
                    },
                },
            },
        },
    })
    async generateQR(@param.path.number('id') id: number): Promise<{ qrCodeUrl: string }> {
        const qrCodeUrl = await this.cardService.generateCardQR(id);
        return { qrCodeUrl };
    }

    // ===================================================
    // ACTUALIZAR SLUG DE TARJETA
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateAnyCard],
    })
    @patch('/cards/{id}/slug')
    @response(200, {
        description: 'Card slug updated successfully',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        slug: { type: 'string' },
                    },
                },
            },
        },
    })
    async updateSlug(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            newTitle: { type: 'string' },
                        },
                        required: ['newTitle'],
                    },
                },
            },
        })
        data: { newTitle: string }
    ): Promise<{ slug: string }> {
        const slug = await this.cardService.updateCardSlug(id, data.newTitle);
        return { slug };
    }

    // ===================================================
    // VERIFICAR DISPONIBILIDAD DE SLUG
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/check-slug/{slug}')
    @response(200, {
        description: 'Check if slug is available',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        available: { type: 'boolean' },
                        slug: { type: 'string' },
                    },
                },
            },
        },
    })
    async checkSlugAvailability(
        @param.path.string('slug') slug: string
    ): Promise<{ available: boolean; slug: string }> {
        const available = await this.cardService.isSlugAvailable(slug);
        return { available, slug };
    }

    // ===================================================
    // BÚSQUEDA DE TARJETAS
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/search/{query}')
    @response(200, {
        description: 'Search cards by query',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Card, { includeRelations: true }),
                },
            },
        },
    })
    async searchCards(
        @param.path.string('query') query: string,
        @param.query.number('limit') limit?: number
    ): Promise<Card[]> {
        return this.cardService.searchCards(query, limit);
    }

    // ===================================================
    // TARJETAS POPULARES
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/popular')
    @response(200, {
        description: 'Get popular cards (most viewed)',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Card, { includeRelations: true }),
                },
            },
        },
    })
    async getPopularCards(@param.query.number('limit') limit?: number): Promise<Card[]> {
        return this.cardService.getPopularCards(limit);
    }

    // ===================================================
    // TARJETAS RECIENTES
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/recent')
    @response(200, {
        description: 'Get recent cards',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Card, { includeRelations: true }),
                },
            },
        },
    })
    async getRecentCards(@param.query.number('limit') limit?: number): Promise<Card[]> {
        return this.cardService.getRecentCards(limit);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/{id}/complete')
    @response(200, {
        description: 'Complete card details for rendering',
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

                        // Estilos completos
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

                        // Redes sociales con URLs generadas
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

                        // Horarios formateados
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
    async getCompleteCardDetails(@param.path.number('id') id: number): Promise<CardCompleteResponse> {
        // Primero obtener la tarjeta para verificar permisos y obtener el slug
        const card = await this.cardRepository.findById(id);

        if (!card) {
            throw new HttpErrors.NotFound('Card not found');
        }

        // Usar el servicio para obtener todos los detalles
        const completeCard = await this.cardService.getCompleteCard(card.slug);

        if (!completeCard) {
            throw new HttpErrors.NotFound('Card details not found');
        }

        return completeCard;
    }
    @authorize({ permissions: ['*'] })
    @get('/cards/{id}/preview')
    @response(200, {
        description: 'HTML preview of the card',
        content: {
            'text/html': {
                schema: { type: 'string' },
            },
        },
    })
    async getCardPreview(@param.path.number('id') id: number): Promise<void> {
        // Usar la misma lógica de getCompleteCardDetails
        const card = await this.cardRepository.findById(id);

        if (!card) {
            throw new HttpErrors.NotFound('Card not found');
        }

        const completeCard = await this.cardService.getCompleteCard(card.slug);

        if (!completeCard) {
            throw new HttpErrors.NotFound('Card details not found');
        }

        // Generar HTML
        const html = this.generateCardHTML(completeCard);

        // Enviar respuesta HTML
        this.httpResponse.status(STATUS_CODE.OK).contentType('html').send(html);
    }
    private generateCardHTML(card: CardCompleteResponse): string {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${card.title} - ${card.profession ?? 'Tarjeta Digital'}</title>
    <meta name="description" content="${card.description ?? ''}">

    <!-- PrimeNG Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeicons@6.0.1/primeicons.css">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${card.styles.fontFamily}, sans-serif;
            background: linear-gradient(135deg, ${card.styles.backgroundColor} 0%, ${
            card.styles.secondaryColor
        }20 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .card-container {
            max-width: 600px;
            margin: 0 auto;
            background: ${card.styles.backgroundColor};
            border-radius: ${this.getBorderRadiusValue(card.styles.borderRadius)};
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
            border: 3px solid ${card.styles.primaryColor};
        }

        .card-header {
            background: linear-gradient(45deg, ${card.styles.primaryColor}, ${card.styles.accentColor});
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }

        .card-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"/><circle cx="80" cy="80" r="2" fill="white" opacity="0.1"/><circle cx="40" cy="60" r="1" fill="white" opacity="0.1"/></svg>');
        }

        .card-header * {
            position: relative;
            z-index: 1;
        }

        .logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 15px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: ${card.styles.primaryColor};
            border: 3px solid white;
        }

        .card-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .card-profession {
            font-size: 16px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .card-content {
            padding: 30px;
        }

        .description {
            color: ${card.styles.textColor};
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            text-align: center;
        }

        .section {
            margin-bottom: 25px;
        }

        .section-title {
            color: ${card.styles.primaryColor};
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .contact-item, .social-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            margin-bottom: 8px;
            background: ${card.styles.primaryColor}10;
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        .contact-item:hover, .social-item:hover {
            background: ${card.styles.primaryColor}20;
            transform: translateX(5px);
        }

        .contact-icon, .social-icon {
            width: 24px;
            height: 24px;
            color: ${card.styles.primaryColor};
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .contact-label {
            font-weight: 600;
            color: ${card.styles.textColor};
            min-width: 80px;
        }

        .contact-value {
            color: ${card.styles.textColor};
            flex: 1;
        }

        .primary-contact {
            border-left: 4px solid ${card.styles.accentColor};
        }

        .social-item a {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
        }

        .social-name {
            font-weight: 600;
            color: ${card.styles.textColor};
        }

        .social-value {
            color: ${card.styles.textColor};
            opacity: 0.8;
        }

        .schedule-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
        }

        .schedule-day {
            padding: 10px;
            background: ${card.styles.backgroundColor};
            border: 1px solid ${card.styles.primaryColor}30;
            border-radius: 6px;
            text-align: center;
        }

        .schedule-day.closed {
            opacity: 0.5;
        }

        .day-name {
            font-weight: bold;
            color: ${card.styles.primaryColor};
            font-size: 12px;
            text-transform: uppercase;
        }

        .day-hours {
            color: ${card.styles.textColor};
            font-size: 14px;
            margin-top: 4px;
        }

        .stats {
            text-align: center;
            padding: 20px;
            background: ${card.styles.primaryColor}05;
            border-top: 1px solid ${card.styles.primaryColor}20;
        }

        .view-count {
            color: ${card.styles.textColor};
            font-size: 14px;
        }

        .view-number {
            color: ${card.styles.primaryColor};
            font-weight: bold;
            font-size: 18px;
        }

        @media (max-width: 600px) {
            .card-container {
                margin: 10px;
                border-radius: 15px;
            }

            .card-content {
                padding: 20px;
            }

            .schedule-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="card-container">
        <!-- Header -->
        <div class="card-header">
            <div class="logo">
                ${
                    card.logoUrl
                        ? `<img src="${card.logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                        : `<i class="pi pi-user"></i>`
                }
            </div>
            <h1 class="card-title">${card.title}</h1>
            ${card.profession ? `<p class="card-profession">${card.profession}</p>` : ''}
        </div>

        <!-- Content -->
        <div class="card-content">
            ${
                card.description
                    ? `
                <div class="description">
                    <p>${card.description}</p>
                </div>
            `
                    : ''
            }

            <!-- Contact Info -->
            ${
                card.contactInfo.length > 0
                    ? `
                <div class="section">
                    <h3 class="section-title">
                        <i class="pi pi-phone"></i>
                        Información de Contacto
                    </h3>
                    ${card.contactInfo
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map(
                            (contact) => `
                            <div class="contact-item ${contact.isPrimary ? 'primary-contact' : ''}">
                                <div class="contact-icon">
                                    <i class="pi ${this.getContactIcon(contact.contactType)}"></i>
                                </div>
                                ${contact.label ? `<span class="contact-label">${contact.label}:</span>` : ''}
                                <span class="contact-value">${contact.value}</span>
                            </div>
                        `
                        )
                        .join('')}
                </div>
            `
                    : ''
            }

            <!-- Social Links -->
            ${
                card.socialLinks.length > 0
                    ? `
                <div class="section">
                    <h3 class="section-title">
                        <i class="pi pi-share-alt"></i>
                        Redes Sociales
                    </h3>
                    ${card.socialLinks
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map(
                            (social) => `
                            <div class="social-item">
                                <a href="${social.generatedUrl}" target="_blank" rel="noopener">
                                    <div class="social-icon">
                                        <i class="pi ${social.iconClass ?? 'pi-external-link'}"></i>
                                    </div>
                                    <span class="social-name">${social.socialNetworkName}</span>
                                    <span class="social-value">${social.value}</span>
                                </a>
                            </div>
                        `
                        )
                        .join('')}
                </div>
            `
                    : ''
            }

            <!-- Business Hours -->
            ${
                card.businessHours.length > 0
                    ? `
                <div class="section">
                    <h3 class="section-title">
                        <i class="pi pi-clock"></i>
                        Horarios de Atención
                    </h3>
                    <div class="schedule-grid">
                        ${card.businessHours
                            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                            .map(
                                (hour) => `
                                <div class="schedule-day ${hour.isClosed ? 'closed' : ''}">
                                    <div class="day-name">${hour.dayName}</div>
                                    <div class="day-hours">${hour.formattedSchedule}</div>
                                    ${
                                        hour.notes
                                            ? `<div style="font-size:11px;color:${card.styles.textColor}80;margin-top:2px;">${hour.notes}</div>`
                                            : ''
                                    }
                                </div>
                            `
                            )
                            .join('')}
                    </div>
                </div>
            `
                    : ''
            }
        </div>

        <!-- Stats -->
        <div class="stats">
            <div class="view-count">
                <span class="view-number">${card.viewCount.toLocaleString()}</span> visualizaciones
            </div>
        </div>
    </div>

    <script>
        // Agregar efectos de interacción
        document.addEventListener('DOMContentLoaded', function() {
            // Animar entrada
            document.querySelector('.card-container').style.animation = 'slideInUp 0.6s ease-out';

            // Agregar estilos de animación
            const style = document.createElement('style');
            style.textContent = \`
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            \`;
            document.head.appendChild(style);
        });
    </script>
</body>
</html>`;
    }

    // ===================================================
    // MÉTODOS AUXILIARES
    // ===================================================
    private getBorderRadiusValue(borderRadius: string): string {
        switch (borderRadius) {
            case 'none':
                return '0px';
            case 'small':
                return '8px';
            case 'medium':
                return '16px';
            case 'large':
                return '24px';
            default:
                return '16px';
        }
    }

    private getContactIcon(contactType: string): string {
        switch (contactType) {
            case 'phone':
                return 'pi-phone';
            case 'email':
                return 'pi-envelope';
            case 'address':
                return 'pi-map-marker';
            case 'website':
                return 'pi-globe';
            default:
                return 'pi-info-circle';
        }
    }

    private generateErrorHTML(slug: string): string {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tarjeta no encontrada</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .error-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .error-title {
            font-size: 24px;
            color: #333;
            margin-bottom: 10px;
        }
        .error-message {
            color: #666;
            margin-bottom: 20px;
        }
        .error-slug {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">🚫</div>
        <h1 class="error-title">Tarjeta no encontrada</h1>
        <p class="error-message">La tarjeta con slug <strong>"${slug}"</strong> no existe o no está disponible.</p>
        <div class="error-slug">${slug}</div>
    </div>
</body>
</html>`;
    }
}
