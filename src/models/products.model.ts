import { Entity, model, property } from '@loopback/repository';
import { BaseEntity } from './base-entity.model';

@model({
    name: 'products',
})
export class Products extends BaseEntity {
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
    })
    description?: string;

    @property({
        type: 'number',
        required: true,
    })
    price: number;

    constructor(data?: Partial<Products>) {
        super(data);
    }
}

export interface ProductsRelations {
    // describe navigational properties here
}

export type ProductsWithRelations = Products & ProductsRelations;
