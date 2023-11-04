import type { FastifyInstance } from 'fastify';
import { getClient } from '../ApiMastodonCompatibleCallService.js';
import fs from 'fs'
import { emojiRegex, emojiRegexAtStartToEnd } from '@/misc/emoji-regex.js';
import axios from 'axios';
import querystring from 'node:querystring'
import qs from 'qs'
function normalizeQuery(data: any) {
    const str = querystring.stringify(data);
    return qs.parse(str);
}
export function apiStatusMastodon(fastify: FastifyInstance): void {
    fastify.post('/api/v1/statuses', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            let body: any = request.body
            if ((!body.poll && body['poll[options][]']) || (!body.media_ids && body['media_ids[]'])) {
                body = normalizeQuery(body)
            }
            const text = body.status
            const removed = text.replace(/@\S+/g, '').replace(/\s|​/g, '')
            const isDefaultEmoji = emojiRegexAtStartToEnd.test(removed)
            const isCustomEmoji = /^:[a-zA-Z0-9@_]+:$/.test(removed)
            if (body.in_reply_to_id && isDefaultEmoji || isCustomEmoji) {
                const a = await client.createEmojiReaction(body.in_reply_to_id, removed)
                return a.data
            }
            if (body.in_reply_to_id && removed === '/unreact') {
                try {
                    const id = body.in_reply_to_id
                    const post = await client.getStatus(id)
                    const react = post.data.emoji_reactions.filter((e) => e.me)[0].name
                    const data = await client.deleteEmojiReaction(id, react);
                    return data.data;
                } catch (e: any) {
                    console.error(e)
                    reply.code(401);
                    return e.response.data;
                }
                return
            }
            if (!body.media_ids) delete body.media_ids
            if (body.media_ids && !body.media_ids.length) delete body.media_ids
            const { sensitive } = body
            body.sensitive = typeof sensitive === 'string' ? sensitive === 'true' : sensitive
            const data = await client.postStatus(text, body);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/statuses/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.delete<{ Params: { id: string } }>('/api/v1/statuses/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.deleteStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e.response.data, request.params.id)
            reply.code(401);
            return e.response.data;
        }
    });
    interface IReaction {
        id: string
        createdAt: string
        user: MisskeyEntity.User,
        type: string
    }
    fastify.get<{ Params: { id: string } }>('/api/v1/statuses/:id/context', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const id = request.params.id
            const data = await client.getStatusContext(id, request.query as any);
            const status = await client.getStatus(id);
            const reactionsAxios = await axios.get(`${BASE_URL}/api/notes/reactions?noteId=${id}`)
            const reactions: IReaction[] = reactionsAxios.data
            const text = reactions.map((r) => `${r.type.replace('@.', '')} ${r.user.username}`).join('<br />')
            data.data.descendants.unshift(statusModel(status.data.id, status.data.account.id, status.data.emojis, text))
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/statuses/:id/reblogged_by', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getStatusRebloggedBy(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/statuses/:id/favourited_by', async (request, reply) => {
        return []
    });
    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/favourite', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        const react = await getFirstReaction(BASE_URL, accessTokens);
        try {
            const a = await client.createEmojiReaction(request.params.id, react) as any;
            //const data = await client.favouriteStatus(request.params.id) as any;
            return a.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/statuses/:id/unfavourite', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        const react = await getFirstReaction(BASE_URL, accessTokens);
        try {
            const data = await client.deleteEmojiReaction(request.params.id, react);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

    fastify.post<{ Params: { id: string } }>('/api/v1/statuses/:id/reblog', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.reblogStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

    fastify.post<{ Params: { id: string } }>('/api/v1/statuses/:id/unreblog', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.unreblogStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

    fastify.post<{ Params: { id: string } }>('/api/v1/statuses/:id/bookmark', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.bookmarkStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

    fastify.post<{ Params: { id: string } }>('/api/v1/statuses/:id/unbookmark', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.unbookmarkStatus(request.params.id) as any;
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

    fastify.post<{ Params: { id: string } }>('/api/v1/statuses/:id/pin', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.pinStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

    fastify.post<{ Params: { id: string } }>('/api/v1/statuses/:id/unpin', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.unpinStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post('/api/v1/media', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const body: any = request.body
            if (!body) return {}
            const [filename, path] = body.file
            const image = fs.readFileSync(path);
            const data = await client.uploadMedia(image);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post('/api/v2/media', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const body: any = request.body
            if (!body) return {}
            const [filename, path] = body.file
            const image = fs.readFileSync(path);
            const data = await client.uploadMedia(image);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/media/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getMedia(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.put<{ Params: { id: string } }>('/api/v1/media/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.updateMedia(request.params.id, request.body as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/polls/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getPoll(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/polls/:id/votes', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.votePoll(request.params.id, (request.body as any).choices);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

}

async function getFirstReaction(BASE_URL: string, accessTokens: string | undefined) {
    const accessTokenArr = accessTokens?.split(' ') ?? [null];
    const accessToken = accessTokenArr[accessTokenArr.length - 1];
    let react = '👍'
    try {
        const api = await axios.post(`${BASE_URL}/api/i/registry/get-unsecure`, {
            scope: ['client', 'base'],
            key: 'reactions',
            i: accessToken
        })
        const reactRaw = api.data
        react = Array.isArray(reactRaw) ? api.data[0] : '👍'
        console.log(api.data)
        return react
    } catch (e) {
        return react
    }
}

export function statusModel(id: string | null, acctId: string | null, emojis: MastodonEntity.Emoji[], content: string) {
    const now = `1970-01-02T00:00:00.000Z`
    return {
        id: '9atm5frjhb',
        uri: 'https://http.cat/404', // ""
        url: 'https://http.cat/404', // "",
        account: {
            id: '9arzuvv0sw',
            username: 'ReactionBot',
            acct: 'ReactionBot',
            display_name: 'ReactionOfThisPost',
            locked: false,
            created_at: now,
            followers_count: 0,
            following_count: 0,
            statuses_count: 0,
            note: '',
            url: 'https://http.cat/404',
            avatar: 'https://http.cat/404',
            avatar_static: 'https://http.cat/404',
            header: 'https://http.cat/404', // ""
            header_static: 'https://http.cat/404', // ""
            emojis: [],
            fields: [],
            moved: null,
            bot: false,
        },
        in_reply_to_id: id,
        in_reply_to_account_id: acctId,
        reblog: null,
        content: `<p>${content}</p>`,
        plain_content: null,
        created_at: now,
        emojis: emojis,
        replies_count: 0,
        reblogs_count: 0,
        favourites_count: 0,
        favourited: false,
        reblogged: false,
        muted: false,
        sensitive: false,
        spoiler_text: '',
        visibility: 'public' as const,
        media_attachments: [],
        mentions: [],
        tags: [],
        card: null,
        poll: null,
        application: null,
        language: null,
        pinned: false,
        emoji_reactions: [],
        bookmarked: false,
        quote: null,
    }
}