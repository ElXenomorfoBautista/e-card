import { inject, Getter } from '@loopback/core';
import { BelongsToAccessor, repository } from '@loopback/repository';
import { AuthenticationBindings } from 'loopback4-authentication';

import { PgdbDataSource } from '../datasources';
import { CardView, CardViewRelations, Card } from '../models';
import { AuthUser } from '../modules/auth';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';
import { CardRepository } from './card.repository';

export class CardViewRepository extends DefaultUserModifyCrudRepository<
    CardView,
    typeof CardView.prototype.id,
    CardViewRelations
> {
    public readonly card: BelongsToAccessor<Card, typeof CardView.prototype.id>;

    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>,
        @repository.getter('CardRepository')
        getCardRepository: Getter<CardRepository>
    ) {
        super(CardView, dataSource, getCurrentUser);

        this.card = this.createBelongsToAccessorFor('card', getCardRepository);
        this.registerInclusionResolver('card', this.card.inclusionResolver);
    }

    // Registrar nueva visualización
    async recordView(
        cardId: number,
        viewerIp?: string,
        userAgent?: string,
        referrer?: string,
        deviceType?: 'mobile' | 'desktop' | 'tablet'
    ): Promise<CardView> {
        return this.create({
            cardId,
            viewerIp,
            userAgent,
            referrer,
            deviceType,
            viewedAt: new Date().toISOString(),
        });
    }

    // Obtener views por card ID
    async findByCardId(cardId: number): Promise<CardView[]> {
        return this.find({
            where: { cardId },
            order: ['viewedAt DESC'],
        });
    }

    // Obtener estadísticas de views
    async getViewStats(cardId: number) {
        const totalViews = await this.count({ cardId });

        const uniqueVisitors = await this.dataSource.execute(
            'SELECT COUNT(DISTINCT viewer_ip) as unique_count FROM e_card.card_views WHERE card_id = $1 AND deleted = false',
            [cardId]
        );

        const deviceStats = await this.dataSource.execute(
            'SELECT device_type, COUNT(*) as count FROM e_card.card_views WHERE card_id = $1 AND deleted = false GROUP BY device_type',
            [cardId]
        );

        return {
            totalViews: totalViews.count,
            uniqueVisitors: uniqueVisitors[0]?.unique_count || 0,
            deviceBreakdown: deviceStats,
        };
    }
}
