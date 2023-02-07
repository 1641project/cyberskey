import type { FastifyInstance } from 'fastify';
import megalodon, { Entity, MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleService.js'
import { statusModel } from './status.js';

export function toLimitToInt(q: any) {
    if (q.limit) if (typeof q.limit === 'string') q.limit = parseInt(q.limit, 10)
    return q
}

export function toTextWithReaction(status: Entity.Status[], host: string) {
    return status.map((t) => {
        const reactions = t.emoji_reactions.map((r) => `${r.name.replace('@.', '')} (${r.count}${r.me ? `* ` : ''})`);
        //t.emojis = getEmoji(t.content, host)
        t.content = `<p>${nl2br(escapeHTML(t.content))}</p><p>${reactions.join(', ')}</p>`
        return t
    })
}

export function apiTimelineMastodon(fastify: FastifyInstance): void {
    fastify.get('/v1/timelines/public', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getPublicTimeline(toLimitToInt(request.query));
            return toTextWithReaction(data.data, request.hostname);
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { hashtag: string } }>('/v1/timelines/tag/:hashtag', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getTagTimeline(request.params.hashtag, toLimitToInt(request.query));
            return toTextWithReaction(data.data, request.hostname);
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { hashtag: string } }>('/v1/timelines/home', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getHomeTimeline(toLimitToInt(request.query));
            return toTextWithReaction(data.data, request.hostname);
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { listId: string } }>('/v1/timelines/list/:listId', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getListTimeline(request.params.listId, toLimitToInt(request.query));
            return toTextWithReaction(data.data, request.hostname);
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/v1/conversations', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getConversationTimeline(toLimitToInt(request.query));
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/v1/lists', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getLists();
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/v1/lists/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getList(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post('/v1/lists', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.createList((request.query as any).title);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.put<{ Params: { id: string } }>('/v1/lists/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.updateList(request.params.id, request.query as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.delete<{ Params: { id: string } }>('/v1/lists/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.deleteList(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/v1/lists/:id/accounts', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getAccountsInList(request.params.id, request.query as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/v1/lists/:id/accounts', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.addAccountsToList(request.params.id, (request.query as any).account_ids);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.delete<{ Params: { id: string } }>('/v1/lists/:id/accounts', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.deleteAccountsFromList(request.params.id, (request.query as any).account_ids);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
}
function escapeHTML(str: string) {
    if (!str) {
        return ''
    }
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
function nl2br(str: string) {
    if (!str) {
        return ''
    }
    str = str.replace(/\r\n/g, '<br />')
    str = str.replace(/(\n|\r)/g, '<br />')
    return str
}