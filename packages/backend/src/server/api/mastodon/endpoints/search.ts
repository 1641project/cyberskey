import type { FastifyInstance } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleService.js';


export function apiSearchMastodon(fastify: FastifyInstance): void {
    fastify.get('/v1/search', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const query: any = request.query
            const type = query.type || ''
            const data = await client.search(query.q, type, query);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    
}