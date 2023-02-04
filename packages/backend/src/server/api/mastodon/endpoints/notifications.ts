import type { FastifyInstance } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleService.js';
function toLimitToInt(q: any) {
    if (q.limit) if (typeof q.limit === 'string') q.limit = parseInt(q.limit, 10)
    return q
}


export function apiNotificationsMastodon(fastify: FastifyInstance): void {
    fastify.get('/v1/notifications', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getNotifications(toLimitToInt(request.query));
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/v1/notification/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getNotification(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post('/v1/notifications/clear', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.dismissNotifications();
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/v1/notification/:id/dismiss', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.dismissNotification(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

}