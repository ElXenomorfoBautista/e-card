import { inject, Getter } from '@loopback/core';
import { AuthenticationBindings } from 'loopback4-authentication';

import { PgdbDataSource } from '../datasources';
import { SocialNetworkType, SocialNetworkTypeRelations } from '../models';
import { AuthUser } from '../modules/auth';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';

export class SocialNetworkTypeRepository extends DefaultUserModifyCrudRepository<
    SocialNetworkType,
    typeof SocialNetworkType.prototype.id,
    SocialNetworkTypeRelations
> {
    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>
    ) {
        super(SocialNetworkType, dataSource, getCurrentUser);
    }

    // Obtener solo redes sociales activas
    async findActive() {
        return this.find({
            where: { isActive: true },
            order: ['name ASC'],
        });
    }

    // Buscar por nombre
    async findByName(name: string) {
        return this.findOne({
            where: { name, isActive: true },
        });
    }
}
