import { model, property, belongsTo } from '@loopback/repository';
import { UserModifiableEntity } from './user-modifiable-entity.model';
import { Card, CardWithRelations } from './card.model';
import { SocialNetworkType, SocialNetworkTypeWithRelations } from './social-network-type.model';

@model({
    name: 'card_social_links',
})
export class CardSocialLink extends UserModifiableEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @belongsTo(
        () => Card,
        { name: 'card' },
        {
            name: 'card_id',
            required: true,
        }
    )
    cardId: number;

    @belongsTo(
        () => SocialNetworkType,
        { name: 'socialNetworkType' },
        {
            name: 'social_network_type_id',
            required: true,
        }
    )
    socialNetworkTypeId: number;

    @property({
        type: 'string',
        required: true,
    })
    value: string;

    @property({
        type: 'number',
        name: 'display_order',
        default: 0,
    })
    displayOrder: number;

    constructor(data?: Partial<CardSocialLink>) {
        super(data);
    }
}

export interface CardSocialLinkRelations {
    card: CardWithRelations;
    socialNetworkType: SocialNetworkTypeWithRelations;
}

export type CardSocialLinkWithRelations = CardSocialLink & CardSocialLinkRelations;
