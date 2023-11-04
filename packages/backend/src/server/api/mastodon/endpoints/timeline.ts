import type { FastifyInstance } from 'fastify';
import megalodon, { Entity, MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleCallService.js'
import { statusModel } from './status.js';
import Autolinker from 'autolinker';

export function toLimitToInt(q: any) {
    if (q.limit) {
        if (typeof q.limit === 'string') q.limit = parseInt(q.limit, 10)
    } else {
        q.limit = 40
    }
    if (q.offset) if (typeof q.offset === 'string') q.offset = parseInt(q.offset, 10)
    return q
}

export function toTextWithReaction(status: Entity.Status[], host: string) {
    return status.map((t) => {
        if (!t) return statusModel(null, null, [], 'no content')
        t.quote = null as any
        if (!t.emoji_reactions) return t
        if (t.reblog) t.reblog = toTextWithReaction([t.reblog], host)[0]
        const reactions = t.emoji_reactions.map((r) => {
            const emojiNotation = r.url ? `:${r.name.replace('@.', '')}:` : r.name
            return `${emojiNotation} (${r.count}${r.me ? `* ` : ''})`
        });
        const reaction = t.emoji_reactions as Entity.Reaction[]
        for (const r of reaction) {
            if (!r.url) continue
            const targetOnEmoji = t.emojis.find((e) => {
                return e.shortcode.replace(/\./g, '').replace(/@/g, '').replace(/-/g, '') === r.name
            })
            t.emoji_reactions = t.emoji_reactions.map((er) => {
                if (er.name === r.name) {
                    const { count, me, name } = er
                    return {
                        count,
                        me,
                        name,
                        url: targetOnEmoji?.url || er.url,
                        static_url: targetOnEmoji?.static_url || er.static_url
                    }
                } else {
                    return er
                }
            })
        }
        const isMe = reaction.findIndex((r) => r.me) > -1
        const total = reaction.reduce((sum, reaction) => sum + reaction.count, 0)
        t.favourited = isMe
        t.favourites_count = total
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
        replaceFn: function (match) {
            switch (match.type) {
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
    });
}

export function apiTimelineMastodon(fastify: FastifyInstance): void {
    fastify.get('/api/v1/timelines/public', async (request, reply) => {
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
    fastify.get<{ Params: { hashtag: string } }>('/api/v1/timelines/tag/:hashtag', async (request, reply) => {
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
    fastify.get('/api/v1/timelines/home', async (request, reply) => {
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
    fastify.get<{ Params: { listId: string } }>('/api/v1/timelines/list/:listId', async (request, reply) => {
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
    fastify.get('/api/v1/conversations', async (request, reply) => {
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
    fastify.get('/api/v1/lists', async (request, reply) => {
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
    fastify.get<{ Params: { id: string } }>('/api/v1/lists/:id', async (request, reply) => {
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
    fastify.post('/api/v1/lists', async (request, reply) => {
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
    fastify.put<{ Params: { id: string } }>('/api/v1/lists/:id', async (request, reply) => {
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
    fastify.delete<{ Params: { id: string } }>('/api/v1/lists/:id', async (request, reply) => {
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
    fastify.get<{ Params: { id: string } }>('/api/v1/lists/:id/accounts', async (request, reply) => {
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
    fastify.post<{ Params: { id: string } }>('/api/v1/lists/:id/accounts', async (request, reply) => {
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
    fastify.delete<{ Params: { id: string } }>('/api/v1/lists/:id/accounts', async (request, reply) => {
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