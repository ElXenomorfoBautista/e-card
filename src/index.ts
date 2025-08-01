import { Loopback4Application } from './application';
import { ApplicationConfig } from '@loopback/core';

export { Loopback4Application };
export * from './multi-tenancy';

export async function main(options: ApplicationConfig = {}) {
    const app = new Loopback4Application(options);
    await app.boot();
    await app.start();
    //  custom info

    /*
     app.api({
    openapi: '3.0.0',
    info: {
      title: 'string',
      description: 'string',
      termsOfService: 'string',
      version: 'string',
    },
    servers: [],
    paths: [],
    tags: [],
    externalDocs: {
      url: 'string',
    },
  }); */

    const url = app.restServer.url;
    console.log(`Server is running at ${url}`);
    console.log(`Try ${url}/ping`);

    return app;
}

if (require.main === module) {
    // Run the application
    const config: ApplicationConfig = {
        rest: {
            cors: {},
            port: +(process.env.PORT ?? 3000),
            host: process.env.HOST,
            // The `gracePeriodForClose` provides a graceful close for http/https
            // servers with keep-alive clients. The default value is `Infinity`
            // (don't force-close). If you want to immediately destroy all sockets
            // upon stop, set its value to `0`.
            // See https://www.npmjs.com/package/stoppable
            gracePeriodForClose: 5000, // 5 seconds
            openApiSpec: {
                // useful when used with OpenAPI-to-GraphQL to locate your application
                setServersFromRequest: true,
            },
        },
    };
    main(config).catch((err) => {
        console.error('Cannot start the application.', err);
        process.exit(1);
    });
}
