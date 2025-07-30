import { model, property, belongsTo, hasOne, hasMany } from '@loopback/repository';
import { UserModifiableEntity } from './user-modifiable-entity.model';
import { User, UserWithRelations } from './user.model';
import { Tenant, TenantWithRelations } from './tenant.model';
import { CardStyle, CardStyleWithRelations } from './card-style.model';
import { CardContactInfo, CardContactInfoWithRelations } from './card-contact-info.model';
import { CardSocialLink, CardSocialLinkWithRelations } from './card-social-link.model';
import { CardBusinessHour, CardBusinessHourWithRelations } from './card-business-hour.model';
import { CardView, CardViewWithRelations } from './card-view.model';

@model({
    name: 'cards',
})
export class Card extends UserModifiableEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @belongsTo(
        () => User,
        { name: 'user' },
        {
            name: 'user_id',
            required: true,
        }
    )
    userId: number;

    @belongsTo(
        () => Tenant,
        { name: 'tenant' },
        {
            name: 'tenant_id',
            required: true,
        }
    )
    tenantId: number;

    @belongsTo(
        () => Card,
        { name: 'duplicatedFrom' },
        {
            name: 'duplicated_from_id',
            required: false,
        }
    )
    duplicatedFromId?: number;

    @property({
        type: 'string',
        required: true,
        index: {
            unique: true,
        },
    })
    slug: string;

    @property({
        type: 'string',
        required: true,
    })
    title: string;

    @property({
        type: 'string',
    })
    profession?: string;

    @property({
        type: 'string',
    })
    description?: string;

    @property({
        type: 'string',
        name: 'logo_url',
    })
    logoUrl?: string;

    @property({
        type: 'boolean',
        name: 'is_active',
        default: true,
    })
    isActive: boolean;

    @property({
        type: 'string',
        name: 'qr_code_url',
    })
    qrCodeUrl?: string;

    @property({
        type: 'number',
        name: 'view_count',
        default: 0,
    })
    viewCount: number;

    // Relaciones
    @hasOne(() => CardStyle, { keyTo: 'cardId' })
    cardStyle: CardStyle;

    @hasMany(() => CardContactInfo, { keyTo: 'cardId' })
    contactInfo: CardContactInfo[];

    @hasMany(() => CardSocialLink, { keyTo: 'cardId' })
    socialLinks: CardSocialLink[];

    @hasMany(() => CardBusinessHour, { keyTo: 'cardId' })
    businessHours: CardBusinessHour[];

    @hasMany(() => CardView, { keyTo: 'cardId' })
    views: CardView[];

    @hasMany(() => Card, { keyTo: 'duplicatedFromId' })
    duplicatedCards: Card[];

    constructor(data?: Partial<Card>) {
        super(data);
    }
}

export interface CardRelations {
    user: UserWithRelations;
    tenant: TenantWithRelations;
    duplicatedFrom: CardWithRelations;
    cardStyle: CardStyleWithRelations;
    contactInfo: CardContactInfoWithRelations[];
    socialLinks: CardSocialLinkWithRelations[];
    businessHours: CardBusinessHourWithRelations[];
    views: CardViewWithRelations[];
    duplicatedCards: CardWithRelations[];
}

export type CardWithRelations = Card & CardRelations;
