import type { FastifyInstance } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleService.js';
import fs from 'fs'
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { createTemp } from '@/misc/create-temp.js';
import { emojiRegex, emojiRegexAtStartToEnd } from '@/misc/emoji-regex.js';
const pump = promisify(pipeline);



export function apiStatusMastodon(fastify: FastifyInstance): void {
    fastify.post('/v1/statuses', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const body: any = request.body
            const text = body.status
            const removed = text.replace(/@\S+/g, '').replaceAll(' ', '')
            const isDefaultEmoji = emojiRegexAtStartToEnd.test(removed)
            const isCustomEmoji = /^:[a-zA-Z0-9@_]+:$/.test(removed)
            if (body.in_reply_to_id && isDefaultEmoji || isCustomEmoji) {
                const a = await client.createEmojiReaction(body.in_reply_to_id, removed)
                return a.data
            }
            if (!body.media_ids) delete body.media_ids
            if (body.media_ids && !body.media_ids.length) delete body.media_ids
            const data = await client.postStatus(text, body);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/v1/statuses/:id', async (request, reply) => {
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
    fastify.delete<{ Params: { id: string } }>('/v1/statuses/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.deleteStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/v1/statuses/:id/context', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getStatusContext(request.params.id, request.query as any);
            const status = await client.getStatus(request.params.id);
            const re = status.data.emoji_reactions
            data.data.descendants.unshift(statusModel(status.data.id, status.data.account.id, status.data.emojis, `${re.map((r) => `${r.name.replace('@.', '')} (${r.count}${r.me ? `* ` : ''})`).join('<br />')}`))
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/v1/statuses/:id/reblogged_by', async (request, reply) => {
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
    fastify.get<{ Params: { id: string } }>('/v1/statuses/:id/favourited_by', async (request, reply) => {
        return []
    });
    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/favourite', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.favouriteStatus(request.params.id) as any;
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/unfavourite', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.unfavouriteStatus(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });

    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/reblog', async (request, reply) => {
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

    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/unreblog', async (request, reply) => {
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

    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/bookmark', async (request, reply) => {
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

    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/unbookmark', async (request, reply) => {
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

    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/pin', async (request, reply) => {
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

    fastify.post<{ Params: { id: string } }>('/v1/statuses/:id/unpin', async (request, reply) => {
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

    fastify.post('/v2/media', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const multipartData = await request.file();
            if (!multipartData) return { error: 'No image' };
            const [path] = await createTemp();
            await pump(multipartData.file, fs.createWriteStream(path));
            const image = fs.readFileSync(path);
            const data = await client.uploadMedia(image);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/v1/media/:id', async (request, reply) => {
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
    fastify.put<{ Params: { id: string } }>('/v1/media/:id', async (request, reply) => {
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
    fastify.get<{ Params: { id: string } }>('/v1/polls/:id', async (request, reply) => {
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
    fastify.post<{ Params: { id: string } }>('/v1/polls/:id/votes', async (request, reply) => {
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

export function statusModel(id: string | null, acctId: string | null, emojis: MastodonEntity.Emoji[], content: string) {
    const now = `1970-01-02T00:00:00.000Z`
    return {
        id: '9atm5frjhb',
        created_at: now,
        in_reply_to_id: id,
        in_reply_to_account_id: acctId,
        sensitive: false,
        spoiler_text: '',
        visibility: 'public' as const,
        language: 'en',
        uri: 'https://http.cat/404',
        url: 'https://http.cat/404',
        replies_count: 0,
        reblogs_count: 0,
        favourites_count: 0,
        favourited: false,
        reblogged: false,
        muted: false,
        bookmarked: false,
        pinned: false,
        content: `<p>${content}</p>`,
        reblog: null,
        application: {
            name: '',
            website: null,
        },
        account: {
            id: '9arzuvv0sw',
            username: 'ReactionBot',
            acct: 'ReactionBot',
            display_name: 'ReactionOfThisPost',
            locked: false,
            bot: false,
            created_at: now,
            note: '',
            url: 'https://http.cat/404',
            avatar: 'https://http.cat/404',
            avatar_static: 'https://http.cat/404',
            header: 'https://http.cat/404',
            header_static: 'https://http.cat/404',
            followers_count: 0,
            following_count: 0,
            statuses_count: 0,
            last_status_at: '1970-01-01',
            emojis: [],
            fields: [],
            moved: null
        },
        media_attachments: [],
        mentions: [],
        emojis: emojis,
        tags: [],
        card: null,
        poll: null,
        plain_content: null,
        emoji_reactions: [],
        quote: false
    }
}