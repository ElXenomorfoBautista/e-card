import { model, property, belongsTo } from '@loopback/repository';
import { UserModifiableEntity } from './user-modifiable-entity.model';
import { Card, CardWithRelations } from './card.model';

@model({
    name: 'card_views',
})
export class CardView extends UserModifiableEntity {
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
        name: 'viewer_ip',
        postgresql: {
            dataType: 'inet',
        },
    })
    viewerIp?: string;

    @property({
        type: 'string',
        name: 'user_agent',
    })
    userAgent?: string;

    @property({
        type: 'string',
    })
    referrer?: string;

    @property({
        type: 'string',
    })
    country?: string;

    @property({
        type: 'string',
    })
    city?: string;

    @property({
        type: 'string',
        name: 'device_type',
        jsonSchema: {
            enum: ['mobile', 'desktop', 'tablet'],
        },
    })
    deviceType?: 'mobile' | 'desktop' | 'tablet';

    @property({
        type: 'date',
        name: 'viewed_at',
        default: () => new Date(),
    })
    viewedAt: string;

    constructor(data?: Partial<CardView>) {
        super(data);
    }
}

export interface CardViewRelations {
    card: CardWithRelations;
}

export type CardViewWithRelations = CardView & CardViewRelations;
