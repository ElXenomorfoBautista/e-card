import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where } from '@loopback/repository';
import { post, param, get, getModelSchemaRef, patch, put, del, requestBody, response } from '@loopback/rest';
import { Products } from '../models';
import { ProductsRepository } from '../repositories';
import { authorize } from 'loopback4-authorization';
import { PermissionKey } from '../modules/auth/permission-key.enum';

export class ProductsController {
    constructor(
        @repository(ProductsRepository)
        public productsRepository: ProductsRepository
    ) {}

    @authorize({ permissions: ['*'] })
    @post('/products')
    @response(200, {
        description: 'Products model instance',
        content: { 'application/json': { schema: getModelSchemaRef(Products) } },
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Products, {
                        title: 'NewProducts',
                        exclude: ['id'],
                    }),
                },
            },
        })
        products: Omit<Products, 'id'>
    ): Promise<Products> {
        return this.productsRepository.create(products);
    }

    @authorize({ permissions: ['*'] })
    @get('/products/count')
    @response(200, {
        description: 'Products model count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async count(@param.where(Products) where?: Where<Products>): Promise<Count> {
        return this.productsRepository.count(where);
    }

    @authorize({ permissions: ['*'] })
    @get('/products')
    @response(200, {
        description: 'Array of Products model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Products, { includeRelations: true }),
                },
            },
        },
    })
    async find(@param.filter(Products) filter?: Filter<Products>): Promise<Products[]> {
        return this.productsRepository.find(filter);
    }

    @authorize({ permissions: ['*'] })
    @patch('/products')
    @response(200, {
        description: 'Products PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
    })
    async updateAll(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Products, { partial: true }),
                },
            },
        })
        products: Products,
        @param.where(Products) where?: Where<Products>
    ): Promise<Count> {
        return this.productsRepository.updateAll(products, where);
    }

    @authorize({ permissions: ['*'] })
    @get('/products/{id}')
    @response(200, {
        description: 'Products model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Products, { includeRelations: true }),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Products, { exclude: 'where' }) filter?: FilterExcludingWhere<Products>
    ): Promise<Products> {
        return this.productsRepository.findById(id, filter);
    }

    @authorize({ permissions: ['*'] })
    @patch('/products/{id}')
    @response(204, {
        description: 'Products PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Products, { partial: true }),
                },
            },
        })
        products: Products
    ): Promise<void> {
        await this.productsRepository.updateById(id, products);
    }

    @authorize({ permissions: ['*'] })
    @put('/products/{id}')
    @response(204, {
        description: 'Products PUT success',
    })
    async replaceById(@param.path.number('id') id: number, @requestBody() products: Products): Promise<void> {
        await this.productsRepository.replaceById(id, products);
    }

    @authorize({ permissions: ['*'] })
    @del('/products/{id}')
    @response(204, {
        description: 'Products DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.productsRepository.deleteById(id);
    }
}
