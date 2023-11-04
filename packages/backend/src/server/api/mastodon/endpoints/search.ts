import type { FastifyInstance } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleCallService.js';
import axios from 'axios';
import { Converter } from '@cutls/megalodon';
import { toLimitToInt } from './timeline.js';

export function apiSearchMastodon(fastify: FastifyInstance): void {
    fastify.get('/api/v1/search', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const query: any = toLimitToInt(request.query)
            const type = query.type || ''
            const data = await client.search(query.q, type, query);
            return data.data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/api/v2/search', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        const client = getClient(BASE_URL, accessTokens);
        try {
            const query: any = toLimitToInt(request.query)
            const type = query.type
            if (type) {
                const data = await client.search(query.q, type, query);
                return data.data
            } else {
                const acct = await client.search(query.q, 'accounts', query);
                const stat = await client.search(query.q, 'statuses', query);
                const tags = await client.search(query.q, 'hashtags', query);
                return {
                    accounts: acct.data.accounts,
                    statuses: stat.data.statuses,
                    hashtags: tags.data.hashtags
                }
            }
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/api/v1/trends/statuses', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        try {
            const data = await getHighlight(BASE_URL, request.hostname, accessTokens)
            return data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
    fastify.get('/api/v2/suggestions', async (request, reply) => {
        const BASE_URL = request.protocol + '://' + request.hostname;
        const accessTokens = request.headers.authorization;
        try {
            const query: any = request.query
            const data = await getFeaturedUser(BASE_URL, request.hostname, accessTokens, query.limit || 20)
            console.log(data)
            return data;
        } catch (e: any) {
            console.error(e)
            reply.code(401);
            return e.response.data;
        }
    });
}
async function getHighlight(BASE_URL: string, domain: string, accessTokens: string | undefined) {
    const accessTokenArr = accessTokens?.split(' ') ?? [null];
    const accessToken = accessTokenArr[accessTokenArr.length - 1];
    try {
        const api = await axios.post(`${BASE_URL}/api/notes/featured`, {
            i: accessToken
        })
        const data: MisskeyEntity.Note[] = api.data
        return data.map((note) => Converter.note(note, domain))
    } catch (e: any) {
        console.log(e)
        console.log(e.response.data)
        return []
    }
}
async function getFeaturedUser(BASE_URL: string, host: string, accessTokens: string | undefined, limit: number) {
    const accessTokenArr = accessTokens?.split(' ') ?? [null];
    const accessToken = accessTokenArr[accessTokenArr.length - 1];
    try {
        const api = await axios.post(`${BASE_URL}/api/users`, {
            i: accessToken,
            limit,
            origin: "local",
            sort: "+follower",
            state: "alive"
        })
        const data: MisskeyEntity.UserDetail[] = api.data
        console.log(data)
        return data.map((u) => { return { source: "past_interactions", account: Converter.userDetail(u, host) } })
    } catch (e: any) {
        console.log(e)
        console.log(e.response.data)
        return []
    }
}