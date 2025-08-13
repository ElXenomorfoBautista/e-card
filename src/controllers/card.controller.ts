/* eslint-disable @typescript-eslint/no-explicit-any */
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
                                        contactType: { type: 'string' },
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
    // CONTAR TARJETAS (CON FILTRO DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/count')
    @response(200, {
        description: 'Card model count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async count(@param.where(Card) where?: Where<Card>): Promise<Count> {
        return this.getFilteredCount(where);
    }

    // ===================================================
    // LISTAR TARJETAS (CON FILTRO DE TENANT INTELIGENTE)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
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
        return this.getFilteredCards(filter);
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
    // OBTENER TARJETAS DEL TENANT ACTUAL
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/tenant-cards')
    @response(200, {
        description: 'Array of tenant Card model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Card, { includeRelations: true }),
                },
            },
        },
    })
    async findTenantCards(@param.filter(Card) filter?: Filter<Card>): Promise<Card[]> {
        return this.cardRepository.findByCurrentTenant(filter);
    }

    // ===================================================
    // ACTUALIZAR MÚLTIPLES TARJETAS (CON FILTRO DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateTenantCard, PermissionKey.UpdateAnyCard],
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
        // Aplicar filtrado de tenant a la actualización
        const filteredWhere = await this.applyTenantFilter(where);
        return this.cardRepository.updateAll(card, filteredWhere);
    }

    // ===================================================
    // OBTENER TARJETA POR ID (CON VALIDACIÓN DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
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
        await this.validateCardAccess(id);
        return this.cardRepository.findById(id, filter);
    }

    // ===================================================
    // ACTUALIZAR TARJETA POR ID (CON VALIDACIÓN DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateTenantCard, PermissionKey.UpdateAnyCard],
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
        await this.validateCardUpdateAccess(id);
        await this.cardRepository.updateById(id, card);
    }

    // ===================================================
    // REEMPLAZAR TARJETA POR ID (CON VALIDACIÓN DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateTenantCard, PermissionKey.UpdateAnyCard],
    })
    @put('/cards/{id}')
    @response(204, {
        description: 'Card PUT success',
    })
    async replaceById(@param.path.number('id') id: number, @requestBody() card: Card): Promise<void> {
        await this.validateCardUpdateAccess(id);
        await this.cardRepository.replaceById(id, card);
    }

    // ===================================================
    // ELIMINAR TARJETA POR ID (CON VALIDACIÓN DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.DeleteOwnCard, PermissionKey.DeleteTenantCard, PermissionKey.DeleteAnyCard],
    })
    @del('/cards/{id}')
    @response(204, {
        description: 'Card DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.validateCardDeleteAccess(id);
        await this.cardRepository.deleteById(id);
    }

    // ===================================================
    // DUPLICAR TARJETA (CON VALIDACIÓN DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.DuplicateCard],
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
        // Validar que puede acceder a la tarjeta fuente
        await this.validateCardAccess(fromCardId);

        return this.cardService.duplicateCard({
            ...duplicateData,
            fromCardId,
        });
    }

    // ===================================================
    // OBTENER ESTADÍSTICAS DE TARJETA (CON VALIDACIÓN DE TENANT)
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
        await this.validateCardAccess(id);
        return this.cardService.getCardStats(id);
    }

    // ===================================================
    // GENERAR QR CODE (CON VALIDACIÓN DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateTenantCard, PermissionKey.UpdateAnyCard],
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
        await this.validateCardUpdateAccess(id);
        const qrCodeUrl = await this.cardService.generateCardQR(id);
        return { qrCodeUrl };
    }

    // ===================================================
    // ACTUALIZAR SLUG DE TARJETA (CON VALIDACIÓN DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateOwnCard, PermissionKey.UpdateTenantCard, PermissionKey.UpdateAnyCard],
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
        await this.validateCardUpdateAccess(id);
        const slug = await this.cardService.updateCardSlug(id, data.newTitle);
        return { slug };
    }

    // ===================================================
    // VERIFICAR DISPONIBILIDAD DE SLUG
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
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
    // BÚSQUEDA DE TARJETAS (CON FILTRO DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
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
        return this.getFilteredSearchResults(query, limit);
    }

    // ===================================================
    // TARJETAS POPULARES (CON FILTRO DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
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
        return this.getFilteredPopularCards(limit);
    }

    // ===================================================
    // TARJETAS RECIENTES (CON FILTRO DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
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
        return this.getFilteredRecentCards(limit);
    }

    // ===================================================
    // OBTENER TARJETA COMPLETA PARA RENDERIZADO (CON VALIDACIÓN DE TENANT)
    // ===================================================
    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewOwnCard, PermissionKey.ViewTenantCard, PermissionKey.ViewAnyCard],
    })
    @get('/cards/{id}/complete')
    @response(200, {
        description: 'Complete card details for rendering',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        slug: { type: 'string' },
                        title: { type: 'string' },
                        profession: { type: 'string' },
                        description: { type: 'string' },
                        logoUrl: { type: 'string' },
                        qrCodeUrl: { type: 'string' },
                        isActive: { type: 'boolean' },
                        viewCount: { type: 'number' },
                        ownerName: { type: 'string' },
                        tenantName: { type: 'string' },
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
                                    contactType: { type: 'string' },
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
                                    socialNetworkName: { type: 'string' },
                                    value: { type: 'string' },
                                    urlPattern: { type: 'string' },
                                    iconClass: { type: 'string' },
                                    displayOrder: { type: 'number' },
                                    generatedUrl: { type: 'string' },
                                },
                            },
                        },
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
                        createdOn: { type: 'string' },
                        modifiedOn: { type: 'string' },
                    },
                },
            },
        },
    })
    async getCompleteCardDetails(@param.path.number('id') id: number): Promise<CardCompleteResponse> {
        const card = await this.cardRepository.findById(id);

        if (!card) {
            throw new HttpErrors.NotFound('Card not found');
        }

        // Validar acceso al tenant
        await this.validateCardAccess(id);

        const completeCard = await this.cardService.getCompleteCard(card.slug);

        if (!completeCard) {
            throw new HttpErrors.NotFound('Card details not found');
        }

        return completeCard;
    }

    // ===================================================
    // MÉTODOS PRIVADOS DE SEGURIDAD Y FILTRADO
    // ===================================================

    private async getCurrentUser(): Promise<any> {
        return this.cardRepository['getCurrentUser']();
    }

    private async isSuperAdmin(): Promise<boolean> {
        const currentUser = await this.getCurrentUser();
        return currentUser?.tenant?.id === 1;
    }

    private async hasPermission(permission: string): Promise<boolean> {
        const currentUser = await this.getCurrentUser();
        return currentUser?.permissions?.includes(permission) ?? false;
    }

    private async validateCardAccess(cardId: number): Promise<void> {
        if (await this.isSuperAdmin()) return; // Super admin puede ver todo

        const currentUser = await this.getCurrentUser();
        const card = await this.cardRepository.findById(cardId);

        const hasViewAny = await this.hasPermission(PermissionKey.ViewAnyCard);
        const hasViewTenant = await this.hasPermission(PermissionKey.ViewTenantCard);
        const hasViewOwn = await this.hasPermission(PermissionKey.ViewOwnCard);

        if (hasViewAny) return; // Puede ver cualquier tarjeta

        if (hasViewTenant && card.tenantId === currentUser.tenant.id) return; // Mismo tenant

        if (hasViewOwn && card.userId === currentUser.id) return; // Es el dueño

        throw new HttpErrors.Forbidden('You do not have permission to access this card');
    }

    private async validateCardUpdateAccess(cardId: number): Promise<void> {
        if (await this.isSuperAdmin()) return;

        const currentUser = await this.getCurrentUser();
        const card = await this.cardRepository.findById(cardId);

        const hasUpdateAny = await this.hasPermission(PermissionKey.UpdateAnyCard);
        const hasUpdateTenant = await this.hasPermission(PermissionKey.UpdateTenantCard);
        const hasUpdateOwn = await this.hasPermission(PermissionKey.UpdateOwnCard);

        if (hasUpdateAny) return;

        if (hasUpdateTenant && card.tenantId === currentUser.tenant.id) return;

        if (hasUpdateOwn && card.userId === currentUser.id) return;

        throw new HttpErrors.Forbidden('You do not have permission to update this card');
    }

    private async validateCardDeleteAccess(cardId: number): Promise<void> {
        if (await this.isSuperAdmin()) return;

        const currentUser = await this.getCurrentUser();
        const card = await this.cardRepository.findById(cardId);

        const hasDeleteAny = await this.hasPermission(PermissionKey.DeleteAnyCard);
        const hasDeleteTenant = await this.hasPermission(PermissionKey.DeleteTenantCard);
        const hasDeleteOwn = await this.hasPermission(PermissionKey.DeleteOwnCard);

        if (hasDeleteAny) return;

        if (hasDeleteTenant && card.tenantId === currentUser.tenant.id) return;

        if (hasDeleteOwn && card.userId === currentUser.id) return;

        throw new HttpErrors.Forbidden('You do not have permission to delete this card');
    }

    private async applyTenantFilter(where?: Where<Card>): Promise<Where<Card>> {
        if (await this.isSuperAdmin()) return where ?? {}; // Super admin sin filtro

        const currentUser = await this.getCurrentUser();
        const hasViewAny = await this.hasPermission(PermissionKey.ViewAnyCard);

        if (hasViewAny) return where ?? {}; // Puede ver cualquier tarjeta

        const tenantFilter = { tenantId: currentUser.tenant.id };

        return where ? { and: [where, tenantFilter] } : tenantFilter;
    }

    private async getFilteredCards(filter?: Filter<Card>): Promise<Card[]> {
        const filteredWhere = await this.applyTenantFilter(filter?.where);

        return this.cardRepository.find({
            ...filter,
            where: filteredWhere,
        });
    }

    private async getFilteredCount(where?: Where<Card>): Promise<Count> {
        const filteredWhere = await this.applyTenantFilter(where);
        return this.cardRepository.count(filteredWhere);
    }

    private async getFilteredSearchResults(query: string, limit?: number): Promise<Card[]> {
        if (await this.isSuperAdmin()) {
            return this.cardService.searchCards(query, limit);
        }

        // Aplicar filtro de tenant a la búsqueda
        const currentUser = await this.getCurrentUser();
        const searchTerm = `%${query.toLowerCase()}%`;

        const tenantFilter = { tenantId: currentUser.tenant.id };
        const searchFilter = {
            or: [
                { title: { ilike: searchTerm } },
                { profession: { ilike: searchTerm } },
                { description: { ilike: searchTerm } },
            ],
        };

        return this.cardRepository.find({
            where: { and: [tenantFilter, searchFilter] },
            order: ['viewCount DESC', 'title ASC'],
            limit: limit ?? 10,
        });
    }

    private async getFilteredPopularCards(limit?: number): Promise<Card[]> {
        const filter = await this.applyTenantFilter();

        return this.cardRepository.find({
            where: filter,
            order: ['viewCount DESC', 'createdOn DESC'],
            limit: limit ?? 10,
        });
    }

    private async getFilteredRecentCards(limit?: number): Promise<Card[]> {
        const filter = await this.applyTenantFilter();

        return this.cardRepository.find({
            where: filter,
            order: ['createdOn DESC'],
            limit: limit ?? 10,
        });
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
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"/><circle cx="80" cy="80" r="2" fill="white" opacity="0.1"/></svg>');
            pointer-events: none;
        }

        .logo {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            border: 4px solid white;
            object-fit: cover;
            position: relative;
            z-index: 1;
        }

        .card-title {
            font-size: 2.2rem;
            font-weight: bold;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }

        .card-profession {
            font-size: 1.2rem;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }

        .card-body {
            padding: 30px;
        }

        .description {
            color: ${card.styles.textColor};
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 30px;
            text-align: center;
        }

        .section {
            margin-bottom: 30px;
        }

        .section-title {
            color: ${card.styles.primaryColor};
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid ${card.styles.primaryColor}33;
            padding-bottom: 5px;
        }

        .contact-item, .social-item {
            display: flex;
            align-items: center;
            padding: 12px;
            margin-bottom: 10px;
            background: ${card.styles.primaryColor}0A;
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        .contact-item:hover, .social-item:hover {
            background: ${card.styles.primaryColor}20;
            transform: translateX(5px);
        }

        .contact-icon, .social-icon {
            width: 20px;
            text-align: center;
            margin-right: 15px;
            color: ${card.styles.primaryColor};
            font-size: 1.2rem;
        }

        .contact-label {
            font-weight: bold;
            color: ${card.styles.textColor};
            margin-right: 10px;
            min-width: 120px;
        }

        .contact-value {
            color: ${card.styles.textColor};
            text-decoration: none;
        }

        /* NUEVA CLASE PARA ENLACES DE UBICACIÓN */
        .contact-value.location-link {
            color: ${card.styles.primaryColor};
            text-decoration: none;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .contact-value.location-link:hover {
            color: ${card.styles.accentColor};
            text-decoration: underline;
        }

        .phone-link {
            color: ${card.styles.primaryColor};
            text-decoration: none;
        }

        .phone-link:hover {
            color: ${card.styles.accentColor};
        }

        .email-link {
            color: ${card.styles.primaryColor};
            text-decoration: none;
        }

        .email-link:hover {
            color: ${card.styles.accentColor};
        }

        .social-name {
            font-weight: bold;
            color: ${card.styles.textColor};
        }

        .social-link {
            color: ${card.styles.primaryColor};
            text-decoration: none;
            margin-left: auto;
            padding: 8px 15px;
            background: ${card.styles.primaryColor}15;
            border-radius: 20px;
            transition: all 0.3s ease;
        }

        .social-link:hover {
            background: ${card.styles.primaryColor};
            color: white;
        }

        .hours-day {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid ${card.styles.primaryColor}20;
        }

        .day-name {
            font-weight: bold;
            color: ${card.styles.textColor};
        }

        .day-schedule {
            color: ${card.styles.textColor};
        }

        .closed {
            color: #999;
            font-style: italic;
        }

        .footer {
            text-align: center;
            padding: 20px;
            background: ${card.styles.primaryColor}10;
            color: ${card.styles.textColor};
            font-size: 0.9rem;
        }

        .view-count {
            color: ${card.styles.primaryColor};
            font-weight: bold;
        }

        @media (max-width: 768px) {
            .card-container {
                margin: 10px;
            }

            .card-header {
                padding: 20px;
            }

            .card-title {
                font-size: 1.8rem;
            }

            .contact-label {
                min-width: 100px;
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <div class="card-container">
        <div class="card-header">
            ${card.logoUrl ? `<img src="${card.logoUrl}" alt="${card.title}" class="logo">` : ''}
            <h1 class="card-title">${card.title}</h1>
            ${card.profession ? `<p class="card-profession">${card.profession}</p>` : ''}
        </div>

        <div class="card-body">
            ${card.description ? `<p class="description">${card.description}</p>` : ''}

            ${
                card.contactInfo.length > 0
                    ? `
            <div class="section">
                <h2 class="section-title">
                    <i class="pi pi-phone"></i> Contacto
                </h2>
                ${card.contactInfo
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((contact) => this.generateContactHTML(contact))
                    .join('')}
            </div>
            `
                    : ''
            }

            ${
                card.socialLinks.length > 0
                    ? `
            <div class="section">
                <h2 class="section-title">
                    <i class="pi pi-share-alt"></i> Redes Sociales
                </h2>
                ${card.socialLinks
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(
                        (social) => `
                    <div class="social-item">
                        <i class="${social.iconClass ?? 'pi pi-globe'} social-icon"></i>
                        <span class="social-name">${social.socialNetworkName}</span>
                        <a href="${social.generatedUrl}" target="_blank" class="social-link">
                            Visitar
                        </a>
                    </div>
                    `
                    )
                    .join('')}
            </div>
            `
                    : ''
            }

            ${
                card.businessHours.length > 0
                    ? `
            <div class="section">
                <h2 class="section-title">
                    <i class="pi pi-clock"></i> Horarios de Atención
                </h2>
                ${card.businessHours
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map(
                        (hour) => `
                    <div class="hours-day">
                        <span class="day-name">${hour.dayName}</span>
                        <span class="day-schedule ${hour.isClosed ? 'closed' : ''}">${hour.formattedSchedule}</span>
                    </div>
                    `
                    )
                    .join('')}
            </div>
            `
                    : ''
            }
        </div>

        <div class="footer">
            <p>Vistas: <span class="view-count">${card.viewCount}</span></p>
            <p>Creado por: ${card.ownerName} | ${card.tenantName}</p>
        </div>
    </div>
</body>
</html>`;
    }

    // MÉTODO AUXILIAR PARA GENERAR HTML DE CONTACTO
    private generateContactHTML(contact: any): string {
        const getContactIcon = (type: string) => {
            switch (type) {
                case 'phone':
                    return 'pi pi-phone';
                case 'email':
                    return 'pi pi-envelope';
                case 'address':
                    return 'pi pi-map-marker';
                case 'website':
                    return 'pi pi-globe';
                default:
                    return 'pi pi-info-circle';
            }
        };

        const formatContactValue = (contact: any) => {
            switch (contact.contactType) {
                case 'phone':
                    // Si parece un número de WhatsApp (empieza con +52), crear enlace de WhatsApp
                    if (contact.value.startsWith('+52') || contact.label?.toLowerCase().includes('whatsapp')) {
                        const cleanNumber = contact.value.replace(/[^\d]/g, '');
                        return `<a href="https://wa.me/${cleanNumber}" target="_blank" class="phone-link">${contact.value}</a>`;
                    }
                    // Si no, crear enlace tel:
                    return `<a href="tel:${contact.value}" class="phone-link">${contact.value}</a>`;

                case 'email':
                    return `<a href="mailto:${contact.value}" class="email-link">${contact.value}</a>`;

                case 'address':
                    // Detectar si es un enlace de Google Maps
                    if (contact.value.includes('google.com/maps') || contact.value.includes('goo.gl')) {
                        return `<a href="${contact.value}" target="_blank" class="contact-value location-link">📍 Ver en Google Maps</a>`;
                    }
                    // Si no es un enlace, mostrar como texto normal
                    return `<span class="contact-value">${contact.value}</span>`;

                case 'website':
                    return `<a href="${contact.value}" target="_blank" class="contact-value">${contact.value}</a>`;

                default:
                    return `<span class="contact-value">${contact.value}</span>`;
            }
        };

        return `
        <div class="contact-item">
            <i class="${getContactIcon(contact.contactType)} contact-icon"></i>
            <span class="contact-label">${contact.label || contact.contactType}:</span>
            ${formatContactValue(contact)}
        </div>
    `;
    }

    // MÉTODO AUXILIAR PARA BORDER RADIUS
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
