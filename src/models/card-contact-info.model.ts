import { model, property, belongsTo } from '@loopback/repository';
import { UserModifiableEntity } from './user-modifiable-entity.model';
import { Card, CardWithRelations } from './card.model';

@model({
    name: 'card_contact_info',
})
export class CardContactInfo extends UserModifiableEntity {
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

    @property({
        type: 'string',
        name: 'contact_type',
        required: true,
        jsonSchema: {
            enum: ['phone', 'email', 'address', 'website'],
        },
    })
    contactType: 'phone' | 'email' | 'address' | 'website';

    @property({
        type: 'string',
    })
    label?: string;

    @property({
        type: 'string',
        required: true,
    })
    value: string;

    @property({
        type: 'boolean',
        name: 'is_primary',
        default: false,
    })
    isPrimary: boolean;

    @property({
        type: 'number',
        name: 'display_order',
        default: 0,
    })
    displayOrder: number;

    constructor(data?: Partial<CardContactInfo>) {
        super(data);
    }
}

export interface CardContactInfoRelations {
    card: CardWithRelations;
}

export type CardContactInfoWithRelations = CardContactInfo & CardContactInfoRelations;
