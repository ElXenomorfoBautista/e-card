import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where } from '@loopback/repository';
import { post, param, get, getModelSchemaRef, patch, put, del, requestBody, response } from '@loopback/rest';
import { service } from '@loopback/core';
import { authenticate, STRATEGY } from 'loopback4-authentication';
import { authorize } from 'loopback4-authorization';

import { Card } from '../models';
import { CardRepository } from '../repositories';
import { CardService } from '../services';
import { PermissionKey } from '../modules/auth/permission-key.enum';
import { CreateCardRequest, DuplicateCardRequest, CardStatsResponse } from '../types/ecard.types';

export class CardController {
    constructor(
        @repository(CardRepository)
        public cardRepository: CardRepository,
        @service(CardService)
        private cardService: CardService
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
}
