// Copyright IBM Corp. and LoopBack contributors 2020. All Rights Reserved.
// Node module: @loopback/example-multi-tenancy
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { MiddlewareSequence, RequestContext } from '@loopback/rest';
import { readFileSync } from 'fs';
import path from 'path';

export class MySequence extends MiddlewareSequence {
    // Inject the package.json file path
    async handle(context: RequestContext) {
        // Read package.json file to get the API version
        const pkgJsonPath = path.join(__dirname, '../../package.json');
        const packageJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
        const apiVersion = packageJson.version;
        // Set the API version in the response header
        context.response.setHeader('X-API-Version', apiVersion);
        // Proceed to the next middleware
        await super.handle(context);
    }
}