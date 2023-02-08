import type { FastifyInstance } from 'fastify';
import megalodon, { Entity, MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleService.js'
import { statusModel } from './status.js';
import Autolinker from 'autolinker';

export function toLimitToInt(q: any) {
    if (q.limit) if (typeof q.limit === 'string') q.limit = parseInt(q.limit, 10)
    return q
}

export function toTextWithReaction(status: Entity.Status[], host: string) {
    return status.map((t) => {
        if (!t) return statusModel(null, null, [], 'no content')
        if (!t.emoji_reactions) return t
        const reactions = t.emoji_reactions.map((r) => `${r.name.replace('@.', '')} (${r.count}${r.me ? `* ` : ''})`);
        //t.emojis = getEmoji(t.content, host)
        t.content = `<p>${autoLinker(t.content, host)}</p><p>${reactions.join(', ')}</p>`
        return t
    })
}
export function autoLinker(input: string, host: string) {
    return Autolinker.link(input, {
        hashtag: 'twitter',
        mention: 'twitter',
        email: false,
        stripPrefix: false,
        replaceFn : function (match) {
            switch(match.type) {
                case 'url':
                    return true
                case 'mention':
                    console.log("Mention: ", match.getMention());
                    console.log("Mention Service Name: ", match.getServiceName());
                    return `<a href="https://${host}/@${encodeURIComponent(match.getMention())}" target="_blank">@${match.getMention()}</a>`;
                case 'hashtag':
                    console.log("Hashtag: ", match.getHashtag());
                    return `<a href="https://${host}/tags/${encodeURIComponent(match.getHashtag())}" target="_blank">#${match.getHashtag()}</a>`;
            }
            return false
        }
    } );
}

export function apiTimelineMastodon(fastify: FastifyInstance): void {
    fastify.get('/v1/timelines/public', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const query: any = request.query
            const data = query.local ? await client.getLocalTimeline(toLimitToInt(query)) : await client.getPublicTimeline(toLimitToInt(query));
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