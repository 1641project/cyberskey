import type { FastifyInstance } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleCallService.js'

export function apiFilterMastodon(fastify: FastifyInstance): void {
    fastify.get('/api/:vx/filters', async (request, reply) => {
        return []
    });
    fastify.get('/api/v1/featured_tags', async (request, reply) => {
        return []
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/filters/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getFilter(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post('/api/v1/filters', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const body: any = request.body
            const data = await client.createFilter(body.phrase, body.context, body);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/filters/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const body: any = request.body
            const data = await client.updateFilter(request.params.id, body.phrase, body.context);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.delete<{ Params: { id: string } }>('/api/v1/filters/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const body: any = request.body
            const data = await client.deleteFilter(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

}