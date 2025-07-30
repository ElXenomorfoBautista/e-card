import { model, property } from '@loopback/repository';
import { UserModifiableEntity } from './user-modifiable-entity.model';

@model({
    name: 'social_network_types',
})
export class SocialNetworkType extends UserModifiableEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'string',
        required: true,
    })
    name: string;

    @property({
        type: 'string',
        name: 'icon_class',
    })
    iconClass?: string;

    @property({
        type: 'string',
        name: 'url_pattern',
    })
    urlPattern?: string;

    @property({
        type: 'string',
        name: 'placeholder_text',
    })
    placeholderText?: string;

    @property({
        type: 'string',
        name: 'input_type',
        default: 'text',
    })
    inputType: string;

    @property({
        type: 'boolean',
        name: 'is_active',
        default: true,
    })
    isActive: boolean;

    constructor(data?: Partial<SocialNetworkType>) {
        super(data);
    }
}

export interface SocialNetworkTypeRelations {
    // describe navigational properties here
}

export type SocialNetworkTypeWithRelations = SocialNetworkType & SocialNetworkTypeRelations;
