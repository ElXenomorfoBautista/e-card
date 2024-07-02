import { Getter, inject } from '@loopback/core';
import { AuthenticationBindings } from 'loopback4-authentication';

import { PgdbDataSource } from '../datasources';
import { Tenant, TenantsType } from '../models';
import { AuthUser } from '../modules/auth';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';
import { repository, BelongsToAccessor } from '@loopback/repository';
import { TenantsTypeRepository } from './tenants-type.repository';

export class TenantRepository extends DefaultUserModifyCrudRepository<Tenant, typeof Tenant.prototype.id> {
    public readonly tenantsType: BelongsToAccessor<TenantsType, typeof Tenant.prototype.id>;

    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>,
        @repository.getter('TenantsTypeRepository') protected tenantsTypeRepositoryGetter: Getter<TenantsTypeRepository>
    ) {
        super(Tenant, dataSource, getCurrentUser);
        this.tenantsType = this.createBelongsToAccessorFor('tenantsType', tenantsTypeRepositoryGetter);
        this.registerInclusionResolver('tenantsType', this.tenantsType.inclusionResolver);
    }
}
