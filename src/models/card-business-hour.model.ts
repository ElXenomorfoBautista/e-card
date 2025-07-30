import { model, property, belongsTo } from '@loopback/repository';
import { UserModifiableEntity } from './user-modifiable-entity.model';
import { Card, CardWithRelations } from './card.model';

@model({
    name: 'card_business_hours',
})
export class CardBusinessHour extends UserModifiableEntity {
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
        type: 'number',
        name: 'day_of_week',
        required: true,
        jsonSchema: {
            minimum: 0,
            maximum: 6,
            description: '0=Domingo, 1=Lunes, ..., 6=Sábado',
        },
    })
    dayOfWeek: number;

    @property({
        type: 'string',
        name: 'open_time',
        postgresql: {
            dataType: 'time',
        },
    })
    openTime?: string;

    @property({
        type: 'string',
        name: 'close_time',
        postgresql: {
            dataType: 'time',
        },
    })
    closeTime?: string;

    @property({
        type: 'boolean',
        name: 'is_closed',
        default: false,
    })
    isClosed: boolean;

    @property({
        type: 'string',
    })
    notes?: string;

    constructor(data?: Partial<CardBusinessHour>) {
        super(data);
    }
}

export interface CardBusinessHourRelations {
    card: CardWithRelations;
}

export type CardBusinessHourWithRelations = CardBusinessHour & CardBusinessHourRelations;
