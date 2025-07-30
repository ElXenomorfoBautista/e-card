/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Getter } from '@loopback/core';
import { BelongsToAccessor, repository } from '@loopback/repository';
import { AuthenticationBindings } from 'loopback4-authentication';

import { PgdbDataSource } from '../datasources';
import { CardContactInfo, CardContactInfoRelations, Card } from '../models';
import { AuthUser } from '../modules/auth';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';
import { CardRepository } from './card.repository';

export class CardContactInfoRepository extends DefaultUserModifyCrudRepository<
    CardContactInfo,
    typeof CardContactInfo.prototype.id,
    CardContactInfoRelations
> {
    public readonly card: BelongsToAccessor<Card, typeof CardContactInfo.prototype.id>;

    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>,
        @repository.getter('CardRepository')
        getCardRepository: Getter<CardRepository>
    ) {
        super(CardContactInfo, dataSource, getCurrentUser);

        this.card = this.createBelongsToAccessorFor('card', getCardRepository);
        this.registerInclusionResolver('card', this.card.inclusionResolver);
    }

    // Obtener información de contacto por card ID
    async findByCardId(cardId: number): Promise<CardContactInfo[]> {
        return this.find({
            where: { cardId },
            order: ['displayOrder ASC', 'isPrimary DESC'],
        });
    }

    // Obtener contacto principal por tipo
    async findPrimaryByType(
        cardId: number,
        contactType: 'phone' | 'email' | 'address' | 'website'
    ): Promise<CardContactInfo | null> {
        return this.findOne({
            where: {
                cardId,
                contactType: contactType as any,
                isPrimary: true,
            },
        });
    }

    // Establecer como contacto principal (quita el primary de otros del mismo tipo)
    async setPrimary(id: number): Promise<void> {
        const contact = await this.findById(id);

        // Quitar primary de otros contactos del mismo tipo
        await this.updateAll({ isPrimary: false }, { cardId: contact.cardId, contactType: contact.contactType });

        // Establecer este como primary
        await this.updateById(id, { isPrimary: true });
    }
}
