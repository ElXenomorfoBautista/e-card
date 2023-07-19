// Copyright IBM Corp. and LoopBack contributors 2020. All Rights Reserved.
// Node module: @loopback/example-multi-tenancy
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { RequestContext } from '@loopback/rest';
import debugFactory from 'debug';
import { MultiTenancyStrategy, Tenant } from '../types';
import { BaseStrategy } from './base-strategy';

const debug = debugFactory('loopback:multi-tenancy:strategy:subdomain');
/**
 * Use `subdomain` to identify the tenant id
 */
export class SubDomainStrategy extends BaseStrategy implements MultiTenancyStrategy {
    name = 'subdomain';

    identifyTenant(requestContext: RequestContext) {
        const host = requestContext.request.headers.host;
        debug('host %s', host);
        return this.mapHostToTenant(host);
    }

    mapHostToTenant(host: string | undefined): Tenant | undefined {
        if (host == null) return undefined;
        const subdomain = host.split('.')[0];
        debug('tenant id for host is %s: ', subdomain);
        if (subdomain == null) return undefined;
        return { id: subdomain };
    }
}
