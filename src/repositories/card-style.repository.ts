import { inject, Getter } from '@loopback/core';
import { BelongsToAccessor, repository } from '@loopback/repository';
import { AuthenticationBindings } from 'loopback4-authentication';

import { PgdbDataSource } from '../datasources';
import { CardStyle, CardStyleRelations, Card } from '../models';
import { AuthUser } from '../modules/auth';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';
import { CardRepository } from './card.repository';

export class CardStyleRepository extends DefaultUserModifyCrudRepository<
    CardStyle,
    typeof CardStyle.prototype.id,
    CardStyleRelations
> {
    public readonly card: BelongsToAccessor<Card, typeof CardStyle.prototype.id>;

    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>,
        @repository.getter('CardRepository')
        getCardRepository: Getter<CardRepository>
    ) {
        super(CardStyle, dataSource, getCurrentUser);

        this.card = this.createBelongsToAccessorFor('card', getCardRepository);
        this.registerInclusionResolver('card', this.card.inclusionResolver);
    }

    // Obtener estilo por card ID
    async findByCardId(cardId: number): Promise<CardStyle | null> {
        return this.findOne({ where: { cardId } });
    }

    // Crear estilo con valores por defecto
    async createWithDefaults(cardId: number, customStyles?: Partial<CardStyle>): Promise<CardStyle> {
        const defaultStyle = {
            cardId,
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            backgroundColor: '#ffffff',
            textColor: '#212529',
            accentColor: '#28a745',
            fontFamily: 'Inter',
            fontSize: 'medium',
            layoutTemplate: 'modern',
            borderRadius: 'medium',
            ...customStyles,
        };

        return this.create(defaultStyle);
    }
}
