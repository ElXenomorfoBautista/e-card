import { inject, Getter } from '@loopback/core';
import { BelongsToAccessor, repository } from '@loopback/repository';
import { AuthenticationBindings } from 'loopback4-authentication';

import { PgdbDataSource } from '../datasources';
import { CardSocialLink, CardSocialLinkRelations, Card, SocialNetworkType } from '../models';
import { AuthUser } from '../modules/auth';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';
import { CardRepository } from './card.repository';
import { SocialNetworkTypeRepository } from './social-network-type.repository';

export class CardSocialLinkRepository extends DefaultUserModifyCrudRepository<
    CardSocialLink,
    typeof CardSocialLink.prototype.id,
    CardSocialLinkRelations
> {
    public readonly card: BelongsToAccessor<Card, typeof CardSocialLink.prototype.id>;
    public readonly socialNetworkType: BelongsToAccessor<SocialNetworkType, typeof CardSocialLink.prototype.id>;

    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>,
        @repository.getter('CardRepository')
        getCardRepository: Getter<CardRepository>,
        @repository.getter('SocialNetworkTypeRepository')
        getSocialNetworkTypeRepository: Getter<SocialNetworkTypeRepository>
    ) {
        super(CardSocialLink, dataSource, getCurrentUser);

        this.card = this.createBelongsToAccessorFor('card', getCardRepository);
        this.registerInclusionResolver('card', this.card.inclusionResolver);

        this.socialNetworkType = this.createBelongsToAccessorFor('socialNetworkType', getSocialNetworkTypeRepository);
        this.registerInclusionResolver('socialNetworkType', this.socialNetworkType.inclusionResolver);
    }

    // Obtener redes sociales por card ID
    async findByCardId(cardId: number): Promise<CardSocialLink[]> {
        return this.find({
            where: { cardId },
            include: ['socialNetworkType'],
            order: ['displayOrder ASC'],
        });
    }

    // Generar URL completa de la red social
    async generateSocialUrl(socialLinkId: number): Promise<string> {
        const socialLink = await this.findById(socialLinkId, {
            include: ['socialNetworkType'],
        });

        if (!socialLink.socialNetworkType?.urlPattern) {
            return socialLink.value;
        }

        return socialLink.socialNetworkType.urlPattern.replace('{value}', socialLink.value);
    }
}
