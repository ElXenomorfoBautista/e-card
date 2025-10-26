import { BootMixin } from '@loopback/boot';
import { ApplicationConfig, createBindingFromClass } from '@loopback/core';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication } from '@loopback/rest';
import { RestExplorerBindings, RestExplorerComponent } from '@loopback/rest-explorer';
import { ServiceMixin } from '@loopback/service-proxy';
import * as dotenv from 'dotenv';
import * as dotenvExt from 'dotenv-extended';
import { AuthenticationComponent, Strategies } from 'loopback4-authentication';
import { AuthorizationBindings, AuthorizationComponent } from 'loopback4-authorization';
import * as path from 'path';

import {
    BearerTokenVerifyProvider,
    ClientPasswordVerifyProvider,
    GoogleOauth2VerifyProvider,
    LocalPasswordVerifyProvider,
    ResourceOwnerVerifyProvider,
} from './modules/auth';
import { MySequence } from './sequences/sequence';
import { JWTAuthenticationComponent } from '@loopback/authentication-jwt';
import { ErrorHandlerMiddlewareProvider } from './middlewares/error-handler.middleware';
import { MultiTenancyComponent } from './multi-tenancy/component';
import { AuthHandlerMiddlewareProvider } from './middlewares/auth-handler.middleware';

export class Loopback4Application extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
    constructor(options: ApplicationConfig = {}) {
        dotenv.config();
        dotenvExt.load({
            schema: '.env.example',
            errorOnMissing: false,
        });
        super(options);

        // Set up the custom sequence
        this.sequence(MySequence);

        // Set up default home page
        this.static('/', path.join(__dirname, '../public'));

        this.static('/uploads', path.join(__dirname, '../uploads'));

        // // Customize @loopback/rest-explorer configuration here
        this.bind(RestExplorerBindings.CONFIG).to({
            path: '/explorer',
        });

        this.component(RestExplorerComponent);

        // Add authentication component
        this.component(AuthenticationComponent);
        // Customize authentication verify handlers
        this.bind(Strategies.Passport.OAUTH2_CLIENT_PASSWORD_VERIFIER).toProvider(ClientPasswordVerifyProvider);
        this.bind(Strategies.Passport.LOCAL_PASSWORD_VERIFIER).toProvider(LocalPasswordVerifyProvider);
        this.bind(Strategies.Passport.BEARER_TOKEN_VERIFIER).toProvider(BearerTokenVerifyProvider);
        this.bind(Strategies.Passport.RESOURCE_OWNER_PASSWORD_VERIFIER).toProvider(ResourceOwnerVerifyProvider);
        this.bind(Strategies.Passport.GOOGLE_OAUTH2_VERIFIER).toProvider(GoogleOauth2VerifyProvider);

        // Add authorization component
        this.bind(AuthorizationBindings.CONFIG).to({
            allowAlwaysPaths: ['/explorer', '/uploads'],
        });
        this.component(AuthorizationComponent);

        this.component(JWTAuthenticationComponent);

        this.component(MultiTenancyComponent);

        //custom middlewares
        this.add(createBindingFromClass(ErrorHandlerMiddlewareProvider));
        this.add(createBindingFromClass(AuthHandlerMiddlewareProvider));

        this.projectRoot = __dirname;
        // Customize @loopback/boot Booter Conventions here
        this.bootOptions = {
            controllers: {
                // Customize ControllerBooter Conventions here
                dirs: ['controllers', 'modules'],
                extensions: ['.controller.js'],
                nested: true,
            },
            repositories: {
                dirs: ['repositories'],
                extensions: ['.repository.js'],
                nested: true,
            },
        };
    }
}
