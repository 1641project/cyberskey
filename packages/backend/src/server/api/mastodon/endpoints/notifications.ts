import type { FastifyInstance } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleCallService.js';
import { toTextWithReaction } from './timeline.js';
function toLimitToInt(q: any) {
    if (q.limit) if (typeof q.limit === 'string') q.limit = parseInt(q.limit, 10)
    return q
}


export function apiNotificationsMastodon(fastify: FastifyInstance): void {
    fastify.get('/api/v1/notifications', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getNotifications(toLimitToInt(request.query));
            const notfs = data.data;
            const ret = notfs.map((n) => {
                if(n.type !== 'follow' && n.type !== 'follow_request') {
                    if (n.type === 'reaction') n.type = 'favourite'
                    n.status = toTextWithReaction(n.status ? [n.status] : [], request.hostname)[0]
                    return n
                } else {
                    return n
                }
            })
            return ret
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/notification/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const dataRaw = await client.getNotification(request.params.id);
            const data = dataRaw.data;
            if(data.type !== 'follow' && data.type !== 'follow_request') {
                if (data.type === 'reaction') data.type = 'favourite'
                return toTextWithReaction([data as any], request.hostname)[0]
            } else {
                return data
            }
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post('/api/v1/notifications/clear', async (request, reply) => {
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
    fastify.post<{ Params: { id: string } }>('/api/v1/notification/:id/dismiss', async (request, reply) => {
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