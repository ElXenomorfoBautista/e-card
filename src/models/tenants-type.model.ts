import { model, property } from '@loopback/repository';
import { UserModifiableEntity } from './user-modifiable-entity.model';

@model({
    name: 'tenants_type',
})
export class TenantsType extends UserModifiableEntity {
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

    constructor(data?: Partial<TenantsType>) {
        super(data);
    }
}

export interface TenantsTypeRelations {
    // describe navigational properties here
}

export type TenantsTypeWithRelations = TenantsType & TenantsTypeRelations;
