import { model, property, belongsTo } from '@loopback/repository';
import { UserModifiableEntity } from './user-modifiable-entity.model';
import { Card, CardWithRelations } from './card.model';

@model({
    name: 'card_styles',
})
export class CardStyle extends UserModifiableEntity {
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
        name: 'primary_color',
        default: '#007bff',
    })
    primaryColor: string;

    @property({
        type: 'string',
        name: 'secondary_color',
        default: '#6c757d',
    })
    secondaryColor: string;

    @property({
        type: 'string',
        name: 'background_color',
        default: '#ffffff',
    })
    backgroundColor: string;

    @property({
        type: 'string',
        name: 'text_color',
        default: '#212529',
    })
    textColor: string;

    @property({
        type: 'string',
        name: 'accent_color',
        default: '#28a745',
    })
    accentColor: string;

    @property({
        type: 'string',
        name: 'font_family',
        default: 'Inter',
    })
    fontFamily: string;

    @property({
        type: 'string',
        name: 'font_size',
        default: 'medium',
    })
    fontSize: string;

    @property({
        type: 'string',
        name: 'layout_template',
        default: 'modern',
    })
    layoutTemplate: string;

    @property({
        type: 'string',
        name: 'border_radius',
        default: 'medium',
    })
    borderRadius: string;

    constructor(data?: Partial<CardStyle>) {
        super(data);
    }
}

export interface CardStyleRelations {
    card: CardWithRelations;
}

export type CardStyleWithRelations = CardStyle & CardStyleRelations;
