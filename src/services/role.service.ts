import { BindingScope, injectable } from '@loopback/core';
import { RoleRepository } from '../repositories';
import { repository } from '@loopback/repository';
import { Role } from '../models';
import { HttpErrors } from '@loopback/rest';

@injectable({ scope: BindingScope.TRANSIENT })
export class RoleService {
    constructor(
        @repository(RoleRepository)
        public roleRepository: RoleRepository
    ) {}

    async findRole(roleId: number): Promise<Role> {
        const invalidRoleError = 'Invalid role or not found';
        if (!roleId) {
            throw new HttpErrors.Unauthorized(invalidRoleError);
        }
        const foundRole = await this.roleRepository.findById(roleId);
        if (!foundRole) {
            throw new HttpErrors.Unauthorized(invalidRoleError);
        }
        return foundRole;
    }
}
