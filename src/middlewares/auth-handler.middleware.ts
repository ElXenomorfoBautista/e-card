// Copyright IBM Corp. and LoopBack contributors 2020. All Rights Reserved.
// Node module: @loopback/example-multi-tenancy
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { inject, injectable, Provider } from '@loopback/core';
import {
    asMiddleware,
    FindRoute,
    HttpErrors,
    InvokeMethod,
    Middleware,
    ParseParams,
    Reject,
    RequestContext,
    RestBindings,
    Send,
} from '@loopback/rest';
import { AuthenticateFn, AuthenticationBindings } from 'loopback4-authentication';
import { AuthorizationBindings, AuthorizeErrorKeys, AuthorizeFn } from 'loopback4-authorization';
import debugFactory from 'debug';
import { AuthUser } from '../modules/auth';
import { AuthClient } from '../models';
const debug = debugFactory('loopback:auth-handler middleware');

const SequenceActions = RestBindings.SequenceActions;

/**
 * Provides the multi-tenancy action for a sequence
 */
@injectable(
    asMiddleware({
        group: 'auth',
        downstreamGroups: 'findRoute',
    })
)
export class AuthHandlerMiddlewareProvider implements Provider<Middleware> {
    constructor(
        @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
        @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
        @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
        @inject(SequenceActions.SEND) public send: Send,
        @inject(SequenceActions.REJECT) public reject: Reject,

        @inject(AuthenticationBindings.USER_AUTH_ACTION)
        protected authenticateRequest: AuthenticateFn<AuthUser>,
        @inject(AuthenticationBindings.CLIENT_AUTH_ACTION)
        protected authenticateRequestClient: AuthenticateFn<AuthClient>,
        @inject(AuthorizationBindings.AUTHORIZE_ACTION)
        protected checkAuthorisation: AuthorizeFn
    ) {}

    value(): Middleware {
        return async (ctx, next) => {
            await this.action(ctx as RequestContext);
            return next();
        };
    }

    /**
     * The implementation of authenticate() sequence action.
     * @param request - The incoming request provided by the REST layer
     */
    async action(requestCtx: RequestContext) {
        const { request, response } = requestCtx;
        const route = this.findRoute(request);
        debug('route %s', route);
        const args = await this.parseParams(request, route);
        request.body = args[args.length - 1];
        await this.authenticateRequestClient(request);
        const authUser: AuthUser = await this.authenticateRequest(request, response);
        const isAccessAllowed: boolean = await this.checkAuthorisation(authUser?.permissions, request);
        debug('isAccessAllowed %s', isAccessAllowed);
        if (!isAccessAllowed) {
            throw new HttpErrors.Forbidden(AuthorizeErrorKeys.NotAllowedAccess);
        }

        const result = await this.invoke(route, args);
        this.send(response, result);
    }
}
