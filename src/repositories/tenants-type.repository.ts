import { Getter, inject } from '@loopback/core';
import { PgdbDataSource } from '../datasources';
import { TenantsType, TenantsTypeRelations } from '../models';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';
import { AuthenticationBindings } from '@loopback/authentication';
import { AuthUser } from '../modules/auth';

export class TenantsTypeRepository extends DefaultUserModifyCrudRepository<
    TenantsType,
    typeof TenantsType.prototype.id,
    TenantsTypeRelations
> {
    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>
    ) {
        super(TenantsType, dataSource, getCurrentUser);
    }
}
