import { Count, CountSchema, Filter, repository, Where } from '@loopback/repository';
import {
    del,
    get,
    getFilterSchemaFor,
    getWhereSchemaFor,
    param,
    patch,
    post,
    put,
    requestBody,
    HttpErrors,
} from '@loopback/rest';
import { authenticate, STRATEGY } from 'loopback4-authentication';
import { authorize } from 'loopback4-authorization';
import { User } from '../../models';
import { UserRepository, UserTenantRepository } from '../../repositories';
import { PermissionKey } from '../auth/permission-key.enum';
import { inject } from '@loopback/context';
import { MultiTenancyBindings, Tenant } from '../../multi-tenancy';
import debugFactory from 'debug';
import { RoleService, UserService } from '../../services';
const debug = debugFactory('loopback:controller:user');

export class UserController {
    constructor(
        @repository(UserRepository)
        public userRepository: UserRepository,
        @repository(UserTenantRepository)
        public userTenantRepo: UserTenantRepository,
        @inject('services.UserService')
        private userService: UserService,
        @inject(MultiTenancyBindings.CURRENT_TENANT, { optional: true })
        private tenant?: Tenant,
        @inject('services.RoleService')
        public roleService?: RoleService
    ) { }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.CreateAnyUser, PermissionKey.CreateTenantUser],
    })
    @post('/users', {
        responses: {
            '200': {
                description: 'User model instance',
                content: { 'application/json': { schema: { 'x-ts-type': User } } },
            },
        },
    })
    async create(@requestBody() user: User): Promise<User> {
        debug('tenant %s', this.tenant);
        debug('user %s', user);
        if (!user.defaultTenant) {
            throw new HttpErrors.UnprocessableEntity(
                'User Id or Default Tenant Id is missing in the request parameters'
            );
        }
        const response = await this.userRepository.create(user);
        await this.userTenantRepo.createFromUser(response);
        return response;
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenantUser],
    })
    @get('/users/count', {
        responses: {
            '200': {
                description: 'User model count',
                content: { 'application/json': { schema: CountSchema } },
            },
        },
    })
    async count(@param.query.object('where', getWhereSchemaFor(User)) where?: Where<User>): Promise<Count> {
        return this.userRepository.count(where);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenantUser],
    })
    @get('/users', {
        responses: {
            '200': {
                description: 'Array of User model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': User } },
                    },
                },
            },
        },
    })
    async find(
        @param.query.object('filter', getFilterSchemaFor(User))
        filter?: Filter<User>
    ): Promise<User[]> {
        debug('tenant %s', this.tenant);
        return this.userRepository.find(filter);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateAnyUser, PermissionKey.UpdateOwnUser, PermissionKey.UpdateTenantUser],
    })
    @patch('/users', {
        responses: {
            '200': {
                description: 'User PATCH success count',
                content: { 'application/json': { schema: CountSchema } },
            },
        },
    })
    async updateAll(
        @requestBody() user: User,
        @param.query.object('where', getWhereSchemaFor(User)) where?: Where<User>
    ): Promise<Count> {
        return this.userRepository.updateAll(user, where);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenantUser],
    })
    @get('/users/{id}', {
        responses: {
            '200': {
                description: 'User model instance',
                content: { 'application/json': { schema: { 'x-ts-type': User } } },
            },
        },
    })
    async findById(@param.path.number('id') id: number): Promise<User> {
        return this.userRepository.findById(id);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateAnyUser, PermissionKey.UpdateOwnUser, PermissionKey.UpdateTenantUser],
    })
    @patch('/users/{id}', {
        responses: {
            '204': {
                description: 'User PATCH success',
            },
        },
    })
    async updateById(@param.path.number('id') id: number, @requestBody() user: User): Promise<void> {
        await this.userRepository.updateById(id, user);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.UpdateAnyUser, PermissionKey.UpdateOwnUser, PermissionKey.UpdateTenantUser],
    })
    @put('/users/{id}', {
        responses: {
            '204': {
                description: 'User PUT success',
            },
        },
    })
    async replaceById(@param.path.number('id') id: number, @requestBody() user: User): Promise<void> {
        await this.userRepository.replaceById(id, user);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.DeleteAnyUser, PermissionKey.DeleteTenantUser],
    })
    @del('/users/{id}', {
        responses: {
            '204': {
                description: 'User DELETE success',
            },
        },
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.userRepository.deleteById(id);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.CreateAnyUser, PermissionKey.CreateTenantUser],
    })
    @post('/users/send-card-email/{id}', {
        responses: {
            '200': {
                description: 'Email the users card.',
            }
        }
    })
    async sendEmail(@param.path.number('id') id: number): Promise<any> {
        return await this.userService.sendEmail(id);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.CreateAnyUser, PermissionKey.CreateTenantUser],
    })
    @post('/users/generate-qr-path/{id}', {
        responses: {
            '200': {
                description: 'Creates the users QR.',
            }
        }
    })
    async generateUserQR(@param.path.number('id') id: number): Promise<any> {
        return await this.userService.generateUserQR(id);
    }

    @authenticate(STRATEGY.BEARER)
    @authorize({
        permissions: [PermissionKey.CreateAnyUser, PermissionKey.CreateTenantUser],
    })
    @post('/users/generate-id-pdf/{id}', {
        responses: {
            '200': {
                description: 'Creates the users a PDF.',
            }
        }
    })
    async generateUserPDF(@param.path.number('id') id: number): Promise<any> {
        return await this.userService.generateCard(id);
    }
}
