import type { FastifyInstance } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleCallService.js';
import { toLimitToInt } from './timeline.js';


export function apiAccountMastodon(fastify: FastifyInstance): void {

    fastify.get('/api/v1/accounts/verify_credentials', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.verifyAccountCredentials();
            const acct = data.data;
            acct.url = `${BASE_URL}/@${acct.url}`
            acct.note = ''
            acct.avatar_static = acct.avatar
            acct.header = acct.header || ''
            acct.header_static = acct.header || ''
            acct.source = {
                note: acct.note,
                fields: acct.fields,
                privacy: 'public',
                sensitive: false,
                language: ''
            }
            return acct
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.patch('/api/v1/accounts/update_credentials', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.updateCredentials(request.body as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });

    fastify.get('/api/v1/accounts/lookup', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.search((request.query as any).acct, 'accounts');
            return data.data.accounts[0];
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/accounts/:id', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getAccount(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/accounts/:id/statuses', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getAccountStatuses(request.params.id, toLimitToInt(request.query as any));
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/accounts/:id/followers', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getAccountFollowers(request.params.id, request.query as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/accounts/:id/following', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getAccountFollowing(request.params.id, request.query as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get<{ Params: { id: string } }>('/api/v1/accounts/:id/lists', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getAccountLists(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/accounts/:id/follow', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.followAccount(request.params.id);
            const acct = data.data;
            acct.following = true;
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/accounts/:id/unfollow', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.unfollowAccount(request.params.id);
            const acct = data.data;
            acct.following = false;
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/accounts/:id/block', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.blockAccount(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/accounts/:id/unblock', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.unblockAccount(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/accounts/:id/mute', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.muteAccount(request.params.id, request.body as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/accounts/:id/unmute', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.unmuteAccount(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    const relationshopModel = {
        id: '',
        following: false,
        followed_by: false,
        delivery_following: false,
        blocking: false,
        blocked_by: false,
        muting: false,
        muting_notifications: false,
        requested: false,
        domain_blocking: false,
        showing_reblogs: false,
        endorsed: false,
        notifying: false,
        note: ''
      }
    fastify.get('/api/v1/accounts/relationships', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const idsRaw = (request.query as any)['id[]']
            const ids = typeof idsRaw === 'string' ? [idsRaw] : idsRaw
            relationshopModel.id = idsRaw || '1'
            if (!idsRaw) return [relationshopModel]
            const data = await client.getRelationships(ids) as any;
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/api/v1/bookmarks', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getBookmarks(request.query as any) as any;
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/api/v1/favourites', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getFavourites(request.query as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/api/v1/mutes', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getMutes(request.query as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/api/v1/blocks', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getBlocks(request.query as any);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/api/v1/follow_requests', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.getFollowRequests((request.query as any || { limit: 20 }).limit);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/follow_requests/:id/authorize', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.acceptFollowRequest(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.post<{ Params: { id: string } }>('/api/v1/follow_requests/:id/reject', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const data = await client.rejectFollowRequest(request.params.id);
            return data.data;
        } catch (e: any) {
            console.error(e)
            console.error(e.response.data)
            reply.code(401);
            return e.response.data;
        }
    });

}