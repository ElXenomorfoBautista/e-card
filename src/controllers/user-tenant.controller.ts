import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where } from '@loopback/repository';
import { post, param, get, getModelSchemaRef, patch, put, del, requestBody, response } from '@loopback/rest';
import { UserTenant } from '../models';
import { UserTenantRepository } from '../repositories';
import { authenticate, STRATEGY } from 'loopback4-authentication';
import { PermissionKey } from '../modules/auth/permission-key.enum';
import { authorize } from 'loopback4-authorization';

export class UserTenantController {
    constructor(
        @repository(UserTenantRepository)
        public userTenantRepository: UserTenantRepository
    ) {}

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: [PermissionKey.CreateRole] })
    @post('/user-tenants')
    @response(200, {
        description: 'UserTenant model instance',
        content: { 'application/json': { schema: getModelSchemaRef(UserTenant) } },
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(UserTenant, {
                        title: 'NewUserTenant',
                        exclude: ['id'],
                    }),
                },
            },
        })
        userTenant: Omit<UserTenant, 'id'>
    ): Promise<UserTenant> {
        return this.userTenantRepository.create(userTenant);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: [PermissionKey.ViewRole] })
    @get('/user-tenants/count')
    @response(200, {
        description: 'UserTenant model count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async count(@param.where(UserTenant) where?: Where<UserTenant>): Promise<Count> {
        return this.userTenantRepository.count(where);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: [PermissionKey.ViewRole] })
    @get('/user-tenants')
    @response(200, {
        description: 'Array of UserTenant model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(UserTenant, { includeRelations: true }),
                },
            },
        },
    })
    async find(@param.filter(UserTenant) filter?: Filter<UserTenant>): Promise<UserTenant[]> {
        return this.userTenantRepository.find(filter);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: [PermissionKey.UpdateRole] })
    @patch('/user-tenants')
    @response(200, {
        description: 'UserTenant PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async updateAll(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(UserTenant, { partial: true }),
                },
            },
        })
        userTenant: UserTenant,
        @param.where(UserTenant) where?: Where<UserTenant>
    ): Promise<Count> {
        return this.userTenantRepository.updateAll(userTenant, where);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: [PermissionKey.ViewRole] })
    @get('/user-tenants/{id}')
    @response(200, {
        description: 'UserTenant model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(UserTenant, { includeRelations: true }),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(UserTenant, { exclude: 'where' }) filter?: FilterExcludingWhere<UserTenant>
    ): Promise<UserTenant> {
        return this.userTenantRepository.findById(id, filter);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: [PermissionKey.UpdateRole] })
    @patch('/user-tenants/{id}')
    @response(204, {
        description: 'UserTenant PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(UserTenant, { partial: true }),
                },
            },
        })
        userTenant: UserTenant
    ): Promise<void> {
        await this.userTenantRepository.updateById(id, userTenant);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: [PermissionKey.UpdateRole] })
    @put('/user-tenants/{id}')
    @response(204, {
        description: 'UserTenant PUT success',
    })
    async replaceById(@param.path.number('id') id: number, @requestBody() userTenant: UserTenant): Promise<void> {
        await this.userTenantRepository.replaceById(id, userTenant);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({ permissions: [PermissionKey.DeleteRole] })
    @del('/user-tenants/{id}')
    @response(204, {
        description: 'UserTenant DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.userTenantRepository.deleteById(id);
    }
}
