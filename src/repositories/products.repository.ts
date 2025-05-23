import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { PgdbDataSource } from '../datasources';
import { Products, ProductsRelations } from '../models';

export class ProductsRepository extends DefaultCrudRepository<
    Products,
    typeof Products.prototype.id,
    ProductsRelations
> {
    constructor(@inject('datasources.pgdb') dataSource: PgdbDataSource) {
        super(Products, dataSource);
        this.modelClass.observe('before save', async (context) => {
            if (context.instance) {
                context.instance.modifiedOn = new Date();
            }
            if (context.data) {
                context.data.modifiedOn = new Date();
            }
        });
    }
}
