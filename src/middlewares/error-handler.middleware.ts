import { inject, injectable, Next, Provider } from '@loopback/core';
import {
    asMiddleware,
    HttpErrors,
    LogError,
    Middleware,
    Response,
    MiddlewareContext,
    RestBindings,
    RestMiddlewareGroups,
} from '@loopback/rest';
import debugFactory from 'debug';
const debug = debugFactory('loopback:middleware:ErrorHandlerMiddlewareProvider');

@injectable(
    asMiddleware({
        group: 'validationError',
        upstreamGroups: RestMiddlewareGroups.SEND_RESPONSE,
        downstreamGroups: RestMiddlewareGroups.CORS,
    })
)
export class ErrorHandlerMiddlewareProvider implements Provider<Middleware> {
    constructor(
        @inject(RestBindings.SequenceActions.LOG_ERROR)
        protected logError: LogError
    ) {}

    async value() {
        const middleware: Middleware = async (ctx: MiddlewareContext, next: Next) => {
            try {
                // Locate or inject input parameters from the request context
                // const route: RouteEntry = await ctx.get(RestBindings.Operation.ROUTE);
                //const params: OperationArgs = await ctx.get(RestBindings.Operation.PARAMS);
                // const retVal = await this.invokeMethod(route, params);
                // Bind the return value to the request context
                // ctx.bind(RestBindings.Operation.RETURN_VALUE).to(retVal);
                return await next();
            } catch (err) {
                // Any error handling goes here
                return this.handleError(ctx, err);
            }
        };

        return middleware;
    }
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    async invokeMethod(route: any, params: any) {
        console.log(route);
        console.log(params);

        return 123;
    }

    handleError(context: MiddlewareContext, err: HttpErrors.HttpError): Response {
        debug('error handler');

        // We simply log the error although more complex scenarios can be performed
        // such as customizing errors for a specific endpoint
        this.logError(err, err.statusCode, context.request);
        throw err;
    }
}
