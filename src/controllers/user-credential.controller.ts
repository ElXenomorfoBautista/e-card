import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where } from '@loopback/repository';
import {
    post,
    param,
    get,
    getModelSchemaRef,
    patch,
    put,
    del,
    requestBody,
    response,
    HttpErrors,
} from '@loopback/rest';
import { UserCredentials } from '../models';
import { UserCredentialsRepository } from '../repositories';
import { authenticate, STRATEGY } from 'loopback4-authentication';
import { authorize } from 'loopback4-authorization';
import { PermissionKey } from '../modules/auth/permission-key.enum';
import * as bcrypt from 'bcrypt';

//TODO: to use password hash overwrite in all methods.
export class UserCredentialController {
    constructor(
        @repository(UserCredentialsRepository)
        public userCredentialsRepository: UserCredentialsRepository
    ) {}

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.CreateAnyUser, PermissionKey.CreateTenantUser],
    })
    @post('/user-credentials')
    @response(200, {
        description: 'UserCredentials model instance',
        content: { 'application/json': { schema: getModelSchemaRef(UserCredentials) } },
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(UserCredentials, {
                        title: 'NewUserCredentials',
                        exclude: ['id'],
                    }),
                },
            },
        })
        userCredentials: Omit<UserCredentials, 'id'>
    ): Promise<UserCredentials> {
        return this.userCredentialsRepository.create(userCredentials);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenantUser],
    })
    @get('/user-credentials/count')
    @response(200, {
        description: 'UserCredentials model count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async count(@param.where(UserCredentials) where?: Where<UserCredentials>): Promise<Count> {
        return this.userCredentialsRepository.count(where);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenantUser],
    })
    @get('/user-credentials')
    @response(200, {
        description: 'Array of UserCredentials model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(UserCredentials, { includeRelations: true }),
                },
            },
        },
    })
    async find(@param.filter(UserCredentials) filter?: Filter<UserCredentials>): Promise<UserCredentials[]> {
        return this.userCredentialsRepository.find(filter);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateAnyUser, PermissionKey.UpdateOwnUser, PermissionKey.UpdateTenantUser],
    })
    @patch('/user-credentials')
    @response(200, {
        description: 'UserCredentials PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async updateAll(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(UserCredentials, { partial: true }),
                },
            },
        })
        userCredentials: UserCredentials,
        @param.where(UserCredentials) where?: Where<UserCredentials>
    ): Promise<Count> {
        return this.userCredentialsRepository.updateAll(userCredentials, where);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenantUser],
    })
    @get('/user-credentials/{id}')
    @response(200, {
        description: 'UserCredentials model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(UserCredentials, { includeRelations: true }),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(UserCredentials, { exclude: 'where' }) filter?: FilterExcludingWhere<UserCredentials>
    ): Promise<UserCredentials> {
        return this.userCredentialsRepository.findById(id, filter);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateAnyUser, PermissionKey.UpdateOwnUser, PermissionKey.UpdateTenantUser],
    })
    @patch('/user-credentials/{id}')
    @response(204, {
        description: 'UserCredentials PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(UserCredentials, { partial: true }),
                },
            },
        })
        userCredentials: UserCredentials
    ): Promise<void> {
        try {
            if (userCredentials.password) {
                const hashedPassword = await bcrypt.hash(
                    userCredentials.password as string,
                    Number(process.env.PASSWORD_SALT_ROUNDS)
                );
                const credentials = new UserCredentials({
                    password: hashedPassword,
                });
                await this.userCredentialsRepository.updateById(id, credentials);
            } else {
                await this.userCredentialsRepository.updateById(id, userCredentials);
            }
        } catch (err) {
            throw new HttpErrors.UnprocessableEntity('Error while hashing password');
        }
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateAnyUser, PermissionKey.UpdateOwnUser, PermissionKey.UpdateTenantUser],
    })
    @put('/user-credentials/{id}')
    @response(204, {
        description: 'UserCredentials PUT success',
    })
    async replaceById(
        @param.path.number('id') id: number,
        @requestBody() userCredentials: UserCredentials
    ): Promise<void> {
        await this.userCredentialsRepository.replaceById(id, userCredentials);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.DeleteAnyUser, PermissionKey.DeleteTenantUser],
    })
    @del('/user-credentials/{id}')
    @response(204, {
        description: 'UserCredentials DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.userCredentialsRepository.deleteById(id);
    }
}
