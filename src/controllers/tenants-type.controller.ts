import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where } from '@loopback/repository';
import { post, param, get, getModelSchemaRef, patch, put, del, requestBody, response } from '@loopback/rest';
import { TenantsType } from '../models';
import { TenantsTypeRepository } from '../repositories';
import { authenticate, STRATEGY } from 'loopback4-authentication';
import { authorize } from 'loopback4-authorization';
import { PermissionKey } from '../modules/auth/permission-key.enum';

export class TenantsTypeController {
    constructor(
        @repository(TenantsTypeRepository)
        public tenantsTypeRepository: TenantsTypeRepository
    ) {}

    @post('/tenants-types')
    @response(200, {
        description: 'TenantsType model instance',
        content: { 'application/json': { schema: getModelSchemaRef(TenantsType) } },
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(TenantsType, {
                        title: 'NewTenantsType',
                        exclude: ['id'],
                    }),
                },
            },
        })
        tenantsType: Omit<TenantsType, 'id'>
    ): Promise<TenantsType> {
        return this.tenantsTypeRepository.create(tenantsType);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenantUser],
    })
    @get('/tenants-types/count')
    @response(200, {
        description: 'TenantsType model count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async count(@param.where(TenantsType) where?: Where<TenantsType>): Promise<Count> {
        return this.tenantsTypeRepository.count(where);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenantUser],
    })
    @get('/tenants-types')
    @response(200, {
        description: 'Array of TenantsType model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(TenantsType, { includeRelations: true }),
                },
            },
        },
    })
    async find(@param.filter(TenantsType) filter?: Filter<TenantsType>): Promise<TenantsType[]> {
        return this.tenantsTypeRepository.find(filter);
    }

    @patch('/tenants-types')
    @response(200, {
        description: 'TenantsType PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async updateAll(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(TenantsType, { partial: true }),
                },
            },
        })
        tenantsType: TenantsType,
        @param.where(TenantsType) where?: Where<TenantsType>
    ): Promise<Count> {
        return this.tenantsTypeRepository.updateAll(tenantsType, where);
    }

    @get('/tenants-types/{id}')
    @response(200, {
        description: 'TenantsType model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(TenantsType, { includeRelations: true }),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(TenantsType, { exclude: 'where' }) filter?: FilterExcludingWhere<TenantsType>
    ): Promise<TenantsType> {
        return this.tenantsTypeRepository.findById(id, filter);
    }

    @patch('/tenants-types/{id}')
    @response(204, {
        description: 'TenantsType PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(TenantsType, { partial: true }),
                },
            },
        })
        tenantsType: TenantsType
    ): Promise<void> {
        await this.tenantsTypeRepository.updateById(id, tenantsType);
    }

    @put('/tenants-types/{id}')
    @response(204, {
        description: 'TenantsType PUT success',
    })
    async replaceById(@param.path.number('id') id: number, @requestBody() tenantsType: TenantsType): Promise<void> {
        await this.tenantsTypeRepository.replaceById(id, tenantsType);
    }

    @del('/tenants-types/{id}')
    @response(204, {
        description: 'TenantsType DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.tenantsTypeRepository.deleteById(id);
    }
}
