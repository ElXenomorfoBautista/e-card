/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Getter } from '@loopback/core';
import {
    BelongsToAccessor,
    HasOneRepositoryFactory,
    HasManyRepositoryFactory,
    repository,
    DataObject,
    Filter,
    Where,
} from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';
import { AuthenticationBindings } from 'loopback4-authentication';

import { PgdbDataSource } from '../datasources';
import {
    Card,
    CardRelations,
    User,
    Tenant,
    CardStyle,
    CardContactInfo,
    CardSocialLink,
    CardBusinessHour,
    CardView,
} from '../models';
import { AuthUser } from '../modules/auth';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';
import { UserRepository } from './user.repository';
import { TenantRepository } from './tenant.repository';
import { CardStyleRepository } from './card-style.repository';
import { CardContactInfoRepository } from './card-contact-info.repository';
import { CardSocialLinkRepository } from './card-social-link.repository';
import { CardBusinessHourRepository } from './card-business-hour.repository';
import { CardViewRepository } from './card-view.repository';

export class CardRepository extends DefaultUserModifyCrudRepository<Card, typeof Card.prototype.id, CardRelations> {
    public readonly user: BelongsToAccessor<User, typeof Card.prototype.id>;
    public readonly tenant: BelongsToAccessor<Tenant, typeof Card.prototype.id>;
    public readonly duplicatedFrom: BelongsToAccessor<Card, typeof Card.prototype.id>;

    public readonly cardStyle: HasOneRepositoryFactory<CardStyle, typeof Card.prototype.id>;
    public readonly contactInfo: HasManyRepositoryFactory<CardContactInfo, typeof Card.prototype.id>;
    public readonly socialLinks: HasManyRepositoryFactory<CardSocialLink, typeof Card.prototype.id>;
    public readonly businessHours: HasManyRepositoryFactory<CardBusinessHour, typeof Card.prototype.id>;
    public readonly views: HasManyRepositoryFactory<CardView, typeof Card.prototype.id>;
    public readonly duplicatedCards: HasManyRepositoryFactory<Card, typeof Card.prototype.id>;

    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>,

        @repository.getter('UserRepository')
        getUserRepository: Getter<UserRepository>,
        @repository.getter('TenantRepository')
        getTenantRepository: Getter<TenantRepository>,
        @repository.getter('CardStyleRepository')
        getCardStyleRepository: Getter<CardStyleRepository>,
        @repository.getter('CardContactInfoRepository')
        getCardContactInfoRepository: Getter<CardContactInfoRepository>,
        @repository.getter('CardSocialLinkRepository')
        getCardSocialLinkRepository: Getter<CardSocialLinkRepository>,
        @repository.getter('CardBusinessHourRepository')
        getCardBusinessHourRepository: Getter<CardBusinessHourRepository>,
        @repository.getter('CardViewRepository')
        getCardViewRepository: Getter<CardViewRepository>
    ) {
        super(Card, dataSource, getCurrentUser);

        // Relaciones belongsTo
        this.user = this.createBelongsToAccessorFor('user', getUserRepository);
        this.registerInclusionResolver('user', this.user.inclusionResolver);

        this.tenant = this.createBelongsToAccessorFor('tenant', getTenantRepository);
        this.registerInclusionResolver('tenant', this.tenant.inclusionResolver);

        this.duplicatedFrom = this.createBelongsToAccessorFor('duplicatedFrom', async () => this);
        this.registerInclusionResolver('duplicatedFrom', this.duplicatedFrom.inclusionResolver);

        // Relaciones hasOne y hasMany
        this.cardStyle = this.createHasOneRepositoryFactoryFor('cardStyle', getCardStyleRepository);
        this.registerInclusionResolver('cardStyle', this.cardStyle.inclusionResolver);

        this.contactInfo = this.createHasManyRepositoryFactoryFor('contactInfo', getCardContactInfoRepository);
        this.registerInclusionResolver('contactInfo', this.contactInfo.inclusionResolver);

        this.socialLinks = this.createHasManyRepositoryFactoryFor('socialLinks', getCardSocialLinkRepository);
        this.registerInclusionResolver('socialLinks', this.socialLinks.inclusionResolver);

        this.businessHours = this.createHasManyRepositoryFactoryFor('businessHours', getCardBusinessHourRepository);
        this.registerInclusionResolver('businessHours', this.businessHours.inclusionResolver);

        this.views = this.createHasManyRepositoryFactoryFor('views', getCardViewRepository);
        this.registerInclusionResolver('views', this.views.inclusionResolver);

        this.duplicatedCards = this.createHasManyRepositoryFactoryFor('duplicatedCards', async () => this);
        this.registerInclusionResolver('duplicatedCards', this.duplicatedCards.inclusionResolver);
    }

    // ===================================================
    // MÉTODOS ESPECÍFICOS PARA E-CARDS
    // ===================================================

    async create(entity: DataObject<Card>, options?: any): Promise<Card> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            throw new HttpErrors.Forbidden('User not authenticated');
        }

        // Auto-asignar tenant del usuario actual
        if (!entity.tenantId) {
            entity.tenantId = currentUser.tenant.id;
        }

        // Auto-asignar usuario actual
        if (!entity.userId) {
            entity.userId = currentUser.id!;
        }

        // Generar slug único si no se proporciona
        if (!entity.slug && entity.title) {
            entity.slug = await this.generateUniqueSlug(entity.title);
        }

        return super.create(entity, options);
    }

    // Generar slug único
    async generateUniqueSlug(baseTitle: string): Promise<string> {
        let slug = this.normalizeSlug(baseTitle);
        let counter = 0;
        let finalSlug = slug;

        while (await this.existsSlug(finalSlug)) {
            counter++;
            finalSlug = `${slug}-${counter}`;
        }

        return finalSlug;
    }

    // Normalizar texto a slug
    private normalizeSlug(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales
            .trim()
            .replace(/\s+/g, '-') // Espacios a guiones
            .substring(0, 80); // Limitar longitud
    }

    // Verificar si existe slug
    async existsSlug(slug: string): Promise<boolean> {
        const count = await this.count({ slug });
        return count.count > 0;
    }

    // Buscar por slug
    async findBySlug(slug: string): Promise<Card | null> {
        return this.findOne({
            where: { slug, isActive: true },
            include: ['user', 'tenant', 'cardStyle', 'contactInfo', 'socialLinks', 'businessHours'],
        });
    }

    // Obtener tarjetas del usuario actual
    async findByCurrentUser(filter?: Filter<Card>): Promise<Card[]> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            throw new HttpErrors.Forbidden('User not authenticated');
        }

        const userFilter: Where<Card> = { userId: currentUser.id };

        return this.find({
            ...filter,
            where: {
                ...filter?.where,
                ...userFilter,
            },
        });
    }

    // Obtener tarjetas del tenant actual
    async findByCurrentTenant(filter?: Filter<Card>): Promise<Card[]> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            throw new HttpErrors.Forbidden('User not authenticated');
        }

        const tenantFilter: Where<Card> = { tenantId: currentUser.tenant.id };

        return this.find({
            ...filter,
            where: {
                ...filter?.where,
                ...tenantFilter,
            },
        });
    }

    // Duplicar tarjeta
    async duplicateCard(sourceCardId: number, newTitle: string, newProfession?: string): Promise<Card> {
        const sourceCard = await this.findById(sourceCardId, {
            include: ['cardStyle', 'contactInfo', 'socialLinks', 'businessHours'],
        });

        if (!sourceCard) {
            throw new HttpErrors.NotFound('Source card not found');
        }

        // Crear nueva tarjeta
        const newCard = await this.create({
            title: newTitle,
            profession: newProfession ?? sourceCard.profession,
            description: sourceCard.description,
            logoUrl: sourceCard.logoUrl,
            duplicatedFromId: sourceCard.id,
            isActive: true,
        });

        // Duplicar relaciones usando los repositorios relacionados
        if (sourceCard.cardStyle) {
            await this.cardStyle(newCard.id!).create({
                primaryColor: sourceCard.cardStyle.primaryColor,
                secondaryColor: sourceCard.cardStyle.secondaryColor,
                backgroundColor: sourceCard.cardStyle.backgroundColor,
                textColor: sourceCard.cardStyle.textColor,
                accentColor: sourceCard.cardStyle.accentColor,
                fontFamily: sourceCard.cardStyle.fontFamily,
                fontSize: sourceCard.cardStyle.fontSize,
                layoutTemplate: sourceCard.cardStyle.layoutTemplate,
                borderRadius: sourceCard.cardStyle.borderRadius,
            });
        }

        return newCard;
    }

    // Incrementar contador de views
    async incrementViewCount(cardId: number): Promise<void> {
        await this.updateById(cardId, {
            viewCount: (await this.getViewCount(cardId)) + 1,
        });
    }

    // Obtener contador actual de views
    private async getViewCount(cardId: number): Promise<number> {
        const card = await this.findById(cardId, { fields: ['viewCount'] });
        return card.viewCount || 0;
    }

    // Obtener estadísticas básicas de una tarjeta
    async getCardStats(cardId: number) {
        const card = await this.findById(cardId);
        const viewsRepository = this.views(cardId);
        const viewsCount = await viewsRepository.count();
        const uniqueVisitors = await this.dataSource.execute(
            'SELECT COUNT(DISTINCT viewer_ip) as unique_count FROM e_card.card_views WHERE card_id = $1 AND deleted = false',
            [cardId]
        );

        return {
            id: card.id,
            title: card.title,
            slug: card.slug,
            viewCount: card.viewCount,
            totalDetailedViews: viewsCount.count,
            uniqueVisitors: uniqueVisitors[0]?.unique_count || 0,
        };
    }
}
